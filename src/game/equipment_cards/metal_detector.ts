import {requirePlayerToInvestigateOtherPlayer} from '../integrity_cards';
import {
  CardState,
  EquipmentCardConfig,
  EquipmentCardResult,
  EquipmentCardType,
  GameState,
  Selection,
} from '../models';
import {getPlayers} from '../utils';

/**
 * Can this card be played by this player?
 */
function canPlay(state: GameState, player: number) {
  return findOtherInvestigateablePlayersWithGuns(state, player).length > 0;
}

/**
 * Play the card.
 */
function play(state: GameState, player: number) {
  const others = findOtherInvestigateablePlayersWithGuns(state, player);

  for (const other of others) {
    requirePlayerToInvestigateOtherPlayer(state, {player, target: other.id});
  }

  return EquipmentCardResult.DONE;
}

/**
 * Handle a selection routed to this card.
 */
function onSelect(state: GameState, selection: Selection, task: string) {
  return EquipmentCardResult.DONE;
}

function findOtherInvestigateablePlayersWithGuns(
  state: GameState,
  currentPlayer: number
) {
  const players = getPlayers(state);
  const withGuns = players.filter(p => {
    return (
      p.gun &&
      !p.dead &&
      p.id !== currentPlayer &&
      p.integrityCards.some(card => card.state === CardState.FACE_DOWN)
    );
  });
  return withGuns;
}

export const METAL_DETECTOR: EquipmentCardConfig = {
  type: EquipmentCardType.METAL_DETECTOR,
  name: 'Metal detector',
  description: 'Investigate each player who is holding a gun',
  canPlay,
  play,
  onSelect,
};
