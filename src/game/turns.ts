import {getCurrentPlayer} from './utils';
import {
  GameStage,
  GameState,
  CardState,
  Selection,
  TurnDirection,
  TurnStage,
} from './models';
import {pickupEquipment} from './equipment';
import {pickupGun, aimGun, fireGun, resolveGunShot} from './guns';
import {
  investigateIntegrityCard,
  requirePlayerToRevealAnIntegrityCard,
} from './integrity_cards';

/**
 * Has the current player investigate another player.
 * Moves forward to the next turn stage.
 */
export function turnInvestigatePlayer(
  state: GameState,
  options: {target: number; card: number}
) {
  // Validate the user has actions left.
  if (state.shared.turn.actionsLeft < 1) {
    return;
  }

  // Validate this is the right stage.
  if (state.shared.turn.stage !== TurnStage.TAKE_ACTION) {
    return;
  }

  // Investigate
  const player = getCurrentPlayer(state)!;
  const success = investigateIntegrityCard(state, {
    ...options,
    player: player?.id,
  });
  if (!success) {
    return;
  }

  // Update how many actions the player has left.
  state.shared.turn.actionsLeft--;
  if (state.shared.turn.actionsLeft === 0) {
    finishActionStage(state);
  }
}

/**
 * Has the current player pickup an equipment card.
 */
export function turnPickupEquipment(state: GameState) {
  if (!canTakeAction(state)) {
    return;
  }

  const player = getCurrentPlayer(state)!;
  pickupEquipment(state, {player: player.id});

  // Update how many actions the player has left.
  state.shared.turn.actionsLeft--;
  if (state.shared.turn.actionsLeft === 0) {
    finishActionStage(state);
  }

  requirePlayerToRevealAnIntegrityCard(state, {player: player.id});
}

/**
 * Has the current player to pickup a gun.
 * Moves forward to the next turn stage.
 */
export function turnPickupGun(state: GameState) {
  if (!canTakeAction(state)) {
    return;
  }

  const player = getCurrentPlayer(state)!;
  pickupGun(state, {player: player.id});

  // Update how many actions the player has left.
  state.shared.turn.actionsLeft--;
  if (state.shared.turn.actionsLeft === 0) {
    finishActionStage(state);
  }

  requirePlayerToRevealAnIntegrityCard(state, {player: player.id});
}

/**
 * Has the current player aim their gun at another.
 * Moves forward to the next turn stage.
 */
export function turnAimGun(state: GameState, options: {target: number}) {
  if (state.shared.turn.stage !== TurnStage.TAKE_AIM) {
    return;
  }

  const player = getCurrentPlayer(state)!;
  aimGun(state, {player: player.id, target: options.target});
  state.shared.turn.stage = TurnStage.POST;
}

/**
 * Has the current player fire their gun.
 * Does nothing if they have no gun.
 */
export function turnFireGun(state: GameState) {
  // Validate the user has actions left.
  if (state.shared.turn.actionsLeft < 1) {
    return;
  }

  // Validate this is the right stage.
  if (state.shared.turn.stage !== TurnStage.TAKE_ACTION) {
    return;
  }

  // Fire the gun
  const player = getCurrentPlayer(state)!;
  const ok = fireGun(state, {player: player.id});
  if (!ok) {
    return;
  }

  state.shared.turn.stage = TurnStage.UNRESOLVED_ACTION;
  state.shared.turn.actionsLeft--;
}

/**
 * Resolve the current players gun shot.
 * Moves forward to the next turn stage afterwards.
 */
export function turnResolveGunShot(state: GameState) {
  resolveGunShot(state);

  if (state.shared.turn.actionsLeft === 0) {
    finishActionStage(state);
  } else {
    state.shared.turn.stage = TurnStage.TAKE_ACTION;
  }
}

/**
 * Ends the current players turn.
 */
export function endTurn(state: GameState) {
  if (state.shared.stage !== GameStage.PLAYING) {
    return;
  }

  if (
    state.shared.selections.length > 0 ||
    state.shared.turn.unresolvedGunShot !== undefined ||
    state.shared.turn.unresolvedEquipment !== undefined
  ) {
    return;
  }

  // Close any temporarily granted visibility.
  state.shared.visibility = [];

  // Find the next player.
  const currentPlayer = state.shared.turn.activePlayer;
  const nextPlayer = findNextPlayerInTurnOrder(state, currentPlayer);

  // Move to the next turn and reset the turn stage.
  state.shared.turn = {
    activePlayer: nextPlayer,
    stage: TurnStage.TAKE_ACTION,
    actionsLeft: 1,
  };

  if (state.local.debug) {
    emulatePlayer(state, nextPlayer);
  }
}

export function emulatePlayer(state: GameState, player: number) {
  state.local.player = player;
}

/**
 * Finds the next player after the specified one in the turn order.
 */
function findNextPlayerInTurnOrder(state: GameState, player: number) {
  const deadPlayers = findDeadPlayers(state);
  const order = state.shared.order;
  const turnDirection = state.shared.turnDirection;

  // Everyone is dead!? Just give up.
  if (deadPlayers.size === order.length) {
    return player;
  }

  // Figure out our current point in the order list and what
  // direction we should be walking.
  const turnDelta = turnDirection === TurnDirection.CLOCKWISE ? 1 : -1;
  let playerIdx = order.findIndex(id => id === player);
  playerIdx = playerIdx === -1 ? 0 : playerIdx;

  // Keep walking in the turn direction until we find somone alive.
  do {
    playerIdx = (playerIdx + turnDelta + order.length) % order.length;
  } while (deadPlayers.has(order[playerIdx]));

  return order[playerIdx];
}

/**
 * Reveals the selected integrity card
 */
export function turnRevealIntegrityCard(
  state: GameState,
  selection: Selection
) {
  const selected = selection.selected[0];
  const player = getCurrentPlayer(state)!;
  const card = player.integrityCards.filter(c => c.id === selected.id);

  if (card.length === 1) {
    card[0].state = CardState.FACE_UP;
  }
}

// UTILITY FUNCTIONS

/**
 * Returns true if the current player can take an action still.
 */
function canTakeAction(state: GameState) {
  return (
    state.local.player === state.shared.turn.activePlayer &&
    state.shared.turn.stage === TurnStage.TAKE_ACTION &&
    state.shared.turn.actionsLeft > 0
  );
}

/**
 * Finishes the current players action phase. Progresses to TAKE_AIM
 * phase if they have a gun, otherwise goes immediatly to the POST
 * turn phase.
 */
export function finishActionStage(state: GameState) {
  state.shared.turn.actionsLeft = 0;
  const player = getCurrentPlayer(state)!;

  if (player.gun) {
    state.shared.turn.stage = TurnStage.TAKE_AIM;
  } else {
    state.shared.turn.stage = TurnStage.POST;
  }
}

function findDeadPlayers(state: GameState): Set<number> {
  const deadIds = state.shared.order.filter(playerId => {
    return !!state.shared.players[playerId]?.dead;
  });

  return new Set<number>(deadIds);
}
