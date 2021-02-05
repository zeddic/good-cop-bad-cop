import {getEquipmentConfig} from './equipment';
import {
  GameStage,
  GameState,
  Gun,
  IntegrityCard,
  CardState,
  IntegrityCardType,
  Player,
  SharedGameState,
  TurnDirection,
  TurnStage,
  EquipmentCard,
  EquipmentCardType,
} from './models';

export function setupGame(numPlayers: number): GameState {
  const shared = createSharedState(numPlayers);

  return {
    shared,
    local: {
      player: shared.order[0],
      debug: true,
    },
  };
}

export function createSharedState(numPlayers: number): SharedGameState {
  const players = createPlayers(numPlayers);

  return {
    players: indexPlayersById(players),
    order: players.map(p => p.id),
    guns: createGunsForPlayers(numPlayers),
    equipment: buildEquipmentDeck(),
    selections: [],
    visibility: [],
    turnDirection: TurnDirection.CLOCKWISE,
    stage: GameStage.PLAYING,
    turn: {
      activePlayer: 0,
      actionsLeft: 1,
      stage: TurnStage.TAKE_ACTION,
    },
  };
}

function createGunsForPlayers(numPlayers: number) {
  const num = getNumberOfGunsForPlayers(numPlayers);
  const guns = new Array(num).fill(null).map(createGun);
  return guns;
}

function getNumberOfGunsForPlayers(numPlayers: number) {
  if (numPlayers <= 5) {
    return 2;
  } else if (numPlayers <= 7) {
    return 3;
  } else {
    return 4;
  }
}

let gunIdGen = 1;

function createGun(): Gun {
  return {
    id: gunIdGen++,
  };
}

function indexPlayersById(players: Player[]): Record<number, Player> {
  const playersById: Record<number, Player> = {};
  for (const player of players) {
    playersById[player.id] = player;
  }
  return playersById;
}

function createPlayers(numPlayers: number) {
  // This logic will change in the future once players join
  // a room and then the cards are delt. For testing, just
  // auto generate the players for now.

  const assignments = getIntegrityCardAssignments(numPlayers);
  const players: Player[] = [];
  for (let i = 0; i < numPlayers; i++) {
    players.push({
      id: i,
      name: `Player ${i}`,
      integrityCards: assignments[i],
      equipment: [],
      gun: undefined,
      wounds: 0,
      dead: false,
    });
  }

  return players;
}

/**
 * Creates an integrity card deck and deals them into sets 3 per player.
 * There is guaranteed to be one player with each boss type card and
 * no player should have both.
 */
export function getIntegrityCardAssignments(numPlayers: number) {
  const deck = buildIntegrityDeck(numPlayers);

  // Because we want to ensure that no one player gets the boss
  // card and no boss card is a 'left-over' card in the deck
  // we split the first N cards into a mini deck and deal from these
  // seperately. The mini deck is guaranteed to have both bosses in it.
  const miniDeckWithBosses = shuffle(deck.splice(0, numPlayers));

  const assignments: IntegrityCard[][] = [];
  for (let i = 0; i < numPlayers; i++) {
    const cards: IntegrityCard[] = [];
    cards.push(createIntegrityCard(miniDeckWithBosses.pop()!));
    cards.push(createIntegrityCard(deck.pop()!));
    cards.push(createIntegrityCard(deck.pop()!));
    assignments.push(cards);
  }

  return assignments;
}

let cardIdGen = 1;

function createIntegrityCard(type: IntegrityCardType): IntegrityCard {
  return {
    id: cardIdGen++,
    type,
    state: CardState.FACE_DOWN,
  };
}

/**
 * Builds a deck appropriate for the number of players. The
 * first two cards are guaranteed to be the KingPing and Agent.
 * The rest of the cards are shuffled.
 */
export function buildIntegrityDeck(numPlayers: number): IntegrityCardType[] {
  let numberPerSide = 5;

  // These match the rules on the cards:
  if (numPlayers >= 5) numberPerSide += 2;
  if (numPlayers >= 6) numberPerSide += 1;
  if (numPlayers >= 7) numberPerSide += 2;
  if (numPlayers >= 8) numberPerSide += 1;

  const deck: IntegrityCardType[] = [];
  for (let i = 0; i < numberPerSide; i++) {
    deck.push(IntegrityCardType.GOOD);
    deck.push(IntegrityCardType.BAD);
  }

  shuffle(deck);
  deck.unshift(IntegrityCardType.AGENT);
  deck.unshift(IntegrityCardType.KING_PIN);
  return deck;
}

/**
 * Builds equipment cards
 */
export function buildEquipmentDeck(): EquipmentCard[] {
  const types = Object.values(EquipmentCardType);
  const cards: EquipmentCard[] = [];
  let id = 1;

  // Just give all the cards. The offical gives
  // different cards for different game sizes, but I prefer
  // the randomness.
  for (const type of types) {
    // Only include cards that we have logic setup for.
    if (!getEquipmentConfig(type)) {
      continue;
    }

    cards.push({
      id: id++,
      type,
      state: CardState.FACE_DOWN,
    });
  }

  return shuffle(cards);
}

/**
 * Shuffles an array in place.
 * Fisher-Yates Shuffle
 */
function shuffle<T>(input: T[]) {
  let i = input.length;
  while (i !== 0) {
    let randomIdx = Math.floor(Math.random() * i--);
    const temp = input[i];
    input[i] = input[randomIdx];
    input[randomIdx] = temp;
  }

  return input;
}
