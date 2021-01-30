import {aimGun, pickupGun, resolveGunShot, fireGun} from './actions';
import {getPlayer} from './common_utils';
import {
  GameStage,
  GameState,
  IntegrityCard,
  IntegrityCardState,
  IntegrityCardType,
  Player,
  TurnDirection,
  TurnStage,
} from './models';

const GOOD = IntegrityCardType.GOOD;
const BAD = IntegrityCardType.BAD;
const KING_PIN = IntegrityCardType.KING_PIN;
const AGENT = IntegrityCardType.AGENT;
const FACE_UP = IntegrityCardState.FACE_UP;
const FACE_DOWN = IntegrityCardState.FACE_DOWN;

describe('shooting players', () => {
  let state: GameState;

  beforeEach(() => {
    state = {
      players: [
        createPlayer({
          id: 0,
          integrity: [
            {type: GOOD, state: FACE_DOWN},
            {type: GOOD, state: FACE_DOWN},
            {type: BAD, state: FACE_DOWN},
          ],
        }),
        createPlayer({
          id: 1,
          integrity: [
            {type: GOOD, state: FACE_DOWN},
            {type: BAD, state: FACE_UP},
            {type: BAD, state: FACE_DOWN},
          ],
        }),
        createPlayer({
          id: 2,
          integrity: [
            {type: BAD, state: FACE_DOWN},
            {type: AGENT, state: FACE_UP},
            {type: BAD, state: FACE_DOWN},
          ],
        }),
        createPlayer({
          id: 3,
          integrity: [
            {type: GOOD, state: FACE_DOWN},
            {type: BAD, state: FACE_UP},
            {type: KING_PIN, state: FACE_DOWN},
          ],
        }),
      ],
      gunsRemaining: 1,
      equipment: [],
      selections: [],
      viewings: [],
      turnDirection: TurnDirection.CLOCKWISE,
      stage: GameStage.PLAYING,
      turn: {
        activePlayer: 0,
        stage: TurnStage.TAKE_ACTION,
        actionsLeft: 2,
      },
    };
  });

  test('start to shoot gun shot at player', () => {
    pickupGun(state, {player: 0});
    aimGun(state, {player: 0, target: 1});
    fireGun(state, {player: 0});
    expect(state.turn.pendingGunShot).toEqual({target: 1});
  });

  test('can not start gun shot when not holding gun', () => {
    fireGun(state, {player: 0});
    expect(state.turn.pendingGunShot).toBeUndefined();
  });

  test('can kill a regular player', () => {
    pickupGun(state, {player: 0});
    aimGun(state, {player: 0, target: 1});
    fireGun(state, {player: 0});
    resolveGunShot(state);

    const target = getPlayer(state, 1)!;
    expect(target.dead).toBe(true);
    expect(target.wounds).toBe(1);
    expect(target.integrityCards.every(c => c.state === FACE_UP)).toBe(true);
  });

  test('can wound a boss', () => {
    pickupGun(state, {player: 0});
    aimGun(state, {player: 0, target: 2});
    fireGun(state, {player: 0});
    resolveGunShot(state);

    const target = getPlayer(state, 2)!;
    expect(target.dead).toBe(false);
    expect(target.wounds).toBe(1);
    expect(target.integrityCards.every(c => c.state === FACE_UP)).toBe(true);
  });

  test('can kill a wounded boss', () => {
    const target = getPlayer(state, 2)!;
    target.wounds = 1;

    pickupGun(state, {player: 0});
    aimGun(state, {player: 0, target: 2});
    fireGun(state, {player: 0});
    resolveGunShot(state);

    expect(target.dead).toBe(true);
    expect(target.wounds).toBe(2);

    expect(state.stage === GameStage.END_GAME);
  });
});

function createPlayer(options: {
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
