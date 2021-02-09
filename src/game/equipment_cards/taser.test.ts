import {playEquipment} from '../equipment';
import {
  CardState,
  EquipmentCardType,
  GameItemType,
  GameState,
  IsPlayer,
  SharedGameState,
  TurnStage,
} from '../models';
import {selectItem} from '../selections';
import {createBasic4PlayerGame, createGun} from '../testing/test_utils';
import {getPlayers} from '../utils';
import {TASER} from './taser';

let state: GameState;
let shared: SharedGameState;

beforeEach(() => {
  state = createBasic4PlayerGame();
  shared = state.shared;

  state.shared.players[0].equipment.push({
    id: 1,
    state: CardState.FACE_DOWN,
    type: EquipmentCardType.TASER,
  });
});

test('can not be played on other players turn', () => {
  shared.players[1].gun = createGun();
  shared.turn.actionsLeft = 1;
  shared.turn.stage = TurnStage.TAKE_ACTION;
  shared.turn.activePlayer = 1;
  expect(TASER.canPlay(state, 0)).toBe(false);
  shared.turn.activePlayer = 0;
  expect(TASER.canPlay(state, 0)).toBe(true);
});

test('it can only be played if an action is left', () => {
  shared.players[1].gun = createGun();
  shared.turn.actionsLeft = 1;
  shared.turn.stage = TurnStage.TAKE_ACTION;
  shared.turn.activePlayer = 0;
  expect(TASER.canPlay(state, 0)).toBe(true);

  shared.turn.actionsLeft = 0;
  shared.turn.stage = TurnStage.POST;
  expect(TASER.canPlay(state, 0)).toBe(false);
});

test('it can not be played if there are no guns', () => {
  for (const player of getPlayers(state)) {
    player.gun = undefined;
  }

  shared.turn.actionsLeft = 1;
  shared.turn.stage = TurnStage.TAKE_ACTION;
  shared.turn.activePlayer = 0;
  expect(TASER.canPlay(state, 0)).toBe(false);
});

test('can be played', () => {
  // Setup: 2 Players have guns
  const gun1 = createGun();
  const gun2 = createGun();

  shared.players[1].gun = gun1;
  shared.players[2].gun = gun2;

  // Setup: It is player 0's turn.
  shared.turn.actionsLeft = 1;
  shared.turn.stage = TurnStage.TAKE_ACTION;
  shared.turn.activePlayer = 0;

  // Play the card.
  playEquipment(state, {player: 0, card: 1});

  // Expect Player 0 is required to pick a gun.
  expect(shared.selections.length).toBe(1);

  // Verify player 1 and 2 can be targeted
  const query = shared.selections[0].query;
  const filter = query.filters[0] as IsPlayer;
  expect(filter.players).toEqual([1, 2]);

  // Select player 2
  selectItem(state, {
    player: 0,
    item: {
      id: gun2.id,
      type: GameItemType.GUN,
      owner: 2,
    },
  });

  // Verify player 0 now has the gun.
  expect(shared.players[0].gun).toEqual(gun2);
  expect(shared.players[2].gun).toEqual(undefined);

  // Verify player 0 used their action
  expect(shared.turn.actionsLeft).toBe(0);
  expect(shared.turn.stage).toEqual(TurnStage.TAKE_AIM);
});

export {};
