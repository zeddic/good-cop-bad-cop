import {configureStore} from '@reduxjs/toolkit';
import {gameSlice} from '../game/game_store.ts';

export const store = configureStore({
  reducer: {
    game: gameSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export const selectAll = (state: RootState) => state;
