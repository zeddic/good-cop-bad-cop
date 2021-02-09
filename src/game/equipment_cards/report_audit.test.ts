import {playEquipment} from '../equipment';
import {
  CardState,
  EquipmentCardType,
  GameItemType,
  GameState,
  SharedGameState,
} from '../models';
import {createBasic4PlayerGame} from '../testing/test_utils';
import {REPORT_AUDIT} from './report_audit';

let state: GameState;
let shared: SharedGameState;

beforeEach(() => {
  state = createBasic4PlayerGame();
  shared = state.shared;

  state.shared.players[0].equipment.push({
    id: 1,
    state: CardState.FACE_DOWN,
    type: EquipmentCardType.REPORT_AUDIT,
  });
});

test('can only be played during the active players turn', () => {
  shared.turn.activePlayer = 1;
  expect(REPORT_AUDIT.canPlay(state, 0)).toBe(false);
  shared.turn.activePlayer = 0;
  expect(REPORT_AUDIT.canPlay(state, 0)).toBe(true);
});

test('can be played', () => {
  shared.players[3].integrityCards[0].state = CardState.FACE_UP;

  // Play the card.
  playEquipment(state, {player: 0, card: 1});

  // Expect Player 1 and 2 were required to reveal something.
  // Player 0 was excluded because they are playing the card.
  // Player 3 was excluded because they have a faceup card.
  expect(shared.selections.length).toBe(2);

  for (const sel of shared.selections) {
    expect([1, 2]).toContain(sel.player);
    expect(sel.query.type).toEqual(GameItemType.INTEGRITY_CARD);
  }
});

export {};
