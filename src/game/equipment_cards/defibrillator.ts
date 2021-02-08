import {
  EquipmentCardConfig,
  EquipmentCardResult,
  EquipmentCardType,
  GameItemType,
  GameState,
  Selection,
} from '../models';
import {generateSelectionId, getPlayers, removeItemWithId} from '../utils';

/**
 * Can this card be played by this player?
 */
function canPlay(state: GameState, player: number) {
  return isSomePlayerDead(state);
}

/**
 * Play the card.
 */
function play(state: GameState, player: number) {
  const players = getPlayers(state);
  const deadPlayers = players.filter(p => p.dead);
  const deadPlayerIds = deadPlayers.map(p => p.id);

  const selection: Selection = {
    id: generateSelectionId(state),
    player: player,
    query: {
      type: GameItemType.PLAYER,
      filters: [{type: 'is_player', players: deadPlayerIds}],
    },
    numToSelect: 1,
    selected: [],
    task: 'equipment.defibrillator.select_player',
    description: 'Select a player to revive',
    tooltip: 'Revive this player',
  };

  state.shared.selections.push(selection);
  return EquipmentCardResult.IN_PROGRESS;
}

/**
 * Handle a selection routed to this card.
 */
function onSelect(state: GameState, selection: Selection, task: string) {
  if (task === 'select_player') {
    // Stage 1: Player selected a target. Now they must select
    // integrity cards beloning to the target to discard.
    if (targetHasEnoughIntegrityCards(state, selection)) {
      askToPickIntegrityCardsFromTarget(state, selection);
      return EquipmentCardResult.IN_PROGRESS;
    } else {
      revivePlayer(state, selection.selected[0].id);
    }
  } else if (task === 'select_cards') {
    // Stage 2: Player selected cards belonging to the target.
    // Discard them and revive the player.
    discardSelectedIntegrityCards(state, selection);
    revivePlayer(state, selection.selected[0].owner!);
  }

  return EquipmentCardResult.DONE;
}

/**
 * Marks a target player as not dead.
 */
function revivePlayer(state: GameState, targetPlayerId: number) {
  const targetPlayer = state.shared.players[targetPlayerId];
  if (!targetPlayer) return;
  targetPlayer.dead = false;
  targetPlayer.wounds = 0;
}

/**
 * Removes the selected integrity cards from the target player.
 */
function discardSelectedIntegrityCards(state: GameState, selection: Selection) {
  const target = selection.selected[0].owner!;
  const targetPlayer = state.shared.players[target];

  for (const item of selection.selected) {
    removeItemWithId(targetPlayer.integrityCards, item.id);
  }
}

/**
 * Returns true if the target has at 3 integrity cards.
 */
function targetHasEnoughIntegrityCards(state: GameState, selection: Selection) {
  const target = selection.selected[0]!;
  const targetPlayer = state.shared.players[target.id];
  return targetPlayer.integrityCards.length === 3;
}

/**
 * Ask the user playing this card to pick 2 integrity cards from the target
 * player which will be discarded.
 */
function askToPickIntegrityCardsFromTarget(
  state: GameState,
  selection: Selection
) {
  const target = selection.selected[0]!;
  const targetPlayer = state.shared.players[target.id];
  const player = selection.player;

  const cardSelection: Selection = {
    id: generateSelectionId(state),
    player: player,
    query: {
      type: GameItemType.INTEGRITY_CARD,
      filters: [{type: 'is_player', players: [targetPlayer.id]}],
    },
    numToSelect: 2,
    selected: [],
    task: 'equipment.defibrillator.select_cards',
    description: `Select 2 of ${targetPlayer.name}'s integrity cards to discard`,
    tooltip: 'Discard this integrity card',
  };

  state.shared.selections.push(cardSelection);
}

/**
 *
 * @param state
 */
function isSomePlayerDead(state: GameState) {
  const players = getPlayers(state);
  return players.some(p => p.dead);
}

export const DEFIBRILLATOR: EquipmentCardConfig = {
  type: EquipmentCardType.DEFIBRILLATOR,
  name: 'Defibrillator',
  description:
    'Revive a player who was eliminated. Choose and discard two ' +
    'of their integrity cards. Their role is determined by the one integrity ' +
    'card for the rest of this game. You may not use this card on yourself.',
  canPlay,
  play,
  onSelect,
};
