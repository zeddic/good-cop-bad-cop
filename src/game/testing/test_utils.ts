import {
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
