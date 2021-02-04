import {aimGun, fireGun, pickupGun, resolveGunShot} from './actions';
import {getPlayer} from './common_utils';
import {
  GameStage,
  GameState,
  CardState,
  IntegrityCardType,
  TurnDirection,
  TurnStage,
} from './models';
import {
  createGuns,
  createIntegrityCard,
  createPlayer,
} from './testing/test_utils';

const GOOD = IntegrityCardType.GOOD;
const BAD = IntegrityCardType.BAD;
const KING_PIN = IntegrityCardType.KING_PIN;
const AGENT = IntegrityCardType.AGENT;
const FACE_UP = CardState.FACE_UP;
const FACE_DOWN = CardState.FACE_DOWN;

describe('shooting players', () => {
  let state: GameState;

  beforeEach(() => {
    state = {
      local: {
        player: 0,
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
              createIntegrityCard({type: AGENT, state: FACE_UP}),
              createIntegrityCard({type: BAD}),
            ],
          }),
          3: createPlayer({
            id: 3,
            integrity: [
              createIntegrityCard({type: GOOD}),
              createIntegrityCard({type: BAD, state: FACE_UP}),
              createIntegrityCard({type: KING_PIN}),
            ],
          }),
        },
        order: [0, 1, 2, 3],
        guns: createGuns({num: 1}),
        equipment: [],
        selections: [],
        visibility: [],
        turnDirection: TurnDirection.CLOCKWISE,
        stage: GameStage.PLAYING,
        turn: {
          activePlayer: 0,
          stage: TurnStage.TAKE_ACTION,
          actionsLeft: 2,
        },
      },
    };
  });

  test('start to shoot gun shot at player', () => {
    pickupGun(state, {player: 0});
    aimGun(state, {player: 0, target: 1});
    fireGun(state, {player: 0});
    expect(state.shared.turn.unresolvedGunShot).toEqual({
      player: 0,
      target: 1,
      gun: 1,
    });
  });

  test('can not start gun shot when not holding gun', () => {
    fireGun(state, {player: 0});
    expect(state.shared.turn.unresolvedGunShot).toBeUndefined();
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

  test('guns are returned to the supply only after the shot is resolved', () => {
    pickupGun(state, {player: 0});
    aimGun(state, {player: 0, target: 1});
    fireGun(state, {player: 0});
    expect(state.shared.guns.length).toBe(0);

    resolveGunShot(state);
    expect(state.shared.guns.length).toBe(1);
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

    expect(state.shared.stage === GameStage.END_GAME);
  });
});
