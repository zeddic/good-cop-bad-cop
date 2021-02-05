import {CardState, GameItemType, GameState, Query, Selection} from './models';
import {findItems} from './queries';
import {generateId, getPlayer} from './utils';

/**
 * Investigates a target players integrity card, place it face up.
 */
export function investigatePlayer(
  state: GameState,
  options: {player: number; target: number; card: number}
): boolean {
  // Verify the player/target are valid.
  const target = getPlayer(state, options.target);
  const player = getPlayer(state, options.player);
  if (!target || !player) {
    return false;
  }

  if (target.id === player.id) {
    return false;
  }

  // Validate the card exists.
  const card = target.integrityCards.find(c => c.id === options.card);
  if (!card) {
    return false;
  }

  // Grant the player investigating visibility for this turn.
  state.shared.visibility.push({
    id: generateId(),
    player: player.id,
    items: [
      {
        owner: target.id,
        type: GameItemType.INTEGRITY_CARD,
        id: card.id,
      },
    ],
  });

  return true;
}

/**
 * Checks if a user has any face down integrity cards. If so, requires them
 * to select one to reveal before the game may proceed.
 */
export function requirePlayerToRevealAnIntegrityCard(
  state: GameState,
  options: {player: number}
) {
  const player = getPlayer(state, options.player);

  if (!player) {
    return;
  }

  const query: Query = {
    type: GameItemType.INTEGRITY_CARD,
    filters: [
      {type: 'is_face_down', isFaceDown: true},
      {type: 'is_player', players: [player.id]},
    ],
  };

  if (findItems(query, state).length === 0) {
    return;
  }

  const selection: Selection = {
    id: generateId(),
    player: player?.id,
    query: {
      type: GameItemType.INTEGRITY_CARD,
      filters: [
        {type: 'is_face_down', isFaceDown: true},
        {type: 'is_player', players: [player.id]},
      ],
    },
    numToSelect: 1,
    selected: [],
    task: 'reveal_integrity_card',
    description: 'Select an integrity card to reveal',
    tooltip: 'Reveal this integrity card',
  };

  state.shared.selections.push(selection);
}

/**
 * Reveals the selected integrity card.
 * Triggered after a user selects an integrity card.
 */
export function revealSelectedIntegrityCard(
  state: GameState,
  selection: Selection
) {
  const selected = selection.selected[0]!;
  const player = getPlayer(state, selected.owner!)!;
  const card = player.integrityCards.filter(c => c.id === selected.id);

  if (card.length === 1) {
    card[0].state = CardState.FACE_UP;
  }
}
