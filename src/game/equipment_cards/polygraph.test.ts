import {playEquipment} from '../equipment';
import {
  CardState,
  EquipmentCardType,
  GameItemType,
  GameState,
  SharedGameState,
} from '../models';
import {selectItem} from '../selections';
import {createBasic4PlayerGame} from '../testing/test_utils';
import {getPlayers} from '../utils';
import {POLYGRAPH} from './polygraph';

let state: GameState;
let shared: SharedGameState;

beforeEach(() => {
  state = createBasic4PlayerGame();
  shared = state.shared;
});

test('can only be played if valid target', () => {
  expect(POLYGRAPH.canPlay(state, 0)).toBe(true);

  const players = getPlayers(state);
  for (const player of players) {
    for (const card of player.integrityCards) {
      card.state = CardState.FACE_UP;
    }
  }

  expect(POLYGRAPH.canPlay(state, 0)).toBe(false);
});

test('can be played', () => {
  state.shared.players[0].equipment.push({
    id: 1,
    state: CardState.FACE_DOWN,
    type: EquipmentCardType.POLYGRAPH,
  });

  // Play the card.
  playEquipment(state, {player: 0, card: 1});

  // Verify you were asked to pick a player.
  expect(shared.selections.length).toBe(1);
  expect(shared.selections[0].player).toBe(0);
  expect(shared.selections[0].query.type).toEqual(GameItemType.PLAYER);

  // Pick player 1
  selectItem(state, {item: {id: 1, owner: 1, type: GameItemType.PLAYER}});

  const player0 = shared.players[0];
  const player1 = shared.players[1];
  const player0CardIds = player0.integrityCards.map(c => c.id);
  const player1CardIds = player1.integrityCards.map(c => c.id);

  expect(shared.visibility.length).toBe(2);
  const v1 = shared.visibility[0];
  const v2 = shared.visibility[1];

  // Verify Player0 sees Player1's cards
  expect(v1.player).toBe(0);
  expect(v1.items.map(i => i.id)).toEqual(player1CardIds);

  // Verify Player1 sees Player0's cards
  expect(v2.player).toBe(1);
  expect(v2.items.map(i => i.id)).toEqual(player0CardIds);
});

export {};
