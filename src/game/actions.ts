import {
  generateId,
  getPlayer,
  getPlayerOrCurrent,
  isBoss,
} from './common_utils';
import {
  GameStage,
  GameState,
  IntegrityCardState,
  SelectableType,
} from './models';

/**
 * Investigates a target players integrity card, place it face up.
 */
export function investigatePlayer(
  state: GameState,
  options: {player: number; target: number; card: number}
): boolean {
  // Verify the player/target are valid.
  const target = getPlayer(state, options.target);
  const player = getPlayer(state, options.player);
  if (!target || !player) {
    return false;
  }

  if (target.id === player.id) {
    return false;
  }

  // Validate the card exists.
  const card = target.integrityCards[options.card];
  if (!card) {
    return false;
  }

  // Grant the player investigating visibility for this turn.
  state.viewings.push({
    id: generateId(),
    playerViewing: player.id,
    items: [
      {
        type: SelectableType.INTEGRITY_CARD,
        player: target.id,
        id: card.id,
        fromSupply: false,
      },
    ],
  });

  return true;
}

/**
 * Causes the current player to pickup a gun, if available.
 */
export function pickupGun(state: GameState, options: {player: number}) {
  const player = getPlayer(state, options.player);

  if (!player) return;
  if (player.gun) return;
  if (state.guns.length === 0) return;

  const gun = state.guns.pop()!;
  delete gun.aimedAt;
  player.gun = gun;
}

/**
 * Aims the given players gun at the target.
 * If no player is given, defaults to the current player.
 * Does nothing if the player has no gun.
 */
export function aimGun(
  state: GameState,
  options: {player: number; target: number}
) {
  const player = getPlayerOrCurrent(state, options.player);
  const target = getPlayer(state, options.target);

  if (!player) {
    // TODO: move these consoles to logs
    console.log('Invalid user specified');
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
export function fireGun(state: GameState, options: {player: number}) {
  const player = getPlayer(state, options.player);
  if (!player) return;

  if (!player.gun) {
    console.log(`Player ${player.id} is not holding a gun to fire.`);
    return;
  }

  if (player.gun.aimedAt === undefined) {
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
}

/**
 * Resolves an in-progress gun shot.
 */
export function resolveGunShot(state: GameState) {
  // This dependency on turn in implies my model has something wrong.
  // Should resolve gun shot become a stack outside of turn?
  const turn = state.turn;

  if (!turn.pendingGunShot) return;
  const target = getPlayer(state, turn.pendingGunShot.target);
  if (!target || target.dead) return;

  // TODO: Return the gun to the supply

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
