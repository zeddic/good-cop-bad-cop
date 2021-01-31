import {
  Gun,
  IntegrityCard,
  IntegrityCardState,
  IntegrityCardType,
  Player,
} from '../models';

/**
 * Creates a Player for tests.
 */
export function createPlayer(options: {
  id: number;
  integrity?: IntegrityCard[];
}): Player {
  return {
    id: options.id,
    name: `Player ${options.id}`,
    equipment: [],
    integrityCards: options.integrity || [],
    wounds: 0,
    dead: false,
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
export function createGun(options: {aimedAt?: number} = {}): Gun {
  return {
    id: gunIdGen++,
    aimedAt: options.aimedAt,
  };
}
