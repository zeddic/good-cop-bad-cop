import {
  aimGun,
  endTurn,
  getPlayer,
  pickupGun,
  resolveGunShot,
  startGunShot,
} from './gameplay';
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

describe('ending turns', () => {
  let state: GameState;

  beforeEach(() => {
    state = {
      players: [
        createPlayer({id: 0}),
        createPlayer({id: 1}),
        createPlayer({id: 2}),
      ],
      gunsRemaining: 0,
      equipment: [],
      turnDirection: TurnDirection.CLOCKWISE,
      stage: GameStage.PLAYING,
      turn: {
        activePlayer: 0,
        stage: TurnStage.POST,
        actionsLeft: 0,
      },
    };
  });

  test('clockwise', () => {
    state.turnDirection = TurnDirection.CLOCKWISE;
    endTurn(state);
    expect(state.turn.activePlayer).toBe(1);
    expect(state.turn.actionsLeft).toBe(1);
    expect(state.turn.stage).toBe(TurnStage.TAKE_ACTION);
  });

  test('clockwise wrapping', () => {
    state.turnDirection = TurnDirection.CLOCKWISE;
    endTurn(state);
    endTurn(state);
    endTurn(state);
    expect(state.turn.activePlayer).toBe(0);
  });

  test('counter clockwise wrapping', () => {
    state.turnDirection = TurnDirection.COUNTER_CLOCKWISE;
    endTurn(state);
    expect(state.turn.activePlayer).toBe(2);
    endTurn(state);
    endTurn(state);
    expect(state.turn.activePlayer).toBe(0);
  });
});

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
      turnDirection: TurnDirection.CLOCKWISE,
      stage: GameStage.PLAYING,
      turn: {
        activePlayer: 0,
        stage: TurnStage.TAKE_ACTION,
        actionsLeft: 0,
      },
    };
  });

  test('starting gun shot at player', () => {
    pickupGun(state);
    aimGun(state, 1);
    startGunShot(state, 1);
    expect(state.turn.pendingGunShot).toEqual({target: 1});
    expect(state.turn.stage).toEqual(TurnStage.GUN_FIRING);
  });

  test('can not start gun shot when not holding gun', () => {
    startGunShot(state, 1);
    expect(state.turn.pendingGunShot).toBeUndefined();
  });

  test('can kill a regular player', () => {
    pickupGun(state);
    aimGun(state, 1);
    startGunShot(state, 1);
    resolveGunShot(state);

    const target = getPlayer(state, 1)!;

    expect(target.dead).toBe(true);
    expect(target.wounds).toBe(1);
    expect(target.integrityCards.every(c => c.state === FACE_UP)).toBe(true);
  });

  test('can wound a boss', () => {
    pickupGun(state);
    aimGun(state, 2);
    startGunShot(state, 2);
    resolveGunShot(state);

    const target = getPlayer(state, 2)!;
    expect(target.dead).toBe(false);
    expect(target.wounds).toBe(1);
    expect(target.integrityCards.every(c => c.state === FACE_UP)).toBe(true);
  });

  test('can kill a wounded boss', () => {
    const target = getPlayer(state, 2)!;
    target.wounds = 1;

    pickupGun(state);
    aimGun(state, 2);
    startGunShot(state, 2);
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
