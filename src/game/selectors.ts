import {createSelector} from 'reselect';
import {GameState, Player, SelectableType} from './models';

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

export const selectViewings = createSelector(selectGame, s => s.viewings);

export const selectViewedIntegrityCards = createSelector(
  selectViewings,
  views => {
    // todo: combine this with the signed in player.
    const visible = new Set<number>();

    for (const view of views) {
      for (let item of view.items) {
        if (item.type === SelectableType.INTEGRITY_CARD) {
          visible.add(item.id!);
        }
      }
    }

    return visible;
  }
);
