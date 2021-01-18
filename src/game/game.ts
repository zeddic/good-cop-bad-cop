import {GameStore} from './game_store.ts';

export class Game {
  private store = new GameStore();

  state() {
    return this.store.state();
  }

  increment() {
    this.store.increment();
  }
}
