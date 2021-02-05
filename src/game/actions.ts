import {
  generateId,
  getCurrentPlayer,
  getLocalPlayer,
  getPlayer,
  getPlayerOrCurrent,
  isBoss,
  isKingPin,
  removeItemWithId,
} from './common_utils';
import {getEquipmentConfig} from './equipment';
import {
  CardState,
  EquipmentCard,
  EquipmentCardResult,
  GameItem,
  GameItemType,
  GameStage,
  GameState,
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
  checkIfPlayerHasTooManyEquipmentCards(state, {player: player.id});
}

/**
 * Check if a player has too many equipment cards. If so, asks them to
 * select one to discard.
 */
export function checkIfPlayerHasTooManyEquipmentCards(
  state: GameState,
  options: {player: number}
) {
  const player = getPlayer(state, options.player);
  if (!player || player.equipment.length <= 1) {
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
    task: 'discard_equipment_card',
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
  // Remove it from the player.
  const selected = selection.selected[0]!;
  const player = getPlayer(state, selected.owner!)!;
  const card = removeItemWithId(player.equipment, selection.id)!;

  // Add it back to the supply.
  addEquipmentToSupply(state, card);
}

/**
 * Causes the selected player to play the equipment card.
 */
export function playEquipment(
  state: GameState,
  options: {player: number; card: number}
) {
  // Verify another equipment card isn't already in play.
  const player = getPlayer(state, options.player);
  const turn = state.shared.turn;
  if (!player || turn.unresolvedEquipment) {
    return;
  }

  // Remove the card from the player.
  const card = removeItemWithId(player.equipment, options.card);
  if (!card) {
    return;
  }

  // Lookup the configuration for how this card should work.
  const config = getEquipmentConfig(card.type);
  if (!config) {
    // unsupported
    return;
  }

  // Verify the card works in this situation.
  if (!config.canPlay(state, player.id)) {
    return;
  }

  // Put the card into play.
  card.state = CardState.FACE_UP;
  turn.unresolvedEquipment = {
    player: player.id,
    card,
  };

  // Play!
  const result = config.play(state, player.id);

  // Some cards (rarely) can be resolved immediately after being played.
  // If so, mark it as resolved.
  if (result === EquipmentCardResult.DONE) {
    turn.unresolvedEquipment = undefined;
    addEquipmentToSupply(state, card);
  } else if (result === EquipmentCardResult.PLACED) {
    turn.unresolvedEquipment = undefined;
  }
}

/**
 * Adds an equipment card back to the bottom of the equipment card deck.
 */
function addEquipmentToSupply(state: GameState, card: EquipmentCard) {
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
    task: 'reveal_integrity_card',
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

export function selectItem(state: GameState, item: GameItem) {
  const player = getLocalPlayer(state)!;
  const selections = state.shared.selections;
  const selection = selections.filter(s => s.player === player.id)[0];

  if (!selection) {
    return;
  }

  selection.selected.push(item);

  // Are all items selected?
  if (selection.selected.length < selection.numToSelect) {
    return;
  }

  // Remove the selection
  state.shared.selections = state.shared.selections.filter(
    s => s.id !== selection.id
  );

  // Route it to be handled.
  const tasks = selection.task.split('.');
  const task = tasks.shift();

  if (task === 'reveal_integrity_card') {
    revealSelectedIntegrityCard(state, selection);
  } else if (task === 'discard_equipment_card') {
    discardSelectedEquipmentCard(state, selection);
  } else if (task === 'equipment') {
    handleEquipmentCardSelection(state, selection, tasks);
  }
}

/**
 * Handle item selections that should be routed to an equipment
 * card configurtion.
 */
export function handleEquipmentCardSelection(
  state: GameState,
  selection: Selection,
  tasks: string[]
) {
  const subtask = tasks[1];
  const turn = state.shared.turn;

  const card = state.shared.turn.unresolvedEquipment?.card;
  if (!card) {
    return;
  }

  const config = getEquipmentConfig(card.type);
  if (!config || !config.onSelect) {
    return;
  }

  const result = config.onSelect(state, selection, subtask);

  if (result === EquipmentCardResult.DONE) {
    turn.unresolvedEquipment = undefined;
    addEquipmentToSupply(state, card);
  } else if (result === EquipmentCardResult.PLACED) {
    turn.unresolvedEquipment = undefined;
  }
}
