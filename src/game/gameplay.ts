import {
  GameStage,
  GameState,
  IntegrityCardState,
  Player,
  TurnDirection,
  TurnStage,
} from './models';

/**
 * Causes the current player to pickup a gun, if available.
 */
export function pickupGun(state: GameState, options: {player?: number} = {}) {
  const player = getPlayerOrCurrent(state, options.player);

  if (!player) return;
  if (player.gun) return;
  if (state.gunsRemaining <= 0) return;
  if (state.turn.stage !== TurnStage.TAKE_ACTION) return;

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
  } else if (player.gun.aimedAt === undefined) {
    console.log(`Player ${player.id} has not aimed gun yet`);
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

  const player = state.turn.activePlayer;
  const playerIdx = state.players.findIndex(p => p.id === player);
  const nextPlayerIdx =
    playerIdx === -1
      ? 0
      : (playerIdx + turnDelta + state.players.length) % state.players.length;
  const nextPlayer = state.players[nextPlayerIdx];

  state.turn = {
    activePlayer: nextPlayer.id,
    stage: TurnStage.TAKE_ACTION,
    actionsLeft: 1,
  };
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
