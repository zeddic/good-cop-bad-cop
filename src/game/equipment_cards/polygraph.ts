import {
  CardState,
  EquipmentCardConfig,
  EquipmentCardResult,
  EquipmentCardType,
  GameItemType,
  GameState,
  Player,
  Selection,
} from '../models';
import {
  generateSelectionId,
  generateVisibilityId,
  getPlayer,
  getPlayers,
} from '../utils';

/**
 * Can this card be played by this player?
 */
function canPlay(state: GameState, player: number) {
  return getTargetablePlayers(state, player).length > 0;
}

/**
 * Play the card.
 */
function play(state: GameState, player: number) {
  const targets = getTargetablePlayers(state, player).map(p => p.id);

  const selection: Selection = {
    id: generateSelectionId(state),
    player: player,
    query: {
      type: GameItemType.PLAYER,
      filters: [{type: 'is_player', players: targets}],
    },
    numToSelect: 1,
    selected: [],
    task: 'equipment.polygraph.select_player',
    description: 'Select a player to share integrity card visibility with',
    tooltip: 'Share with this player',
  };

  state.shared.selections.push(selection);
  return EquipmentCardResult.IN_PROGRESS;
}

/**
 * Handle a selection routed to this card.
 */
function onSelect(state: GameState, selection: Selection, task: string) {
  const targetId = selection.selected[0].id;
  const player = getPlayer(state, selection.player)!;
  const target = getPlayer(state, targetId)!;

  grantPlayerVisibilityToOthersCards(state, player, target);
  grantPlayerVisibilityToOthersCards(state, target, player);
  return EquipmentCardResult.DONE;
}

function getTargetablePlayers(state: GameState, currentPlayer: number) {
  const players = getPlayers(state);

  return players.filter(player => {
    return (
      player.id !== currentPlayer &&
      !player.dead &&
      player.integrityCards.some(card => card.state === CardState.FACE_DOWN)
    );
  });
}

function grantPlayerVisibilityToOthersCards(
  state: GameState,
  player: Player,
  other: Player
) {
  const items = other.integrityCards.map(card => ({
    owner: other.id,
    type: GameItemType.INTEGRITY_CARD,
    id: card.id,
  }));

  state.shared.visibility.push({
    id: generateVisibilityId(state),
    player: player.id,
    items,
  });
}

export const POLYGRAPH: EquipmentCardConfig = {
  type: EquipmentCardType.POLYGRAPH,
  name: 'Polygraph',
  description:
    'Choose a player and view all of their integrity cards' +
    'then show them all of your integrity cards.',
  canPlay,
  play,
  onSelect,
};
