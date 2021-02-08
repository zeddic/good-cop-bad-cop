import {GameState, Player} from './models';

/**
 * If id is defined, returns a player with that id. If no id is defined,
 * gets the players whose turn is currently active.
 */
export function getPlayerOrCurrent(state: GameState, id?: number) {
  return id === undefined ? getCurrentPlayer(state) : getPlayer(state, id);
}

/**
 * Returns the current turn player.
 */
export function getCurrentPlayer(state: GameState): Player | undefined {
  const id = state.shared.turn.activePlayer;
  return getPlayer(state, id);
}

/**
 * Return the player running this terminal.
 */
export function getLocalPlayer(state: GameState): Player | undefined {
  const id = state.local.player;
  return id !== undefined ? getPlayer(state, id) : undefined;
}

/**
 * Finds a player with the given id.
 */
export function getPlayer(state: GameState, id: number): Player | undefined {
  return state.shared.players[id];
}

/**
 * Get a list of all players in the game by their turn order.
 */
export function getPlayers(state: GameState) {
  const list: Player[] = [];
  for (const id of state.shared.order) {
    const player = state.shared.players[id];
    if (player) list.push(player);
  }

  return list;
}

/**
 * Returns true if the player is a KingPin or Agent.
 */
export function isBoss(player: Player) {
  return isAgent(player) || isKingPin(player);
}

/**
 * Returns true if the player is an agent.
 */
export function isAgent(player: Player) {
  return player.integrityCards.some(c => c.type === 'agent');
}

/**
 * Returns true if the player is a KingPin.
 */
export function isKingPin(player: Player) {
  return player.integrityCards.some(c => c.type === 'king_pin');
}

/**
 * Finds an item with the given id in the list. Undefined if not found.
 */
export function findItemWithId<T extends {id: number}>(list: T[], id: number) {
  return list.find(i => i.id === id);
}

/**
 * Removes an item from a list that has a given id. Returns the given item,
 * or undefined if it could not be found.
 */
export function removeItemWithId<T extends {id: number}>(
  list: T[],
  id: number
) {
  const match = list.findIndex(i => (i.id = id));
  if (match === -1) {
    return undefined;
  }

  const removed = list.splice(match, 1)[0];
  return removed;
}

let idGen = 0;

/**
 * Generates a new unique selection id.
 */
export function generateSelectionId(state: GameState): number {
  const selections = state.shared.selections;
  const ids = selections.map(sel => sel.id);
  return findFirstFreeNumber(ids);
}

/**
 * Generates a new unique selection id.
 */
export function generateVisibilityId(state: GameState): number {
  const selections = state.shared.visibility;
  const ids = selections.map(sel => sel.id);
  return findFirstFreeNumber(ids);
}

/**
 * Generates a new unique player id.
 */
export function generatePlayerId(state: GameState): number {
  const players = Object.values(state.shared.players);
  const ids = players.map(p => p.id);
  return findFirstFreeNumber(ids);
}

function findFirstFreeNumber(ids: number[]): number {
  const taken = new Set<number>(ids);
  let i = 1;
  while (taken.has(i)) i++;
  return i;
}
