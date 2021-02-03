import {handleGeneralActionSelection} from './actions';
import {getCurrentPlayer} from './common_utils';
import {GameItem, GameState} from './models';

export function selectItem(state: GameState, item: GameItem) {
  // TODO: I assume this is the current player. However, it should
  // really be the 'signed in player', but that doesn't exist yet.
  const player = getCurrentPlayer(state)!;
  const selections = state.selections;
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
  state.selections = state.selections.filter(s => s.id !== selection.id);

  // Route it to be handled.
  const tasks = selection.task.split('.');
  const task = tasks.shift();

  if (task === 'general') {
    handleGeneralActionSelection(state, tasks, selection);
  } else if (task === 'equip') {
    // todo: route this to the equipment reducer once setup
  }
}
