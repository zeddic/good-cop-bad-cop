import {requirePlayerToRevealAnIntegrityCard} from '../integrity_cards';
import {
  CardState,
  EquipmentCardConfig,
  EquipmentCardResult,
  EquipmentCardType,
  GameState,
  Selection,
} from '../models';
import {getAlivePlayers} from '../utils';

/**
 * Can this card be played by this player?
 */
function canPlay(state: GameState, player: number) {
  return state.shared.turn.activePlayer === player;
}

/**
 * Play the card.
 */
function play(state: GameState, player: number) {
  let targets = findPlayersWithOnlyFaceDownCards(state);
  targets = targets.filter(p => p.id !== player);

  for (const target of targets) {
    requirePlayerToRevealAnIntegrityCard(state, {player: target.id});
  }

  return EquipmentCardResult.DONE;
}

/**
 * Handle a selection routed to this card.
 */
function onSelect(state: GameState, selection: Selection, task: string) {
  return EquipmentCardResult.DONE;
}

function findPlayersWithOnlyFaceDownCards(state: GameState) {
  const players = getAlivePlayers(state);
  return players.filter(player => {
    return player.integrityCards.every(
      card => card.state === CardState.FACE_DOWN
    );
  });
}

export const REPORT_AUDIT: EquipmentCardConfig = {
  type: EquipmentCardType.REPORT_AUDIT,
  name: 'Report Audit',
  description:
    'Use only on your turn. This does not count as your action for ' +
    'the turn. Each player who has no face-up Integrity cards must ' +
    'choose one Integrity card to turn face-up.',
  canPlay,
  play,
  onSelect,
};
