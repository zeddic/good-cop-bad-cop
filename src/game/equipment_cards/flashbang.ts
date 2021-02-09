import {shuffle} from 'lodash';
import {
  CardState,
  EquipmentCardConfig,
  EquipmentCardResult,
  EquipmentCardType,
  GameState,
  Selection,
} from '../models';
import {getPlayer} from '../utils';

/**
 * Can this card be played by this player?
 */
function canPlay(state: GameState, player: number) {
  return true;
}

/**
 * Play the card.
 */
function play(state: GameState, playerId: number) {
  const player = getPlayer(state, playerId);
  const cards = player?.integrityCards || [];

  shuffle(cards);

  for (const card of cards) {
    card.state = CardState.FACE_DOWN;
  }

  return EquipmentCardResult.DONE;
}

/**
 * Handle a selection routed to this card.
 */
function onSelect(state: GameState, selection: Selection, task: string) {
  return EquipmentCardResult.DONE;
}

export const FLASHBANG: EquipmentCardConfig = {
  type: EquipmentCardType.FLASHBANG,
  name: 'Flashbang',
  description:
    'Shuffle all of your integrity cards and place them face down ' +
    'in random order. (Yes, I know the card says you get to decide ' +
    'the order, but random was easier to code!)',
  canPlay,
  play,
  onSelect,
};
