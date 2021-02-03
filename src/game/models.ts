export interface GameState {
  players: Record<number, Player>;
  order: number[];
  turn: Turn;
  guns: Gun[];
  equipment: EquipmentCard[];
  turnDirection: TurnDirection;
  stage: GameStage;
  selections: Selection[];
  visibility: Visibility[];
  winner?: Team;
}

export enum Team {
  GOOD = 'good',
  BAD = 'bad',
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
  unresolvedGunShot?: UnresolvedGunShot;
}

export interface UnresolvedGunShot {
  player: number;
  target: number;
  gun: number;
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
   * Phase 1b: An action has been taken, but has not been resolved yet.
   * For example, a gun has been fired, but it has not yet hit the
   * target player. While in the unresolved state, players may use
   * equipment cards to change the outcome.
   */
  UNRESOLVED_ACTION = 'unresolved_action',

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
  id: number;
  aimedAt?: number;
}

export interface IntegrityCard {
  id: number;
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
  id: number;
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
export interface Visibility {
  id: number;
  player: number;
  items: GameItem[];
}

export interface GameItem {
  type: GameItemType;
  id: number;
  owner?: number;
}

export enum GameItemType {
  INTEGRITY_CARD = 'integrity_card',
  EQUIPMENT_CARD = 'equipment_card',
  GUN = 'gun',
  PLAYER = 'player',
}

/**
 * Represents a selection that must be made by a player for the
 * game to proceed. Usually this is in response to an equipment
 * card: "Pick a face down integrity card owned by another player"
 */
export interface Selection {
  /**
   * A unique id for this selection.
   */
  id: number;

  /**
   * The player who must make the selection.
   */
  player: number;

  /**
   * A query describing the items the user is allowed
   * to select from.
   */
  query: Query;

  /**
   * The number of items the user must select.
   */
  numToSelect: number;

  /**
   * The items the user has selected so far.
   */
  selected: GameItem[];

  /**
   * An identifier for what should be done after the selection
   * is complete. This can be a dotted string to allow routing
   * of sub tasks:
   *
   * eg:
   * 'turn.reveal_integrity_card'
   * 'equip.planted_evidence.place'
   */
  task: string;

  /**
   * A description of what the selection is for.
   */
  description: string;

  /**
   * An optional tooltip to describe what will happen if this
   * item is picked.
   */
  tooltip?: string;
}

/**
 * Describes a query that identifies pieces on the board.
 */
export interface Query {
  type: GameItemType;
  filters: QueryFilter[];
}

export type QueryFilter = IsPlayer | IsFaceDown;

/**
 * Filters players that have a matching id or items that they own.
 */
export interface IsPlayer {
  type: 'is_player';
  players: number[];
  not?: boolean;
}

/**
 * Filters items that are either face/up or face down.
 * Only applies to IntegrityCards.
 */
export interface IsFaceDown {
  type: 'is_face_down';
  isFaceDown: boolean;
}
