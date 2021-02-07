import {Action, configureStore, ThunkAction} from '@reduxjs/toolkit';
import {gameSlice} from '../game/game_store';

export const store = configureStore({
  reducer: {
    game: gameSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export const selectAll = (state: RootState) => state;

export type AppThunk = ThunkAction<void, RootState, unknown, Action<string>>;
