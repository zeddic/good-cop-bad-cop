import {playEquipment} from '../equipment';
import {
  CardState,
  EquipmentCardType,
  GameState,
  SharedGameState,
  TurnDirection,
} from '../models';
import {createBasic4PlayerGame} from '../testing/test_utils';

let state: GameState;
let shared: SharedGameState;

beforeEach(() => {
  state = createBasic4PlayerGame();
  shared = state.shared;
  equipCard();
});

test('can be played', () => {
  expect(shared.turnDirection).toEqual(TurnDirection.CLOCKWISE);
  playEquipment(state, {player: 0, card: 1});
  expect(shared.turnDirection).toEqual(TurnDirection.COUNTER_CLOCKWISE);

  equipCard();
  playEquipment(state, {player: 0, card: 1});
  expect(shared.turnDirection).toEqual(TurnDirection.CLOCKWISE);
});

function equipCard() {
  state.shared.players[0].equipment.push({
    id: 1,
    state: CardState.FACE_DOWN,
    type: EquipmentCardType.SMOKE_GRENADE,
  });
}

export {};
