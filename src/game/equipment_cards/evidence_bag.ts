import {checkIfPlayerHasTooManyEquipmentCards} from '../equipment';
import {
  EquipmentCardConfig,
  EquipmentCardResult,
  EquipmentCardType,
  GameItemType,
  GameState,
  Selection,
} from '../models';
import {findItems} from '../queries';
import {generateSelectionId, getPlayer, removeItemWithId} from '../utils';

/**
 * Can this card be played by this player?
 */
function canPlay(state: GameState, player: number) {
  const items = findItems(
    {
      type: GameItemType.EQUIPMENT_CARD,
      filters: [{type: 'is_player', not: true, players: [player]}],
    },
    state
  );
  return items.length > 0;
}

/**
 * Play the card.
 */
function play(state: GameState, player: number) {
  const selection: Selection = {
    id: generateSelectionId(state),
    player: player,
    query: {
      type: GameItemType.EQUIPMENT_CARD,
      filters: [{type: 'is_player', not: true, players: [player]}],
    },
    numToSelect: 1,
    selected: [],
    task: 'equipment.evidence_bag.select',
    description: 'Select an equipment card to steal',
    tooltip: 'Steal this card',
  };

  state.shared.selections.push(selection);
  return EquipmentCardResult.IN_PROGRESS;
}

/**
 * Handle a selection routed to this card.
 */
function onSelect(state: GameState, selection: Selection, task: string) {
  const item = selection.selected[0];

  const player = getPlayer(state, selection.player)!;
  const target = getPlayer(state, item.owner!)!;
  const card = removeItemWithId(target.equipment, item.id);

  if (card) {
    player.equipment.push(card);
    checkIfPlayerHasTooManyEquipmentCards(state, {player: player.id});
  }

  return EquipmentCardResult.DONE;
}

export const EVIDENCE_BAG: EquipmentCardConfig = {
  type: EquipmentCardType.EVIDENCE_BAG,
  name: 'Evidence Bag',
  description: 'Steal an Equipment card from any player.',
  canPlay,
  play,
  onSelect,
};
