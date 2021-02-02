import {createSelector} from 'reselect';
import {GameItemType, GameState, Player} from './models';
import {findSelectableItems} from './queries';

export function selectGame(rootState: any): GameState {
  return rootState.game;
}

export const selectCurrentPlayer = createSelector(selectGame, state => {
  const active = state.turn.activePlayer;
  return state.players[active];
});

export const selectTurn = createSelector(selectGame, s => s.turn);

export const selectOrder = createSelector(selectGame, s => s.order);

export const selectPlayersById = createSelector(selectGame, s => s.players);

export const selectPlayers = createSelector(
  selectOrder,
  selectPlayersById,
  (order, playersById) => {
    const list: Player[] = [];
    for (const id of order) {
      const player = playersById[id];
      if (player) list.push(player);
    }

    return list;
  }
);

export const selectGunSupply = createSelector(selectGame, s => s.guns);

export const selectVisibility = createSelector(selectGame, s => s.visibility);

export const selectViewedIntegrityCards = createSelector(
  selectVisibility,
  views => {
    // todo: combine this with the signed in player.
    const visible = new Set<number>();

    for (const view of views) {
      for (let item of view.items) {
        if (item.type === GameItemType.INTEGRITY_CARD) {
          visible.add(item.id!);
        }
      }
    }

    return visible;
  }
);

/**
 * Returns any selections that must be completed to progress the game.
 * Note that selections may be from a mixture of players: not just the current
 * player.
 */
export const selectSelections = createSelector(selectGame, s => s.selections);

/**
 * Selects the first selection that the current player must complete.
 * Returns undefined if there is no pending selection.
 */
export const selectActiveSelection = createSelector(
  selectSelections,
  selectCurrentPlayer,
  (selections, currentPlayer) => {
    return selections.filter(s => s.player === currentPlayer.id)[0];
  }
);

/**
 * Selects if there is a pending selection the current player must address
 * before progressing the game.
 */
export const selectIsActiveSelection = createSelector(
  selectActiveSelection,
  a => !!a
);

/**
 * Selects a structure that contains a Sets identifying any items that
 * passed the firsts of the currently active selection and may be
 * picked by the user.
 */
export const selectSelectableItems = createSelector(
  selectActiveSelection,
  selectPlayers,
  findSelectableItems
);
