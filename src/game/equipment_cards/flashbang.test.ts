import {playEquipment} from '../equipment';
import {
  CardState,
  EquipmentCardType,
  GameState,
  SharedGameState,
} from '../models';
import {createBasic4PlayerGame} from '../testing/test_utils';

let state: GameState;
let shared: SharedGameState;

beforeEach(() => {
  state = createBasic4PlayerGame();
  shared = state.shared;

  state.shared.players[0].equipment.push({
    id: 1,
    state: CardState.FACE_DOWN,
    type: EquipmentCardType.FLASHBANG,
  });
});

test('can be played', () => {
  for (const card of shared.players[0].integrityCards) {
    card.state = CardState.FACE_UP;
  }

  playEquipment(state, {player: 0, card: 1});

  for (const card of shared.players[0].integrityCards) {
    expect(card.state).toEqual(CardState.FACE_DOWN);
  }
});

export {};
