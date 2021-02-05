import {requirePlayerToRevealAnIntegrityCard} from '../integrity_cards';
import {
  EquipmentCardConfig,
  EquipmentCardType,
  GameState,
  GameItemType,
  EquipmentCardResult,
  CardState,
  Selection,
} from '../models';
import {generateId} from '../utils';

/**
 * Can this card be played by this player?
 */
function canPlay(state: GameState, player: number) {
  const targets = findPlayersWithAtLeastOneFacedownIntegrity(state, player);
  return targets.length > 0;
}

/**
 * Play the card.
 */
function play(state: GameState, player: number) {
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
}

/**
 * Handle a selection routed to this card.
 */
function onSelect(state: GameState, selection: Selection, task: string) {
  const target = selection.selected[0].id;
  requirePlayerToRevealAnIntegrityCard(state, {player: target});
  return EquipmentCardResult.DONE;
}

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

export const TRUTH_SERUM: EquipmentCardConfig = {
  type: EquipmentCardType.TRUTH_SERUM,
  name: 'Truth Serum',
  description:
    'Choose a player. That player chooses one of their ' +
    'face-down integrity cards to turn face-up.',
  canPlay,
  play,
  onSelect,
};
