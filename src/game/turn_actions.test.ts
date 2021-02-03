import {
  GameStage,
  GameState,
  IntegrityCard,
  Player,
  TurnDirection,
  TurnStage,
} from './models';
import {createGuns, createPlayer} from './testing/test_utils';
import {endTurn} from './turn_actions';

describe('ending turns', () => {
  let state: GameState;

  beforeEach(() => {
    state = {
      players: {
        0: createPlayer({id: 0}),
        1: createPlayer({id: 1}),
        2: createPlayer({id: 2}),
      },
      order: [0, 1, 2],
      guns: createGuns(),
      equipment: [],
      selections: [],
      visibility: [],
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

  test('skips dead people', () => {
    state.players[1].dead = true;
    endTurn(state);
    // Expect Player #1 was skipped.
    expect(state.turn.activePlayer).toBe(2);
  });
});
