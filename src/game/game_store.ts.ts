import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {GameStage, GameState, TurnDirection, TurnStage} from './models';
import {setupGame} from './setup';
import {endTurn, turnInvestigatePlayer} from './turn_actions';

const INITIAL_STATE: GameState = {
  players: {},
  order: [],
  guns: [],
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
    pickupGun: state => {},
    aimGun: (state, action: PayloadAction<number>) => {},
    investigate: (state, action: PayloadAction<InvestigateOptions>) => {
      turnInvestigatePlayer(state, {
        target: action.payload.player,
        card: action.payload.card,
      });
    },
    endTurn: state => {
      endTurn(state);
    },
  },
});

export interface InvestigateOptions {
  player: number;
  card: number; // idx
}
