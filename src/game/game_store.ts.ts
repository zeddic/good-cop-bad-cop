import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {GameStage, GameState, TurnDirection, TurnStage} from './models';
import {setupGame} from './setup';
import {endTurn} from './turn_actions';

const INITIAL_STATE: GameState = {
  players: {},
  order: [],
  gunsRemaining: 0,
  equipment: [],
  selections: [],
  viewings: [],
  turnDirection: TurnDirection.CLOCKWISE,
  stage: GameStage.PRE_GAME,
  turn: {
    activePlayer: 0,
    stage: TurnStage.TAKE_ACTION,
    actionsLeft: 1,
  },
};

export const gameSlice = createSlice({
  name: 'game',
  initialState: setupGame(4), // <-- temporary for testing
  reducers: {
    increment: state => {
      state.gunsRemaining += 1;
    },
    pickupGun: state => {},
    aimGun: (state, action: PayloadAction<number>) => {},
    endTurn: state => {
      endTurn(state);
    },
  },
});
