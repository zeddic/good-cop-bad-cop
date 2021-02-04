import {
  checkIfPlayerHasTooManyEquipmentCards,
  requirePlayerToRevealAnIntegrityCard,
} from './actions';
import {generateId, getPlayer, removeItemWithId} from './common_utils';
import {
  CardState,
  EquipmentCardConfig,
  EquipmentCardResult,
  EquipmentCardType,
  GameItemType,
  GameState,
  Selection,
} from './models';
import {findItems} from './queries';

// ++++++++++++++++++++++++++++++++++++
// Evidence Bag
// ++++++++++++++++++++++++++++++++++++
const EVIDENCE_BAG_CONFIG: EquipmentCardConfig = {
  type: EquipmentCardType.EVIDENCE_BAG,
  name: 'Evidence Bag',
  description: 'Steal an Equipment card from any player.',
  canPlay: (state: GameState, player: number) => {
    const items = findItems(
      {
        type: GameItemType.EQUIPMENT_CARD,
        filters: [{type: 'is_player', not: true, players: [player]}],
      },
      state
    );
    return items.length > 0;
  },
  play: (state: GameState, player: number) => {
    const selection: Selection = {
      id: generateId(),
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
  },
  onSelect: (state: GameState, selection: Selection, task: string) => {
    const item = selection.selected[0];

    const player = getPlayer(state, selection.player)!;
    const target = getPlayer(state, item.owner!)!;
    const card = removeItemWithId(target.equipment, item.id);

    if (card) {
      player.equipment.push(card);
      checkIfPlayerHasTooManyEquipmentCards(state, {player: player.id});
    }

    return EquipmentCardResult.DONE;
  },
};

// ++++++++++++++++++++++++++++++++++++
// Truth Serum
// ++++++++++++++++++++++++++++++++++++
const TRUTH_SERUM: EquipmentCardConfig = {
  type: EquipmentCardType.TRUTH_SERUM,
  name: 'Truth Serum',
  description:
    'Choose a player. That player chooses one of their ' +
    'face-down integrity cards to turn face-up.',
  canPlay: (state: GameState, player: number) => {
    const targets = findPlayersWithAtLeastOneFacedownIntegrity(state, player);
    return targets.length > 0;
  },
  play: (state: GameState, player: number) => {
    const targets = findPlayersWithAtLeastOneFacedownIntegrity(state, player);
    const selection: Selection = {
      id: generateId(),
      player: player,
      query: {
        type: GameItemType.PLAYER,
        filters: [{type: 'is_player', players: targets}],
      },
      numToSelect: 1,
      selected: [],
      task: 'equipment.truth_serum.select_player',
      description: 'Select a player to target',
      tooltip: 'Force this player to reveal an integrity card',
    };
    state.shared.selections.push(selection);
    return EquipmentCardResult.IN_PROGRESS;
  },
  onSelect: (state: GameState, selection: Selection, task: string) => {
    const target = selection.selected[0].id;
    requirePlayerToRevealAnIntegrityCard(state, {player: target});
    return EquipmentCardResult.DONE;
  },
};

function findPlayersWithAtLeastOneFacedownIntegrity(
  state: GameState,
  excludePlayer: number
) {
  return state.shared.order.filter(id => {
    const player = state.shared.players[id];
    if (!player || id === excludePlayer) {
      return false;
    }

    const foundOne = player.integrityCards.some(card => {
      return card.state === CardState.FACE_DOWN;
    });

    return foundOne;
  });
}

/**
 * Template for easy/copy pasting.
 */
const TEMPLATE: EquipmentCardConfig = {
  type: EquipmentCardType.EVIDENCE_BAG,
  name: 'Some name',
  description: 'Some description',
  canPlay: (state: GameState, player: number) => {
    return true;
  },
  play: (state: GameState, player: number) => {
    return EquipmentCardResult.IN_PROGRESS;
  },
  onSelect: (state: GameState, selection: Selection, task: string) => {
    return EquipmentCardResult.DONE;
  },
};

const EQUIPMENT_CONFIGS: EquipmentCardConfig[] = [
  EVIDENCE_BAG_CONFIG,
  TRUTH_SERUM,
];

const EQUIPMENT_CONFIGS_BY_TYPE = (() => {
  const map = new Map<EquipmentCardType, EquipmentCardConfig>();
  for (const config of EQUIPMENT_CONFIGS) {
    map.set(config.type, config);
  }
  return map;
})();

export function getEquipmentConfig(type: EquipmentCardType) {
  return EQUIPMENT_CONFIGS_BY_TYPE.get(type);
}
