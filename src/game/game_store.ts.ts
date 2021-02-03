import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {resolveGunShot} from './actions';
import {
  GameItem,
  GameStage,
  GameState,
  TurnDirection,
  TurnStage,
} from './models';
import {selectItem} from './selections';
import {setupGame} from './setup';
import {
  endTurn,
  finishActionStage,
  turnAimGun,
  turnFireGun,
  turnInvestigatePlayer,
  turnPickupGun,
  turnResolveGunShot,
} from './turn_actions';

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
    aimGun: (state, action: PayloadAction<number>) => {
      turnAimGun(state, {target: action.payload});
    },
    fireGun: state => {
      turnFireGun(state);
    },
    investigate: (state, action: PayloadAction<InvestigateOptions>) => {
      turnInvestigatePlayer(state, {
        target: action.payload.player,
        card: action.payload.card,
      });
    },
    resolveGunShot: state => {
      turnResolveGunShot(state);
    },
    skipActionStage: state => {
      finishActionStage(state);
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
