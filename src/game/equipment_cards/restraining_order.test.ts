import {playEquipment} from '../equipment';
import {aimGun, fireGun, resolveGunShot} from '../guns';
import {
  CardState,
  EquipmentCardType,
  GameItemType,
  GameState,
  IsPlayer,
  SharedGameState,
} from '../models';
import {selectItem} from '../selections';
import {createBasic4PlayerGame, createGun} from '../testing/test_utils';
import {RESTRAINING_ORDER} from './restraining_order';

let state: GameState;
let shared: SharedGameState;

beforeEach(() => {
  state = createBasic4PlayerGame();
  shared = state.shared;

  state.shared.players[0].equipment.push({
    id: 1,
    state: CardState.FACE_DOWN,
    type: EquipmentCardType.RESTRAINING_ORDER,
  });
});

test('can only be played when there is an active gunshot', () => {
  expect(RESTRAINING_ORDER.canPlay(state, 0)).toBe(false);

  shared.players[1].gun = createGun();
  aimGun(state, {player: 1, target: 2});
  expect(RESTRAINING_ORDER.canPlay(state, 0)).toBe(false);

  fireGun(state, {player: 1});
  expect(RESTRAINING_ORDER.canPlay(state, 0)).toBe(true);

  resolveGunShot(state);
  expect(RESTRAINING_ORDER.canPlay(state, 0)).toBe(false);
});

test('can not be played when only two players remain', () => {
  shared.players[1].gun = createGun();
  shared.players[2].dead = true;
  shared.players[3].dead = true;

  aimGun(state, {player: 1, target: 0});
  fireGun(state, {player: 1});

  expect(RESTRAINING_ORDER.canPlay(state, 0)).toBe(false);
});

test('can be played', () => {
  shared.players[1].gun = createGun();
  aimGun(state, {player: 1, target: 2});
  fireGun(state, {player: 1});

  // Play the card.
  playEquipment(state, {player: 0, card: 1});

  // Verify the person who fired the gun has to pick a new target.
  expect(shared.selections.length).toBe(1);
  expect(shared.selections[0].player).toBe(1);

  // Verify they can't pick their original target or themselves
  const filter = shared.selections[0].query.filters[0] as IsPlayer;
  expect(filter.players).toEqual([0, 3]);

  // Pick player
  selectItem(state, {
    player: 1,
    item: {id: 3, owner: 3, type: GameItemType.PLAYER},
  });

  // Verify player 3 is now being shot.
  expect(shared.turn.unresolvedGunShot?.player).toEqual(1);
  expect(shared.turn.unresolvedGunShot?.target).toEqual(3);
});

export {};
