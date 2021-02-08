import {playEquipment} from '../equipment';
import {
  CardState,
  EquipmentCardType,
  GameItemType,
  GameState,
  Player,
  SharedGameState,
} from '../models';
import {selectItem} from '../selections';
import {createBasic4PlayerGame, createGun} from '../testing/test_utils';
import {DEFIBRILLATOR} from './defibrillator';
import {METAL_DETECTOR} from './metal_detector';

let state: GameState;
let shared: SharedGameState;
let player1: Player;
let player2: Player;

beforeEach(() => {
  state = createBasic4PlayerGame();
  shared = state.shared;
  player1 = shared.players[1];
  player2 = shared.players[2];
});

test('can not be played if no players have a gun', () => {
  expect(METAL_DETECTOR.canPlay(state, 0)).toBe(false);
  state.shared.players[1].gun = createGun();
  expect(METAL_DETECTOR.canPlay(state, 0)).toBe(true);
});

test('can not be played if no available cards to flip up', () => {
  state.shared.players[1].gun = createGun();
  state.shared.players[1].integrityCards.forEach(card => {
    card.state = CardState.FACE_UP;
  });
  expect(METAL_DETECTOR.canPlay(state, 0)).toBe(false);
});

test('can be played', () => {
  state.shared.players[0].gun = createGun();
  state.shared.players[1].gun = createGun();
  state.shared.players[2].gun = createGun();
  state.shared.players[3].gun = undefined;
  state.shared.players[0].equipment.push({
    id: 1,
    state: CardState.FACE_DOWN,
    type: EquipmentCardType.METAL_DETECTOR,
  });

  // Play the card.
  playEquipment(state, {player: 0, card: 1});

  // Verify there are now 2 tasks to complete:
  const sels = state.shared.selections;
  expect(sels.length).toBe(2);
  expect(sels[0].query.filters[1]).toEqual({type: 'is_player', players: [1]});
  expect(sels[1].query.filters[1]).toEqual({type: 'is_player', players: [2]});

  // Select a card from player 1
  selectItem(state, {
    id: player1.integrityCards[0].id,
    owner: 1,
    type: GameItemType.INTEGRITY_CARD,
  });

  // Verify visibility granted
  expect(shared.visibility.length).toBe(1);
  expect(shared.visibility[0].player).toBe(0);

  // Select a card from player 2
  selectItem(state, {
    id: player2.integrityCards[0].id,
    owner: 2,
    type: GameItemType.INTEGRITY_CARD,
  });

  // Verify visibility granted
  expect(shared.visibility.length).toBe(2);
  expect(shared.visibility[1].player).toBe(0);
  expect(shared.selections.length).toBe(0);
});

export {};
