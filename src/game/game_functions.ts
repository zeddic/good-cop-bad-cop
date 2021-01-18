import {
  GameStage,
  GameState,
  IntegrityCard,
  IntegrityCardState,
  IntegrityCardType,
  Player,
  TurnDirection,
} from './models';

export function setupGame(numPlayers: number): GameState {
  return {
    players: createPlayers(numPlayers),
    gunsRemaining: getNumberOfGunsForPlayers(numPlayers),
    equipment: [],
    turnDirection: TurnDirection.CLOCKWISE,
    stage: GameStage.PLAYING,
  };
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
      wounds: 0,
      gun: undefined,
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

function createIntegrityCard(type: IntegrityCardType): IntegrityCard {
  return {type, state: IntegrityCardState.FACE_DOWN};
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
