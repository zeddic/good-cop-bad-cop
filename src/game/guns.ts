import {getPlayer, getPlayerOrCurrent, isBoss, isKingPin} from './utils';
import {CardState, GameStage, GameState, Team} from './models';
import {returnPlayersEquipmentToSupply} from './equipment';

/**
 * Causes the player to pickup a gun, if available.
 */
export function pickupGun(state: GameState, options: {player: number}) {
  const player = getPlayer(state, options.player);

  if (!player) return;
  if (player.gun) return;
  if (state.shared.guns.length === 0) return;

  const gun = state.shared.guns.pop()!;
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
    // console.log('Invalid user specified');
    return;
  }

  if (!target) {
    // console.log(`${options.target} is not a valid player to aim at`);
    return;
  }

  if (!player.gun) {
    // console.log(`Player does not have a gun to aim.`);
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
export function fireGun(state: GameState, options: {player: number}): boolean {
  const player = getPlayer(state, options.player);
  if (!player) {
    return false;
  }

  if (!player.gun) {
    // console.log(`Player ${player.id} is not holding a gun to fire.`);
    return false;
  }

  if (player.gun.aimedAt === undefined) {
    // console.log(`Player ${player.id} has not aimed gun yet`);
    return false;
  }

  const target = getPlayer(state, player.gun.aimedAt);

  if (!target) {
    // console.log(`Cannot fire gun at invalid target ${player.gun.aimedAt}`);
    return false;
  } else if (target.dead) {
    // console.log('Target player is already dead');
    return false;
  }

  state.shared.turn.unresolvedGunShot = {
    player: player.id,
    target: target.id,
    gun: player.gun.id,
  };

  return true;
}

/**
 * Resolves an in-progress gun shot.
 */
export function resolveGunShot(state: GameState) {
  const turn = state.shared.turn;

  if (!turn.unresolvedGunShot) {
    return;
  }

  // Mark it as resolved. Even if we need to give up because the
  // game somehow got into a bad state, we don't want a permanently
  // unresolved gunshot preventing the game from proceeding.
  const gunShot = turn.unresolvedGunShot;
  delete turn.unresolvedGunShot;

  // Return the gun to the supply.
  returnPlayersGunToSupply(state, gunShot.player);

  // Find the target Player
  const target = getPlayer(state, gunShot.target);
  if (!target || target.dead) {
    return;
  }

  // Turn their integrity cards face up
  for (const card of target.integrityCards) {
    if (card.state === CardState.FACE_DOWN) {
      card.state = CardState.FACE_UP;
    }
  }

  // Wound and/or kill them
  target.wounds++;
  if (isBoss(target) && target.wounds === 1) {
    // todo: let them pick an equipment
  } else {
    target.dead = true;
    returnPlayersGunToSupply(state, target.id);
    returnPlayersEquipmentToSupply(state, target.id);
  }

  // TODO: Mark the winner in game state.
  if (isBoss(target) && target.dead) {
    state.shared.stage = GameStage.END_GAME;
    state.shared.winner = isKingPin(target) ? Team.GOOD : Team.BAD;
  }
}

/**
 * If a player has any gun, returns it to the global supply.
 */
export function returnPlayersGunToSupply(state: GameState, playerId: number) {
  const player = getPlayer(state, playerId);
  if (player && player.gun) {
    state.shared.guns.push(player.gun);
    delete player.gun;
  }
}
