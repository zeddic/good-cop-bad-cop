import {GameState, LogLevel} from './models';

const MAX_LOG_SIZE = 20;

/**
 * Logs a message that should be shown to all players.
 */
export function logInfo(state: GameState, msg: string) {
  log(state, LogLevel.INFO, msg);
}

/**
 * Logs a debug message.
 */
export function logDebug(state: GameState, msg: string) {
  log(state, LogLevel.DEBUG, msg);
}

/**
 * Logs a message.
 */
export function log(state: GameState, level: LogLevel, msg: string) {
  const entry = {level, msg};
  state.shared.log.push(entry);

  while (state.shared.log.length > MAX_LOG_SIZE) {
    state.shared.log.shift();
  }
}
