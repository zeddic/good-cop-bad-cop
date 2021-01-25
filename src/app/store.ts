import {configureStore} from '@reduxjs/toolkit';
import {gameSlice} from '../game/game_store.ts';
// import counterReducer from '../features/counter/counterSlice';

export const store = configureStore({
  reducer: {
    counter: gameSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export const selectAll = (state: RootState) => state;
