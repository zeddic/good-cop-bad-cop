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
  const id = state.turn.activePlayer;
  return getPlayer(state, id);
}

/**
 * Finds a player with the given id.
 */
export function getPlayer(state: GameState, id: number): Player | undefined {
  return state.players[id];
}

/**
 * Get a list of all players in the game by their turn order.
 */
export function getPlayers(state: GameState) {
  const list: Player[] = [];
  for (const id of state.order) {
    const player = state.players[id];
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

let idGen = 0;

/**
 * Generates a new unique id for the session.
 */
export function generateId(): number {
  // Should probably scan the state here because we may connect to
  // an existing sessions (or use a guid). Easy for now.
  return idGen++;
}
