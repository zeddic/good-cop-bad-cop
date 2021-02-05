import {
  EquipmentCardConfig,
  EquipmentCardResult,
  EquipmentCardType,
  GameState,
  Selection,
} from '../models';

/**
 * Can this card be played by this player?
 */
function canPlay(state: GameState, player: number) {
  return true;
}

/**
 * Play the card.
 */
function play(state: GameState, player: number) {
  return EquipmentCardResult.DONE;
}

/**
 * Handle a selection routed to this card.
 */
function onSelect(state: GameState, selection: Selection, task: string) {
  return EquipmentCardResult.DONE;
}

export const SAMPLE_CONFIG: EquipmentCardConfig = {
  type: EquipmentCardType.TRUTH_SERUM,
  name: 'Name',
  description: 'Card description shown to user',
  canPlay,
  play,
  onSelect,
};
