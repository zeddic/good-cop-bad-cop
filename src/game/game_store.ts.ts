import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {playEquipment, selectItem} from './actions';
import {
  GameItem,
  GameStage,
  GameState,
  TurnDirection,
  TurnStage,
} from './models';
import {setupGame} from './setup';
import {
  endTurn,
  finishActionStage,
  turnAimGun,
  turnFireGun,
  turnInvestigatePlayer,
  turnPickupEquipment,
  turnPickupGun,
  turnResolveGunShot,
} from './turn_actions';

const INITIAL_STATE: GameState = {
  local: {
    player: 0,
  },
  shared: {
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
  },
};

export const gameSlice = createSlice({
  name: 'game',
  initialState: setupGame(4) || INITIAL_STATE, // <-- temporary for testing
  reducers: {
    pickupEquipment: state => {
      turnPickupEquipment(state);
    },
    playEquipment: (state, action: PayloadAction<PlayEquipmentOptions>) => {
      playEquipment(state, action.payload);
    },
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

export interface PlayEquipmentOptions {
  player: number;
  card: number;
}

export interface InvestigateOptions {
  player: number;
  card: number;
}
