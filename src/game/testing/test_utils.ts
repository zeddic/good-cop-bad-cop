import {
  Gun,
  IntegrityCard,
  IntegrityCardState,
  IntegrityCardType,
  Player,
  GameItemType,
  QueryFilter,
  Selection,
  EquipmentCard,
  EquipmentCardType,
} from '../models';

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
  state?: IntegrityCardState;
  id?: number;
}): IntegrityCard {
  const id = options.id || cardIdGen++;
  const state = options.state || IntegrityCardState.FACE_DOWN;
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
