import {getEquipmentConfig} from './equipment_config';
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
import {generatePlayerId} from './utils';

/**
 * Creates an empty GameState.
 */
export function createEmptyGame(): GameState {
  return {
    local: {
      debug: false,
    },
    shared: createEmptySharedPreGame(),
  };
}

/**
 * Creates an empty shared GameState, initialized with no players in
 * the PRE_GAME stage.
 */
export function createEmptySharedPreGame(): SharedGameState {
  return {
    players: {},
    order: [],
    guns: [],
    equipment: [],
    selections: [],
    visibility: [],
    turnDirection: TurnDirection.CLOCKWISE,
    stage: GameStage.PRE_GAME,
    turn: {
      activePlayer: 0,
      stage: TurnStage.TAKE_ACTION,
      actionsLeft: 1,
    },
  };
}

/**
 * Initializes the local store's state with a remote shared state that has
 * been obtained.
 */
export function loadGame(
  state: GameState,
  gameId: string,
  shared: SharedGameState
) {
  state.shared = shared;
  state.local.game = gameId;
  ensureLocalPlayerInGame(state);
}

/**
 * Resets the existing game state back to PRE_GAME. Drops all other
 * enrolled players except for the current player.
 */
export function resetGame(state: GameState) {
  state.shared = createEmptySharedPreGame();
  ensureLocalPlayerInGame(state);
}

/**
 * Registers the local player into the SharedGameState.
 * Does nothing if the local player is already enrolled.
 */
export function addLocalPlayerToGame(state: GameState) {
  if (isLocalPlayerInGame(state)) {
    return;
  }

  const playerId = state.local.player ?? generatePlayerId(state);
  const name = state.local.name || `Player ${playerId}`;

  state.local.player = playerId;
  state.local.name = name;

  const player: Player = {
    id: playerId,
    name: name,
    spectator: true,
    dead: false,
    equipment: [],
    wounds: 0,
    integrityCards: [],
    gun: undefined,
  };

  state.shared.players[playerId] = player;
  return playerId;
}

/**
 * Ensures that the local player has been registered with the
 * shared game state. Does nothing if they already are, otherwise
 * joins.
 */
export function ensureLocalPlayerInGame(state: GameState) {
  if (!isLocalPlayerInGame(state)) {
    addLocalPlayerToGame(state);
  }
}

/**
 * Returns true if the local player is already a known player in
 * the SharedGameState.
 */
function isLocalPlayerInGame(state: GameState) {
  const playerId = state.local.player;
  const players = state.shared.players;
  return playerId !== undefined && players[playerId];
}

/**
 * Updates the local players registered name.
 */
export function updateLocalPlayerName(state: GameState, name: string) {
  state.local.name = name;
  if (
    state.local.player !== undefined &&
    state.shared.players[state.local.player]
  ) {
    state.shared.players[state.local.player].name = name;
  }
}

/**
 * Starts the game.
 *
 *  - Resets all existing game state (except for the list of players)
 *  - Picks what players get to play (if there are more than 8)
 *  - Decides turn order
 *  - Shuffles / equipment / integrity cards
 *  - Sets the game to PLAYING
 *  - Starts the first turn
 */
export function startGame(state: GameState) {
  // Find everyone that can play.
  // We only have enough for 8 players. If there are more,
  // 8 random players will get to play and the rest will be
  // spectators.
  let playerIds = Object.values(state.shared.players).map(p => p.id);
  shuffle(playerIds);
  if (playerIds.length > 8) {
    playerIds.splice(8);
  }

  const numPlayers = playerIds.length;
  const everyone = Object.values(state.shared.players);
  const playersById = indexPlayersById(everyone);
  const idsThatGetToPlay = new Set<number>(playerIds);

  // Reset all the players to a default state.
  for (const player of everyone) {
    player.integrityCards = [];
    player.equipment = [];
    player.gun = undefined;
    player.wounds = 0;
    player.dead = false;
    player.spectator = !idsThatGetToPlay.has(player.id);
  }

  // Figure out the cards we will play with.
  const guns = createGunsForPlayers(numPlayers);
  const equipment = buildEquipmentDeck();
  const assignments = getIntegrityCardAssignments(numPlayers);

  // Distribute cards from the deck.
  for (const playerId of playerIds) {
    const player = playersById[playerId]!;
    player.integrityCards = assignments.pop()!;
    player.equipment = [equipment.pop()!];
  }

  // Reset the rest of the game state.
  state.shared = {
    ...state.shared,
    order: playerIds,
    guns,
    equipment,
    selections: [],
    visibility: [],
    turnDirection: TurnDirection.CLOCKWISE,
    stage: GameStage.PLAYING,
    turn: {
      activePlayer: playerIds[0],
      stage: TurnStage.TAKE_ACTION,
      actionsLeft: 1,
    },
  };
}

/**
 * Creates a game for debugging / development.
 * It is pre-popualted with the specified number of players.
 */
export function createDebugGame(numPlayers: number): GameState {
  const players = createDebugPlayers(numPlayers);
  const state = createEmptyGame();
  state.local.debug = true;
  state.local.player = players[0].id;

  for (const player of players) {
    state.shared.players[player.id] = player;
  }

  startGame(state);

  return state;
}

/**
 * Create gun objects appropriate for the number of players.
 */
function createGunsForPlayers(numPlayers: number) {
  const num = getNumberOfGunsForPlayers(numPlayers);
  const guns = new Array(num).fill(null).map(createGun);
  return guns;
}

/**
 * Returns the number of guns appropriate for a game with this many players.
 */
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

/**
 * Convers a list of Players to a record object of player id to
 * Player object.
 */
function indexPlayersById(players: Player[]): Record<number, Player> {
  const playersById: Record<number, Player> = {};
  for (const player of players) {
    playersById[player.id] = player;
  }
  return playersById;
}

/**
 * Creates some sample players for debugging.
 */
function createDebugPlayers(numPlayers: number) {
  const players: Player[] = [];
  for (let i = 0; i < numPlayers; i++) {
    players.push({
      id: i,
      name: `Player ${i}`,
      integrityCards: [],
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
