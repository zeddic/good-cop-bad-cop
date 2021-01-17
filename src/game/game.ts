import {Observable, Subject} from 'rxjs';

export class Game {
  private activePlayer: number = 1;

  changed: Subject<void> = new Subject<void>();

  setActivePlayer(i: number) {
    this.activePlayer = i;
    this.changed.next();
  }

  getState() {
    return {
      activePlayer: this.activePlayer,
    };
  }
}
