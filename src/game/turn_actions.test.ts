import {
  GameStage,
  GameState,
  IntegrityCard,
  Player,
  TurnDirection,
  TurnStage,
} from './models';
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
      gunsRemaining: 0,
      equipment: [],
      selections: [],
      viewings: [],
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
