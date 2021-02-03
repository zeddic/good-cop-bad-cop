import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  GameItem,
  GameStage,
  GameState,
  TurnDirection,
  TurnStage,
} from './models';
import {selectItem} from './selections';
import {setupGame} from './setup';
import {endTurn, turnInvestigatePlayer, turnPickupGun} from './turn_actions';

const INITIAL_STATE: GameState = {
  players: {},
  order: [],
  guns: [],
  equipment: [],
  selections: [],
  visibility: [],
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
  initialState: setupGame(4) || INITIAL_STATE, // <-- temporary for testing
  reducers: {
    pickupGun: state => {
      turnPickupGun(state);
    },
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
    select: (state, action: PayloadAction<GameItem>) => {
      selectItem(state, action.payload);
    },
  },
});

export interface InvestigateOptions {
  player: number;
  card: number; // idx
}
