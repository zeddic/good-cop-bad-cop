/**
 * All state for a game of good-cop-bad-cop.
 */
export interface GameState {
  /**
   * Game state that is synchronized between all players.
   */
  shared: SharedGameState;

  /**
   * State specific to the logged in user.
   */
  local: LocalGameState;
}

/**
 * Overall game state synced between all remote players.
 * This captures who the players are, turn order, cards
 * that are in play, etc.
 */
export interface SharedGameState {
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

/**
 * State that is specific to the local players instance.
 */
export interface LocalGameState {
  /**
   * The id of the local player.
   */
  player: number;

  /**
   * Whether debug mode is one.
   */
  debug?: boolean;
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
  unresolvedEquipment?: UnresolvedEquipment;
}

export interface UnresolvedGunShot {
  player: number;
  target: number;
  gun: number;
}

export interface UnresolvedEquipment {
  player: number;
  card: EquipmentCard;
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
  state: CardState;
}

export enum IntegrityCardType {
  GOOD = 'good',
  BAD = 'bad',
  AGENT = 'agent',
  KING_PIN = 'king_pin',
}

export enum CardState {
  FACE_UP = 'face_up',
  FACE_DOWN = 'face_down',
}

export interface EquipmentCard {
  id: number;
  type: EquipmentCardType;
  state: CardState;
}

export enum EquipmentCardType {
  // Easier to implement
  TRUTH_SERUM = 'truth_serum',
  POLYGRAPH = 'polygraph',
  BLACKMAIL = 'blackmail',
  REPORT_AUDIT = 'report_audit',
  METAL_DETECTOR = 'metal_detector',
  COFFEE = 'coffee',
  SMOKE_GRENADe = 'smoke_grenade',
  WIRETAP = 'wiretap',
  EVIDENCE_BAG = 'evidence_bag',
  TASER = 'taser',
  DEFIBRILLATOR = 'defibrillator',

  // Harder to implement
  FLASHBANG = 'flashbang',
  K9_UNIT = 'k9_unit',
  SURVEILLANCE_CAMERA = 'surveillance_camera',
  PLANTED_EVIDENCE = 'planted_evidence',
  RESTRAINING_ORDER = 'restraining_order',
}

export enum EquipmentCardResult {
  /**
   * The card has been played and there are no more results.
   */
  DONE = 'done',

  /**
   * The card is still in play and can't be discarded yet.
   */
  IN_PROGRESS = 'in_progress',

  /**
   * The card has been played but has some permanent passive effect.
   * It has been placed in front of some target player. However,
   * it should no longer block regular play.
   */
  PLACED = 'placed',
}

/**
 * Configuration settings for an equipment card.
 */
export interface EquipmentCardConfig {
  /**
   * The type of card being configed.
   */
  type: EquipmentCardType;

  /**
   * A user friendly name for it.
   */
  name: string;

  /**
   * The description of what the card does.
   */
  description: string;

  /**
   * A function that returns true if the card can be played right now.
   * Different cards have different restrictions, such as only being
   * playable on your turn or during the action phase.
   *
   * Note: No mater what the card returns here, equipment cards may not
   * stack. One equipment card must be resolved before another equipment
   * card can be played.
   */
  canPlay: (state: GameState, player: number) => boolean;

  /**
   * Plays the equipment card and applies its effects on the game state.
   * Returns whether or not the card is still in progress or has completed.
   */
  play: (state: GameState, player: number) => EquipmentCardResult;

  /**
   * Handles a selection being complete which has been routed to this
   * card. To route a selection to a fn, preface the {@code task} field
   * of your {@code Selection} with `equipment.<card_name>.<your_task_name>`
   *
   * This method will be called with <your_task_name> and the selection upon
   * the user picked all items.
   *
   * Returns whether or not the card is still in progress or has completed.
   */
  onSelect?: (
    state: GameState,
    selection: Selection,
    task: string
  ) => EquipmentCardResult;
}

/**
 * Captures that a player has been temporarily granted visibility
 * to see the face of a card.
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
