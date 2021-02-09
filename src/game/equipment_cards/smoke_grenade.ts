import {
  EquipmentCardConfig,
  EquipmentCardResult,
  EquipmentCardType,
  GameState,
  Selection,
  TurnDirection,
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
  const newDirection =
    state.shared.turnDirection === TurnDirection.CLOCKWISE
      ? TurnDirection.COUNTER_CLOCKWISE
      : TurnDirection.CLOCKWISE;

  state.shared.turnDirection = newDirection;
  return EquipmentCardResult.DONE;
}

/**
 * Handle a selection routed to this card.
 */
function onSelect(state: GameState, selection: Selection, task: string) {
  return EquipmentCardResult.DONE;
}

export const SMOKE_GRENADE: EquipmentCardConfig = {
  type: EquipmentCardType.SMOKE_GRENADE,
  name: 'Smoke Grenade',
  description: 'The turn order is permanently reversed.',
  canPlay,
  play,
  onSelect,
};
