import {isDebuggerStatement} from 'typescript';
import {
  aimGun,
  fireGun,
  investigatePlayer,
  pickupGun,
  requirePlayerToRevealAnIntegrityCard,
  resolveGunShot,
} from './actions';
import {generateId, getCurrentPlayer} from './common_utils';
import {
  GameStage,
  GameState,
  IntegrityCardState,
  Player,
  TurnDirection,
  TurnStage,
  Selection,
  GameItemType,
  Query,
  GameItem,
} from './models';
import {findItems} from './queries';

/**
 * Has the current player investigate another player.
 * Moves forward to the next turn stage.
 */
export function turnInvestigatePlayer(
  state: GameState,
  options: {target: number; card: number}
) {
  // Validate the user has actions left.
  if (state.turn.actionsLeft < 1) {
    return;
  }

  // Validate this is the right stage.
  if (state.turn.stage !== TurnStage.TAKE_ACTION) {
    return;
  }

  // Investigate
  const player = getCurrentPlayer(state)!;
  const success = investigatePlayer(state, {...options, player: player?.id});
  if (!success) {
    return;
  }

  // Update how many actions the player has left.
  state.turn.actionsLeft--;
  if (state.turn.actionsLeft === 0) {
    finishActionStage(state);
  }
}

/**
 * Has the current player to pickup a gun.
 * Moves forward to the next turn stage.
 */
export function turnPickupGun(state: GameState) {
  // Validate the user has actions left.
  if (state.turn.actionsLeft < 1) {
    return;
  }

  // Validate this is the right stage.
  if (state.turn.stage !== TurnStage.TAKE_ACTION) {
    return;
  }

  const player = getCurrentPlayer(state)!;
  pickupGun(state, {player: player.id});

  // Update how many actions the player has left.
  state.turn.actionsLeft--;
  if (state.turn.actionsLeft === 0) {
    finishActionStage(state);
  }

  requirePlayerToRevealAnIntegrityCard(state, {player: player.id});
}

/**
 * Has the current player aim their gun at another.
 * Moves forward to the next turn stage.
 */
export function turnAimGun(state: GameState, options: {target: number}) {
  if (state.turn.stage !== TurnStage.TAKE_AIM) {
    return;
  }

  const player = getCurrentPlayer(state)!;
  aimGun(state, {player: player.id, target: options.target});
  state.turn.stage = TurnStage.POST;
}

/**
 * Has the current player fire their gun.
 * Does nothing if they have no gun.
 */
export function turnFireGun(state: GameState) {
  // Validate the user has actions left.
  if (state.turn.actionsLeft < 1) {
    return;
  }

  // Validate this is the right stage.
  if (state.turn.stage !== TurnStage.TAKE_ACTION) {
    return;
  }

  // Fire the gun
  const player = getCurrentPlayer(state)!;
  const ok = fireGun(state, {player: player.id});
  if (!ok) {
    return;
  }

  state.turn.stage = TurnStage.UNRESOLVED_ACTION;
  state.turn.actionsLeft--;
}

/**
 * Resolve the current players gun shot.
 * Moves forward to the next turn stage afterwards.
 */
export function turnResolveGunShot(state: GameState) {
  resolveGunShot(state);

  if (state.turn.actionsLeft === 0) {
    finishActionStage(state);
  } else {
    state.turn.stage = TurnStage.TAKE_ACTION;
  }
}

/**
 * Ends the current players turn.
 */
export function endTurn(state: GameState) {
  if (state.stage !== GameStage.PLAYING) {
    return;
  }

  // Close any temporarily granted visibility.
  state.visibility = [];

  // Find the next player.
  const currentPlayer = state.turn.activePlayer;
  const nextPlayer = findNextPlayerInTurnOrder(state, currentPlayer);

  // Move to the next turn and reset the turn stage.
  state.turn = {
    activePlayer: nextPlayer,
    stage: TurnStage.TAKE_ACTION,
    actionsLeft: 1,
  };
}

/**
 * Finds the next player after the specified one in the turn order.
 */
function findNextPlayerInTurnOrder(state: GameState, player: number) {
  const deadPlayers = findDeadPlayers(state);
  const order = state.order;

  // Everyone is dead!? Just give up.
  if (deadPlayers.size === order.length) {
    return player;
  }

  // Figure out our current point in the order list and what
  // direction we should be walking.
  const turnDelta = state.turnDirection === TurnDirection.CLOCKWISE ? 1 : -1;
  let playerIdx = order.findIndex(id => id === player);
  playerIdx = playerIdx === -1 ? 0 : playerIdx;

  // Keep walking in the turn direction until we find somone alive.
  do {
    playerIdx =
      (playerIdx + turnDelta + state.order.length) % state.order.length;
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
    card[0].state = IntegrityCardState.FACE_UP;
  }
}

/**
 * Handle the user completing a selection related to their turn.
 */
export function turnHandleSelection(
  state: GameState,
  tasks: string[],
  selection: Selection
) {
  const task = tasks.shift()!;

  if (task === 'reveal_integrity_card') {
    turnRevealIntegrityCard(state, selection);
  } else if (task === 'discard_equipment') {
    // todo
  }
}

// UTILITY FUNCTIONS

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
  state.turn.actionsLeft = 0;
  const player = getCurrentPlayer(state)!;

  if (player.gun) {
    state.turn.stage = TurnStage.TAKE_AIM;
  } else {
    state.turn.stage = TurnStage.POST;
  }
}

export function findDeadPlayers(state: GameState): Set<number> {
  const deadIds = state.order.filter(playerId => {
    return !!state.players[playerId]?.dead;
  });

  return new Set<number>(deadIds);
}
