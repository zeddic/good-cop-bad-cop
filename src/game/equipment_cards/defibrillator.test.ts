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
import {DEFIBRILLATOR} from './defibrillator';

let state: GameState;
let shared: SharedGameState;

beforeEach(() => {
  state = createBasic4PlayerGame();
  shared = state.shared;
});

test('can not be played if no dead players', () => {
  expect(DEFIBRILLATOR.canPlay(state, 0)).toBe(false);
  state.shared.players[1].dead = true;
  expect(DEFIBRILLATOR.canPlay(state, 0)).toBe(true);
});

test('can be played', () => {
  state.shared.players[1].dead = true;
  state.shared.players[1].wounds = 1;

  state.shared.players[0].equipment.push({
    id: 1,
    state: CardState.FACE_DOWN,
    type: EquipmentCardType.DEFIBRILLATOR,
  });

  // Play the card.
  playEquipment(state, {player: 0, card: 1});

  // Verify you were asked to pick a player.
  expect(shared.selections.length).toBe(1);
  expect(shared.selections[0].player).toBe(0);
  expect(shared.selections[0].query.type).toEqual(GameItemType.PLAYER);

  // Pick a dead player.
  selectItem(state, {item: {id: 1, owner: 1, type: GameItemType.PLAYER}});

  // Verify you are now asked to pick integrity cards.
  expect(shared.selections.length).toBe(1);
  expect(shared.selections[0].player).toBe(0);
  expect(shared.selections[0].query.type).toEqual(GameItemType.INTEGRITY_CARD);

  // Pick 1st card
  const cards = state.shared.players[1].integrityCards;
  selectItem(state, {
    item: {
      id: cards[0].id,
      owner: 1,
      type: GameItemType.INTEGRITY_CARD,
    },
  });

  // Verify player is still dead.
  expect(state.shared.players[1].dead).toBe(true);

  // Pick 2nd card
  selectItem(state, {
    item: {
      id: cards[1].id,
      owner: 1,
      type: GameItemType.INTEGRITY_CARD,
    },
  });

  // Verify player is alive now
  expect(state.shared.players[1].dead).toBe(false);
  expect(state.shared.players[1].wounds).toBe(0);
});

test('it revives immediately if they only have 1 card', () => {
  state.shared.players[1].dead = true;
  state.shared.players[1].wounds = 1;
  state.shared.players[1].integrityCards.splice(1);

  state.shared.players[0].equipment.push({
    id: 1,
    state: CardState.FACE_DOWN,
    type: EquipmentCardType.DEFIBRILLATOR,
  });

  // Play the card.
  playEquipment(state, {player: 0, card: 1});

  // Pick a dead player.
  selectItem(state, {
    item: {id: 1, owner: 1, type: GameItemType.PLAYER},
  });

  // Verify they are revived now.
  expect(state.shared.players[1].dead).toBe(false);
  expect(state.shared.players[1].wounds).toBe(0);
});

export {};
