import {
  Gun,
  IntegrityCard,
  CardState,
  IntegrityCardType,
  Player,
  GameItemType,
  QueryFilter,
  Selection,
  EquipmentCard,
  EquipmentCardType,
  GameState,
  TurnDirection,
  GameStage,
  TurnStage,
} from '../models';

const GOOD = IntegrityCardType.GOOD;
const BAD = IntegrityCardType.BAD;
const KING_PIN = IntegrityCardType.KING_PIN;
const AGENT = IntegrityCardType.AGENT;

/**
 * Create a basic 4 player game with:
 * - 1 good, 1 bad, 1 agent, 1 kingpin
 * - In the playging stage
 * - With the local player as player 0
 * - All cards face down
 * - Everyone alive
 * - The turn on player 0
 */
export function createBasic4PlayerGame() {
  const state: GameState = {
    local: {
      player: 0,
      debug: false,
    },
    shared: {
      players: {
        0: createPlayer({
          id: 0,
          integrity: [
            createIntegrityCard({type: GOOD}),
            createIntegrityCard({type: GOOD}),
            createIntegrityCard({type: BAD}),
          ],
        }),
        1: createPlayer({
          id: 1,
          integrity: [
            createIntegrityCard({type: GOOD}),
            createIntegrityCard({type: BAD}),
            createIntegrityCard({type: BAD}),
          ],
        }),
        2: createPlayer({
          id: 2,
          integrity: [
            createIntegrityCard({type: BAD}),
            createIntegrityCard({type: AGENT}),
            createIntegrityCard({type: BAD}),
          ],
        }),
        3: createPlayer({
          id: 3,
          integrity: [
            createIntegrityCard({type: GOOD}),
            createIntegrityCard({type: BAD}),
            createIntegrityCard({type: KING_PIN}),
          ],
        }),
      },
      order: [0, 1, 2, 3],
      guns: createGuns({num: 1}),
      equipment: [],
      selections: [],
      visibility: [],
      log: [],
      turnDirection: TurnDirection.CLOCKWISE,
      stage: GameStage.PLAYING,
      turn: {
        activePlayer: 0,
        stage: TurnStage.TAKE_ACTION,
        actionsLeft: 2,
      },
    },
  };

  return state;
}

/**
 * Creates a Player for tests.
 */
export function createPlayer(options: {
  id: number;
  integrity?: IntegrityCard[];
  equipment?: EquipmentCard[];
  gun?: Gun;
}): Player {
  return {
    id: options.id,
    name: `Player ${options.id}`,
    equipment: options.equipment || [],
    integrityCards: options.integrity || [],
    wounds: 0,
    dead: false,
    gun: options.gun,
  };
}

let cardIdGen = 1;

/**
 * Creates an integrity card for tests.
 */
export function createIntegrityCard(options: {
  type?: IntegrityCardType;
  state?: CardState;
  id?: number;
}): IntegrityCard {
  const id = options.id || cardIdGen++;
  const state = options.state || CardState.FACE_DOWN;
  const type = options.type || IntegrityCardType.GOOD;
  return {id, type, state};
}

let equipmentIdGen = 1;

/**
 * Creates an equipment card for testing.
 */
export function createEquipmentCard(
  options: {id?: number; type?: EquipmentCardType} = {}
): EquipmentCard {
  return {
    type: options.type || EquipmentCardType.TRUTH_SERUM,
    id: options.id || equipmentIdGen++,
    state: CardState.FACE_DOWN,
  };
}

/**
 * Creates a list of guns for testing.
 */
export function createGuns(options: {num?: number} = {}) {
  const num = options.num || 4;
  const guns = new Array(options.num).fill(null).map(() => createGun());
  return guns;
}

let gunIdGen = 1;

/**
 * Creates a single gun for tests. Defaults to not being aimed at anyone.
 */
export function createGun(options: {id?: number; aimedAt?: number} = {}): Gun {
  return {
    id: options.id || gunIdGen++,
    aimedAt: options.aimedAt,
  };
}

let selectionIdGen = 1;

/**
 * Creates a selection for tests. Defaults to all integrity cards
 * on the board.
 */
export function createSelection(options: {
  player?: number;
  type?: GameItemType;
  filters?: QueryFilter[];
}): Selection {
  return {
    id: selectionIdGen,
    player: options.player || 1,
    numToSelect: 1,
    selected: [],
    query: {
      type: options.type || GameItemType.INTEGRITY_CARD,
      filters: options.filters || [],
    },
    task: 'noop',
    description: 'Select something!',
  };
}
