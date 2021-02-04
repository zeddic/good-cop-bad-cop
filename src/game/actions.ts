import {
  generateId,
  getPlayer,
  getPlayerOrCurrent,
  isBoss,
  isKingPin,
} from './common_utils';
import {
  GameItemType,
  GameStage,
  GameState,
  CardState,
  Query,
  Selection,
  Team,
} from './models';
import {findItems} from './queries';

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
  const card = target.integrityCards.find(c => c.id === options.card);
  if (!card) {
    return false;
  }

  // Grant the player investigating visibility for this turn.
  state.shared.visibility.push({
    id: generateId(),
    player: player.id,
    items: [
      {
        owner: target.id,
        type: GameItemType.INTEGRITY_CARD,
        id: card.id,
      },
    ],
  });

  return true;
}

/**
 * Causes the player to pickup an equipment card. If they have too many, they
 * will be asked to discard one before gameplay will continue.
 */
export function pickupEquipment(state: GameState, options: {player: number}) {
  const player = getPlayer(state, options.player);
  const supply = state.shared.equipment;

  if (!player) {
    return;
  }

  if (supply.length === 0) {
    return;
  }

  const card = supply.pop()!;
  player.equipment.push(card);

  if (player.equipment.length === 1) {
    return;
  }

  state.shared.selections.push({
    id: generateId(),
    player: player?.id,
    query: {
      type: GameItemType.EQUIPMENT_CARD,
      filters: [{type: 'is_player', players: [player.id]}],
    },
    numToSelect: 1,
    selected: [],
    task: 'general.discard_equipment_card',
    description: 'Select an equipment card to discard',
    tooltip: 'Discard this equipment card',
  });
}

/**
 * Discards the selected equipment card.
 */
export function discardSelectedEquipmentCard(
  state: GameState,
  selection: Selection
) {
  // Find the card.
  const selected = selection.selected[0]!;
  const player = getPlayer(state, selected.owner!)!;
  const card = player.equipment.filter(c => c.id === selected.id)[0]!;

  // Remove it from the player.
  player.equipment = player.equipment.filter(c => c !== card);

  // Add it back to the supply.
  card.state = CardState.FACE_DOWN;
  state.shared.equipment.unshift(card);
}

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
export function fireGun(state: GameState, options: {player: number}): boolean {
  const player = getPlayer(state, options.player);
  if (!player) {
    return false;
  }

  if (!player.gun) {
    console.log(`Player ${player.id} is not holding a gun to fire.`);
    return false;
  }

  if (player.gun.aimedAt === undefined) {
    console.log(`Player ${player.id} has not aimed gun yet`);
    return false;
  }

  const target = getPlayer(state, player.gun.aimedAt);

  if (!target) {
    console.log(`Cannot fire gun at invalid target ${player.gun.aimedAt}`);
    return false;
  } else if (target.dead) {
    console.log('Target player is already dead');
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

/**
 * If a player has an equipement cards, returns them to the global supply.
 */
export function returnPlayersEquipmentToSupply(
  state: GameState,
  playerId: number
) {
  const player = getPlayer(state, playerId);
  if (player && player.equipment) {
    for (const card of player.equipment) {
      state.shared.equipment.unshift(card);
    }
    player.equipment = [];
  }
}

/**
 * Checks if a user has any face down integrity cards. If so, requires them
 * to select one to reveal before the game may proceed.
 */
export function requirePlayerToRevealAnIntegrityCard(
  state: GameState,
  options: {player: number}
) {
  const player = getPlayer(state, options.player);

  if (!player) {
    return;
  }

  const query: Query = {
    type: GameItemType.INTEGRITY_CARD,
    filters: [
      {type: 'is_face_down', isFaceDown: true},
      {type: 'is_player', players: [player.id]},
    ],
  };

  if (findItems(query, state).length === 0) {
    return;
  }

  const selection: Selection = {
    id: generateId(),
    player: player?.id,
    query: {
      type: GameItemType.INTEGRITY_CARD,
      filters: [
        {type: 'is_face_down', isFaceDown: true},
        {type: 'is_player', players: [player.id]},
      ],
    },
    numToSelect: 1,
    selected: [],
    task: 'general.reveal_integrity_card',
    description: 'Select an integrity card to reveal',
    tooltip: 'Reveal this integrity card',
  };

  state.shared.selections.push(selection);
}

/**
 * Reveals the selected integrity card.
 * Triggered after a user selects an integrity card.
 */
export function revealSelectedIntegrityCard(
  state: GameState,
  selection: Selection
) {
  const selected = selection.selected[0]!;
  const player = getPlayer(state, selected.owner!)!;
  const card = player.integrityCards.filter(c => c.id === selected.id);

  if (card.length === 1) {
    card[0].state = CardState.FACE_UP;
  }
}

/**
 * Handle the user completing a selection related to their turn.
 */
export function onGeneralSelection(
  state: GameState,
  tasks: string[],
  selection: Selection
) {
  const task = tasks.shift()!;

  if (task === 'reveal_integrity_card') {
    revealSelectedIntegrityCard(state, selection);
  } else if (task === 'discard_equipment_card') {
    discardSelectedEquipmentCard(state, selection);
  }
}
