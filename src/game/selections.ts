import {
  discardSelectedEquipmentCard,
  handleEquipmentCardSelection,
} from './equipment';
import {
  investigateSelectedIntegrityCard,
  revealSelectedIntegrityCard,
} from './integrity_cards';
import {GameItem, GameState} from './models';
import {getLocalPlayer, getPlayer} from './utils';

/**
 * Has the specified player select an item for any selection
 * they have pending.
 *
 * If player is not supplied, this will default to the local
 * player.
 */
export function selectItem(
  state: GameState,
  options: {
    item: GameItem;
    player?: number;
  }
) {
  const player =
    options.player !== undefined
      ? getPlayer(state, options.player)!
      : getLocalPlayer(state)!;
  const selections = state.shared.selections;
  const selection = selections.filter(s => s.player === player.id)[0];

  if (!selection) {
    return;
  }

  selection.selected.push(options.item);

  // Are all items selected?
  if (selection.selected.length < selection.numToSelect) {
    return;
  }

  // Remove the selection
  state.shared.selections = state.shared.selections.filter(
    s => s.id !== selection.id
  );

  // Route it to be handled.
  const tasks = selection.task.split('.');
  const task = tasks.shift();

  if (task === 'reveal_integrity_card') {
    revealSelectedIntegrityCard(state, selection);
  } else if (task === 'investigate_integrity_card') {
    investigateSelectedIntegrityCard(state, selection);
  } else if (task === 'discard_equipment_card') {
    discardSelectedEquipmentCard(state, selection);
  } else if (task === 'equipment') {
    handleEquipmentCardSelection(state, selection, tasks);
  }
}
