import {Gunzip} from 'zlib';
import {Store} from '../shared/store/store';

export class GameStore {
  store: Store<GameState>;

  constructor() {
    this.store = new Store<GameState>({
      players: [],
      gunsRemaining: 0,
      equipment: [],
      turnDirection: TurnDirection.CLOCKWISE,
      stage: GameStage.PRE_GAME,
    });
  }

  state() {
    return this.store;
  }

  increment() {
    this.store.set(draft => {
      // draft.players++;
    });
  }
}

interface GameState {
  players: Player[];
  turn?: Turn;
  gunsRemaining: number;
  equipment: EquipmentCard[];
  turnDirection: TurnDirection;
  stage: GameStage;
}

enum GameStage {
  PRE_GAME = 'pregame',
  PLAYING = 'playing',
  END_GAME = 'end_game',
}

interface Turn {
  activePlayer: number;
  stage: TurnStage;
  actionsLeft: number;
}

enum TurnDirection {
  CLOCKWISE = 'clockwise',
  COUNTER_CLOCKWISE = 'counter_clockwise',
}

enum TurnStage {
  TAKE_ACTION = 'take_action',
  TAKE_AIM = 'take_aim',
  GUN_FIRING = 'gun_firing',
  POST = 'post',
}

interface Player {
  id: number;
  name: string;
  integrityCards: IntegrityCard[];
  equipment: EquipmentCard[];
  wounds: number;
  gun?: Gun;
}

interface Gun {
  aimedAt?: number;
}

interface IntegrityCard {
  type: IntegrityCardType;
  state: IntegrityCardState;
}

enum IntegrityCardType {
  GOOD = 'good',
  BAD = 'bad',
  AGENT = 'agent',
  KING_PIN = 'king_pin',
}

enum IntegrityCardState {
  FACE_UP = 'face_up',
  FACE_DOWN = 'face_down',
}

interface EquipmentCard {
  type: EquipmentCardType;
}

// TODO: Fill out equipment types as extension system
// filled in.
enum EquipmentCardType {
  TRUTH_SERUM = 'truth_serum',
}
