import {
  GameStage,
  GameState,
  IntegrityCardState,
  Player,
  SelectableType,
  TurnDirection,
  TurnStage,
} from './models';

/**
 * Investigates a target players integrity card, place it face up.
 */
export function investigatePlayer(
  state: GameState,
  options: {target: number; card: number}
) {
  // Verify the player/target are valid.
  const target = getPlayer(state, options.target);
  const player = getCurrentPlayer(state)!;
  if (!target || !player) {
    return;
  }

  // Validate the card exists.
  const card = target.integrityCards[options.card];
  if (!card) {
    return;
  }

  // Validate the user has actions left.
  if (state.turn.actionsLeft < 1) {
    return;
  }
  state.turn.actionsLeft--;
  if (state.turn.actionsLeft === 0) {
    finishActionStage(state);
  }

  // Grant the current player visibility for this turn.
  state.viewings.push({
    id: generateId(),
    playerViewing: player.id,
    items: [
      {
        type: SelectableType.INTEGRITY_CARD,
        player: target.id,
        index: options.card,
        fromSupply: false,
      },
    ],
  });
}

/**
 * Causes the current player to pickup a gun, if available.
 */
export function pickupGun(state: GameState, options: {player?: number} = {}) {
  const player = getPlayerOrCurrent(state, options.player);

  if (!player) return;
  if (player.gun) return;
  if (state.gunsRemaining <= 0) return;
  if (state.turn.stage !== TurnStage.TAKE_ACTION) return;
  if (!canTakeAction(state)) return;

  state.gunsRemaining--;
  player.gun = {
    aimedAt: undefined,
  };
}

/**
 * Aims the given players gun at the target.
 * If no player is given, defaults to the current player.
 * Does nothing if the player has no gun.
 */
export function aimGun(
  state: GameState,
  options: {player?: number; target: number}
) {
  const player = getPlayerOrCurrent(state, options.player);
  const target = getPlayer(state, options.target);

  if (!player) {
    console.log('No active player');
    return;
  }

  if (!target) {
    console.log(`${options.target} is not a valid player to aim at`);
    return;
  }

  if (!player.gun) {
    console.log(`Player does not have a gun to aim.`);
    return;
  }

  player.gun.aimedAt = options.target;
}

/**
 * Fires the given players gun at their current target.
 * Does nothing if the player has no gun, or if they haven't aimed at.
 * If no player is specified, defaults to the current player.
 *
 * Note that the shot will not be resolved until {@code resolveGunShot}
 * is called. This gives us time to show the in-progress shot in the
 * UI and players to play equipment cards.
 */
export function fireGun(state: GameState, options: {player?: number} = {}) {
  const player = getPlayerOrCurrent(state, options.player);
  if (!player) return;

  if (!player.gun) {
    console.log(`Player ${player.id} is not holding a gun to fire.`);
    return;
  }

  if (player.gun.aimedAt === undefined) {
    console.log(`Player ${player.id} has not aimed gun yet`);
    return;
  }

  if (!canTakeAction(state)) {
    console.log(`Player is out of actions`);
    return;
  }

  const target = getPlayer(state, player.gun.aimedAt);

  if (!target) {
    console.log(`Cannot fire gun at invalid target ${player.gun.aimedAt}`);
    return;
  } else if (target.dead) {
    console.log('Target player is already dead');
    return;
  }

  state.turn.pendingGunShot = {target: target.id};
  state.turn.stage = TurnStage.GUN_FIRING;
  state.turn.actionsLeft--;
}

/**
 * Resolves an in-progress gun shot.
 */
export function resolveGunShot(state: GameState) {
  const turn = state.turn;

  if (turn.stage !== TurnStage.GUN_FIRING) return;
  turn.stage = TurnStage.POST;

  if (!turn.pendingGunShot) return;
  const target = getPlayer(state, turn.pendingGunShot.target);
  if (!target || target.dead) return;

  // Turn their integrity cards face up
  for (const card of target.integrityCards) {
    if (card.state === IntegrityCardState.FACE_DOWN) {
      card.state = IntegrityCardState.FACE_UP;
    }
  }

  // Wound and/or kill them
  target.wounds++;
  if (isBoss(target) && target.wounds === 1) {
    // todo: let them pick an equipment
  } else {
    target.dead = true;
  }

  // Progress to the next turn stage.
  if (!canTakeAction(state)) {
    finishActionStage(state);
  }

  // TODO: Mark the winner in game state.
  if (isBoss(target) && target.dead) {
    state.stage = GameStage.END_GAME;
  }
}

/**
 * Ends the current players turn.
 */
export function endTurn(state: GameState) {
  if (state.stage !== GameStage.PLAYING) return;

  const turnDelta = state.turnDirection === TurnDirection.CLOCKWISE ? 1 : -1;

  // Close any granted visibility.
  state.viewings = [];

  // Find the next player.
  const player = state.turn.activePlayer;
  const playerIdx = state.players.findIndex(p => p.id === player);
  const nextPlayerIdx =
    playerIdx === -1
      ? 0
      : (playerIdx + turnDelta + state.players.length) % state.players.length;
  const nextPlayer = state.players[nextPlayerIdx];

  // Move to the next turn and reset the turn stage.
  state.turn = {
    activePlayer: nextPlayer.id,
    stage: TurnStage.TAKE_ACTION,
    actionsLeft: 1,
  };
}

// UTILITY RELATED FUNCTIONS

/**
 * Returns true if the current player can take an action still.
 */
export function canTakeAction(state: GameState) {
  return (
    state.turn.stage === TurnStage.TAKE_ACTION && state.turn.actionsLeft > 0
  );
}

/**
 * Finishes the current players action phase. Progresses to TAKE_AIM
 * phase if they have a gun, otherwise goes immediatly to the POST
 * turn phase.
 */
export function finishActionStage(state: GameState) {
  if (state.turn.stage !== TurnStage.TAKE_ACTION) {
    return;
  }

  state.turn.actionsLeft = 0;
  const player = getCurrentPlayer(state)!;

  if (player.gun) {
    state.turn.stage = TurnStage.TAKE_AIM;
  } else {
    state.turn.stage = TurnStage.POST;
  }
}

/**
 * If id is defined, returns a player with that id. If no id is defined,
 * gets the players whose turn is currently active.
 */
export function getPlayerOrCurrent(state: GameState, id?: number) {
  return id === undefined ? getCurrentPlayer(state) : getPlayer(state, id);
}

export function getCurrentPlayer(state: GameState): Player | undefined {
  const id = state.turn.activePlayer;
  return getPlayer(state, id);
}

export function getPlayer(state: GameState, id: number): Player | undefined {
  const player = state.players.find(p => p.id === id);
  return player;
}

function isBoss(player: Player) {
  return isAgent(player) || isKingPin(player);
}

function isAgent(player: Player) {
  return player.integrityCards.some(c => c.type === 'agent');
}

function isKingPin(player: Player) {
  return player.integrityCards.some(c => c.type === 'king_pin');
}

let idGen = 0;
function generateId(): number {
  return idGen++;
}
