import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import _ from 'lodash';
import {AppThunk} from '../app/store';
import {getGame} from '../firebase/firebase';
import {playEquipment} from './equipment';
import {GameItem, SharedGameState} from './models';
import {selectItem} from './selections';
import {
  createEmptyGame,
  ensureLocalPlayerInGame,
  loadGame,
  resetGame,
  startGame,
  updateLocalPlayerName,
} from './setup';
import {
  emulatePlayer,
  endTurn,
  finishActionStage,
  turnAimGun,
  turnFireGun,
  turnInvestigatePlayer,
  turnPickupEquipment,
  turnPickupGun,
  turnResolveGunShot,
} from './turns';

export const gameSlice = createSlice({
  name: 'game',
  initialState: createEmptyGame(),
  reducers: {
    setName: (state, action: PayloadAction<string>) => {
      updateLocalPlayerName(state, action.payload);
    },
    loadGame: (
      state,
      action: PayloadAction<{gameId: string; shared: SharedGameState}>
    ) => {
      loadGame(state, action.payload.gameId, action.payload.shared);
    },
    updateRemoteState: (state, action: PayloadAction<SharedGameState>) => {
      state.shared = _.cloneDeep(action.payload);
      ensureLocalPlayerInGame(state);
    },
    resetGame: state => {
      resetGame(state);
    },
    startGame: state => {
      startGame(state);
    },
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
    emulatePlayer: (state, action: PayloadAction<number>) => {
      emulatePlayer(state, action.payload);
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

export interface JoinGameOptions {
  shared: SharedGameState;
  gameId: string;
}

export const joinGame = (gameId: string): AppThunk => async dispatch => {
  const shared = await getGame(gameId);
  // TODO: If the game doesn't exist, create one.
  dispatch(gameSlice.actions.loadGame({gameId, shared}));
};
