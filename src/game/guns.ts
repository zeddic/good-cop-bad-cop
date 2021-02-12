import {pickupEquipment, returnPlayersEquipmentToSupply} from './equipment';
import {logInfo} from './logs';
import {CardState, GameStage, GameState, Team} from './models';
import {
  getPlayer,
  getPlayerOrCurrent,
  getPlayers,
  isAgent,
  isBoss,
  isKingPin,
} from './utils';

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

  logInfo(state, `${player.name} picked up a gun`);
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

  logInfo(state, `${player.name} aimed at ${target.name}`);
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

  logInfo(state, `${player.name} shot at ${target.name}!`);
  return true;
}

/**
 * Cancels any unresolved gun shot.
 */
export function cancelUnresolvedGunShot(state: GameState) {
  state.shared.turn.unresolvedGunShot = undefined;
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
  const player = getPlayer(state, gunShot.player)!;
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
  logInfo(state, `${player.name} shot ${target.name}!`);
  target.wounds++;
  if (isBoss(target) && target.wounds === 1) {
    const bossType = isAgent(target) ? 'Agent' : 'Kingpin';
    logInfo(state, `${target.name} was the ${bossType}!`);
    pickupEquipment(state, {player: target.id});
  } else {
    logInfo(state, `${target.name} is dead!`);
    target.dead = true;
    returnPlayersGunToSupply(state, target.id);
    returnPlayersEquipmentToSupply(state, target.id);
  }

  // Killed a boss!
  if (isBoss(target) && target.dead) {
    // End the game.
    state.shared.stage = GameStage.END_GAME;
    state.shared.winner = isKingPin(target) ? Team.GOOD : Team.BAD;

    // Reveal all the cards.
    const players = getPlayers(state);
    for (const player of players) {
      for (const card of player.integrityCards) {
        card.state = CardState.FACE_UP;
      }
      for (const card of player.equipment) {
        card.state = CardState.FACE_UP;
      }
    }

    // Log the details
    const team = state.shared.winner === Team.GOOD ? 'good cops' : 'bad cops';
    logInfo(state, `The ${team} win!`);
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
