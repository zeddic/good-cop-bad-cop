export interface GameState {
  players: Player[];
  turn: Turn;
  gunsRemaining: number;
  equipment: EquipmentCard[];
  turnDirection: TurnDirection;
  stage: GameStage;
}

export enum GameStage {
  PRE_GAME = 'pregame',
  PLAYING = 'playing',
  END_GAME = 'end_game',
}

export interface Turn {
  activePlayer: number;
  stage: TurnStage;
  actionsLeft: number;
  pendingGunShot?: {target: number};
}

export enum TurnDirection {
  CLOCKWISE = 'clockwise',
  COUNTER_CLOCKWISE = 'counter_clockwise',
}

export enum TurnStage {
  TAKE_ACTION = 'take_action',
  TAKE_AIM = 'take_aim',
  GUN_FIRING = 'gun_firing',
  POST = 'post',
}

export interface Player {
  id: number;
  name: string;
  integrityCards: IntegrityCard[];
  equipment: EquipmentCard[];
  wounds: number;
  gun?: Gun;
  dead: boolean;
}

export interface Gun {
  aimedAt?: number;
}

export interface IntegrityCard {
  type: IntegrityCardType;
  state: IntegrityCardState;
}

export enum IntegrityCardType {
  GOOD = 'good',
  BAD = 'bad',
  AGENT = 'agent',
  KING_PIN = 'king_pin',
}

export enum IntegrityCardState {
  FACE_UP = 'face_up',
  FACE_DOWN = 'face_down',
}

export interface EquipmentCard {
  type: EquipmentCardType;
}

// TODO: Fill out equipment types as extension system
// filled in.
export enum EquipmentCardType {
  TRUTH_SERUM = 'truth_serum',
}
