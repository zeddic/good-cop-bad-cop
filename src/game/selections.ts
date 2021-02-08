import {
  discardSelectedEquipmentCard,
  handleEquipmentCardSelection,
} from './equipment';
import {
  investigateSelectedIntegrityCard,
  revealSelectedIntegrityCard,
} from './integrity_cards';
import {GameItem, GameState} from './models';
import {getLocalPlayer} from './utils';

export function selectItem(state: GameState, item: GameItem) {
  const player = getLocalPlayer(state)!;
  const selections = state.shared.selections;
  const selection = selections.filter(s => s.player === player.id)[0];

  if (!selection) {
    return;
  }

  selection.selected.push(item);

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
