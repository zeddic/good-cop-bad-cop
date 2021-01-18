import {createSlice} from '@reduxjs/toolkit';
import {GameStage, GameState, TurnDirection} from './models';

const INITIAL_STATE: GameState = {
  players: [],
  gunsRemaining: 0,
  equipment: [],
  turnDirection: TurnDirection.CLOCKWISE,
  stage: GameStage.PRE_GAME,
};

export const gameSlice = createSlice({
  name: 'game',
  initialState: INITIAL_STATE,
  reducers: {
    increment: state => {
      state.gunsRemaining += 1;
    },
  },
});
