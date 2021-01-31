export interface GameState {
  players: Record<number, Player>;
  order: number[];
  turn: Turn;
  gunsRemaining: number;
  equipment: EquipmentCard[];
  turnDirection: TurnDirection;
  stage: GameStage;
  selections: Selection[];
  viewings: Viewing[];
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

/**
 * The phases that a players turn progresses through.
 */
export enum TurnStage {
  /**
   * Phase 1: The player can take one of 3 actions: equip, investigate, arm.
   * Some equipment cards also count as an action in this phase.
   */
  TAKE_ACTION = 'take_action',

  /**
   * Phase 1b: The player fired a gun in the action phase and the bullet is
   * traversing to the target player. This is a temporary, timed phased that
   * exists so players may play equipment cards that can interrupt the bullet.
   * After it resolves, play continues to Phase 2.
   */
  GUN_FIRING = 'gun_firing',

  /**
   * Phase 2: The player can pick who to aim their gun at. Only available
   * to players who have a gun. If a player has no gun, they progress
   * immediately to phase 3.
   */
  TAKE_AIM = 'take_aim',

  /**
   * Phase 3: The turn is effectively over. Users may use this time to play
   * any other equipment cards they have before explictly ending their turn.
   */
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

/**
 * Captures that a player is actively viewing a card.
 */
export interface Viewing {
  id: number;
  playerViewing: number;
  description?: string;
  items: SelectedItem[];
}

/**
 * Represents a selection that must be made by a player for the
 * game to proceed. Usually this is in response to an equipment
 * card: "Pick a face down integrity card owned by another player"
 */
export interface Selection {
  id: string;
  player: number;
  type: SelectableType;
  filters: SelectionFilter[];
  count: number;
  selected: SelectedItem[];
}

export enum SelectableType {
  INTEGRITY_CARD = 'integrity_card',
  EQUIPMENT_CARD = 'equipment_card',
  GUN = 'gun',
  PLAYER = 'player',
}

export interface SelectedItem {
  type: SelectableType;
  player?: number;
  index?: number;
  fromSupply?: boolean;
}

export type SelectionFilter = IsOwnedByPlayer | IsFaceDown;

export interface IsOwnedByPlayer {
  type: 'is_owned_by_player';
  players: number[];
}

export interface IsFaceDown {
  type: 'is_face_down';
  isFaceDown: boolean;
}
