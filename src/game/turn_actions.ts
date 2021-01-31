import {investigatePlayer, pickupGun, resolveGunShot} from './actions';
import {getCurrentPlayer} from './common_utils';
import {GameStage, GameState, TurnDirection, TurnStage} from './models';

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
}

/**
 * Has the current player aim their gun at another.
 * Moves forward to the next turn stage.
 */
export function turnAimGun(state: GameState) {
  if (state.turn.stage !== TurnStage.TAKE_AIM) {
    return;
  }

  const player = getCurrentPlayer(state)!;
  pickupGun(state, {player: player.id});

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

  // TODO: Visit how gun firing is done. We have this special stage,
  // but it is a little odd. It may cause problems if we start having
  // equipement cards that can also trigger gun shots. In which
  // case we could have multiple in progress and things get confusing.
  state.turn.stage = TurnStage.GUN_FIRING;
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
