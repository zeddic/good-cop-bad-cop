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
export function pickupGun(state: GameState) {
  const player = getCurrentPlayer(state);
  if (!player) return;
  if (player.gun) return;
  if (state.gunsRemaining <= 0) return;
  if (state.turn.stage !== TurnStage.TAKE_ACTION) return;

  state.gunsRemaining--;
  player.gun = {
    aimedAt: undefined,
  };
}

export function aimGun(state: GameState, targetId: number) {
  const player = getCurrentPlayer(state);
  const target = getPlayer(state, targetId);

  if (!player) {
    console.warn('No active player');
    return;
  }

  if (!target) {
    console.warn(`${targetId} is not a valid player to aim at`);
    return;
  }

  if (!player.gun) {
    console.warn(`Player does not have a gun to aim.`);
    return;
  }

  player.gun.aimedAt = targetId;
}

/**
 * Starts a gun shot at the player with the given id.
 * At some later point, the gun shot should be resolved using
 * `resolveGunShot` after players have had an opportunity to react
 * with equipemnt cards.
 */
export function startGunShot(state: GameState, targetId: number) {
  const player = getCurrentPlayer(state);
  const target = getPlayer(state, targetId);
  if (!player || !target) return;
  if (!player.gun || target.dead) return;

  state.turn.pendingGunShot = {target: targetId};
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
