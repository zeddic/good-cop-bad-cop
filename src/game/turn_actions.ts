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

  const turnDelta = state.turnDirection === TurnDirection.CLOCKWISE ? 1 : -1;

  // Close any granted visibility.
  state.visibility = [];

  // Find the next player.
  const player = state.turn.activePlayer;
  const playerIdx = state.order.findIndex(id => id === player);
  const nextPlayerIdx =
    playerIdx === -1
      ? 0
      : (playerIdx + turnDelta + state.order.length) % state.order.length;
  const nextPlayer = state.players[nextPlayerIdx];

  // Move to the next turn and reset the turn stage.
  state.turn = {
    activePlayer: nextPlayer.id,
    stage: TurnStage.TAKE_ACTION,
    actionsLeft: 1,
  };
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
