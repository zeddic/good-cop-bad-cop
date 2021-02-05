import {getPlayer, generateId, removeItemWithId} from './utils';
import {getEquipmentConfig} from './equipment_config';
import {
  GameState,
  GameItemType,
  CardState,
  EquipmentCardResult,
  EquipmentCard,
  Selection,
} from './models';

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
 * Handle item selections that should be routed to an equipment
 * card configurtion to handle.
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
