import {EquipmentCard, GameState} from './models';

export enum EquipmentCardResult {
  /**
   * The card has been played and there are no more results.
   */
  DONE = 'done',

  /**
   * The card is still in play and can't be discarded yet.
   */
  IN_PROGRESS = 'in_progress',

  /**
   * The card has been played but has some permanent passive effect.
   * It has been placed in front of some target player. However,
   * it should no longer block regular play.
   */
  PLACED = 'placed',
}

export interface EquipmentCardConfig {
  /**
   * The type of card being configed.
   */
  type: EquipmentCard;

  /**
   * A user friendly name for it.
   */
  name: string;

  /**
   * The description of what the card does.
   */
  description: string;

  /**
   * A function that returns true if the card can be played right now.
   * Different cards have different restrictions, such as only being
   * playable on your turn or during the action phase.
   *
   * Note: No mater what the card returns here, equipment cards may not
   * stack. One equipment card must be resolved before another equipment
   * card can be played.
   */
  canPlay: (state: GameState) => boolean;

  /**
   * Plays the equipment card and applies its effects on the game state.
   * Returns whether or not the card is still in progress or has completed.
   */
  play: (state: GameState) => EquipmentCardResult;

  /**
   * Handles a selection being complete which has been routed to this
   * card. To route a selection to a fn, preface the {@code task} field
   * of your {@code Selection} with `equipment.<card_name>.<your_task_name>`
   *
   * This method will be called with <your_task_name> and the selection upon
   * the user picked all items.
   *
   * Returns whether or not the card is still in progress or has completed.
   */
  onSelect: (
    state: GameState,
    selection: Selection,
    task: string
  ) => EquipmentCardResult;
}
