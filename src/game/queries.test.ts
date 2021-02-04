import {
  CardState,
  IntegrityCardType,
  Player,
  GameItemType,
  Query,
} from './models';
import {
  findSelectableItems,
  findItemsAmongPlayers,
  organizeItems,
} from './queries';
import {
  createEquipmentCard,
  createGun,
  createIntegrityCard,
  createPlayer,
  createSelection,
} from './testing/test_utils';

const GOOD = IntegrityCardType.GOOD;
const BAD = IntegrityCardType.BAD;
const KING_PIN = IntegrityCardType.KING_PIN;
const AGENT = IntegrityCardType.AGENT;
const FACE_UP = CardState.FACE_UP;

let player1: Player;
let player2: Player;
let player3: Player;
let player4: Player;
let players: Player[];

beforeEach(() => {
  player1 = createPlayer({
    id: 1,
    gun: createGun(),
    equipment: [createEquipmentCard()],
    integrity: [
      createIntegrityCard({type: GOOD, state: FACE_UP}),
      createIntegrityCard({type: GOOD, state: FACE_UP}),
      createIntegrityCard({type: BAD}),
    ],
  });

  player2 = createPlayer({
    id: 2,
    integrity: [
      createIntegrityCard({type: GOOD}),
      createIntegrityCard({type: GOOD}),
      createIntegrityCard({type: BAD}),
    ],
  });

  player3 = createPlayer({
    id: 3,
    equipment: [createEquipmentCard()],
    integrity: [
      createIntegrityCard({type: BAD}),
      createIntegrityCard({type: AGENT, state: FACE_UP}),
      createIntegrityCard({type: BAD}),
    ],
  });

  player4 = createPlayer({
    id: 4,
    gun: createGun(),
    integrity: [
      createIntegrityCard({type: GOOD}),
      createIntegrityCard({type: BAD, state: FACE_UP}),
      createIntegrityCard({type: KING_PIN}),
    ],
  });

  players = [player1, player2, player3, player4];
});

describe('filtering by player', () => {
  test('can find a single player', () => {
    const query: Query = {
      type: GameItemType.PLAYER,
      filters: [{type: 'is_player', players: [1]}],
    };

    const result = findItemsAmongPlayers(query, players);
    const found = result.map(i => i.id);
    expect(found.length).toBe(1);
    expect(found).toContain(player1.id);
  });

  test('can find mutiple players', () => {
    const query: Query = {
      type: GameItemType.PLAYER,
      filters: [{type: 'is_player', players: [1, 4]}],
    };

    const result = findItemsAmongPlayers(query, players);
    const found = result.map(i => i.id);
    expect(found.length).toBe(2);
    expect(found).toContain(player1.id);
    expect(found).toContain(player4.id);
  });

  test('can find integrity cards', () => {
    const query: Query = {
      type: GameItemType.INTEGRITY_CARD,
      filters: [{type: 'is_player', players: [1, 4]}],
    };

    const expectedIds = [
      ...player1.integrityCards,
      ...player4.integrityCards,
    ].map(c => c.id);

    const result = findItemsAmongPlayers(query, players);
    const found = result.map(i => i.id);

    expect(found.length).toEqual(expectedIds.length);
    for (const id of expectedIds) {
      expect(found).toContain(id);
    }
  });

  test('can find guns', () => {
    const query: Query = {
      type: GameItemType.GUN,
      filters: [{type: 'is_player', players: [4]}],
    };

    const result = findItemsAmongPlayers(query, players);
    1;
    const found = result.map(i => i.id);
    expect(found.length).toBe(1);
    expect(found).toContain(player4.gun!.id);
  });

  test('can find equipment', () => {
    const query: Query = {
      type: GameItemType.EQUIPMENT_CARD,
      filters: [{type: 'is_player', players: [3]}],
    };

    const result = findItemsAmongPlayers(query, players);
    const found = result.map(i => i.id);
    expect(found.length).toBe(1);
    expect(found).toContain(player3.equipment[0]!.id);
  });

  test('can be inverted', () => {
    const query: Query = {
      type: GameItemType.PLAYER,
      filters: [{type: 'is_player', players: [1], not: true}],
    };

    const result = findItemsAmongPlayers(query, players);
    const found = result.map(i => i.id);
    expect(found.length).toBe(3);
    expect(found).toContain(player2.id);
    expect(found).toContain(player3.id);
    expect(found).toContain(player4.id);
  });
});

describe('filtering by face up/face down', () => {
  test('it can find face up cards', () => {
    const query: Query = {
      type: GameItemType.INTEGRITY_CARD,
      filters: [{type: 'is_face_down', isFaceDown: false}],
    };

    const result = findItemsAmongPlayers(query, players);
    const found = result.map(i => i.id);
    expect(found.length).toBe(4);
    expect(found).toContain(player3.integrityCards[1].id);
  });

  test('it can find face down cards', () => {
    const query: Query = {
      type: GameItemType.INTEGRITY_CARD,
      filters: [{type: 'is_face_down', isFaceDown: true}],
    };

    const result = findItemsAmongPlayers(query, players);
    const found = result.map(i => i.id);
    expect(found.length).toBe(8);
    expect(found).not.toContain(player3.integrityCards[1].id);
  });
});

describe('multiple filters', () => {
  test('it can find other player face down cards', () => {
    const query: Query = {
      type: GameItemType.INTEGRITY_CARD,
      filters: [
        {type: 'is_player', players: [1], not: true},
        {type: 'is_face_down', isFaceDown: true},
      ],
    };

    const result = findItemsAmongPlayers(query, players);
    const found = result.map(i => i.id);
    expect(found.length).toBe(7);
    expect(found).not.toContain(player1.integrityCards[0]);
    expect(found).not.toContain(player1.integrityCards[1]);
    expect(found).not.toContain(player1.integrityCards[2]);
  });
});

describe('unfiltered searches', () => {
  test('unrelated items have empty sets in result', () => {
    const query: Query = {
      type: GameItemType.PLAYER,
      filters: [],
    };

    const result = findItemsAmongPlayers(query, players);
    const found = organizeItems(result);
    expect(found.guns.size).toBe(0);
    expect(found.integrityCards.size).toBe(0);
    expect(found.equipmentCards.size).toBe(0);
  });

  test('can find all guns', () => {
    const query: Query = {
      type: GameItemType.GUN,
      filters: [],
    };

    const result = findItemsAmongPlayers(query, players);
    const found = result.map(i => i.id);
    expect(found.length).toBe(2);
    expect(found).toContain(player1.gun!.id);
    expect(found).toContain(player4.gun!.id);
  });
});

test('it can find items using a selection', () => {
  const selection = createSelection({
    type: GameItemType.INTEGRITY_CARD,
    filters: [
      {type: 'is_player', players: [1], not: true},
      {type: 'is_face_down', isFaceDown: true},
    ],
  });

  const result = findSelectableItems(selection, players);
  const found = [...result.integrityCards.keys()];
  expect(found.length).toBe(7);
  expect(found).not.toContain(player1.integrityCards[0]);
  expect(found).not.toContain(player1.integrityCards[1]);
  expect(found).not.toContain(player1.integrityCards[2]);
});

export {};
