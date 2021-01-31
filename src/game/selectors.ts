import {createSelector} from 'reselect';

export function selectGame(rootState: any) {
  return rootState.game;
}

export const selectCurrentPlayer = createSelector(selectGame, state => {
  const active = state.turn.activePlayer;
  return state.players[active];
});

export const selectTurn = createSelector(selectGame, s => s.turn);
