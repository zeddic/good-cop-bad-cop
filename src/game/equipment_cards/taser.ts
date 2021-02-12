import {logInfo} from '../logs';
import {
  EquipmentCardConfig,
  EquipmentCardResult,
  EquipmentCardType,
  GameItemType,
  GameState,
  Selection,
  TurnStage,
} from '../models';
import {finishActionStage} from '../turns';
import {generateSelectionId, getAlivePlayers, getPlayer} from '../utils';

/**
 * Can this card be played by this player?
 */
function canPlay(state: GameState, player: number) {
  const turn = state.shared.turn;
  const isPlayersTurn = turn.activePlayer === player;
  const targets = findPlayersWithAGun(state, {exclude: player});

  return (
    turn.stage === TurnStage.TAKE_ACTION &&
    turn.actionsLeft > 0 &&
    isPlayersTurn &&
    targets.length > 0
  );
}

/**
 * Play the card.
 */
function play(state: GameState, player: number) {
  const targets = findPlayersWithAGun(state, {exclude: player});
  const targetIds = targets.map(player => player.id);

  const selection: Selection = {
    id: generateSelectionId(state),
    player,
    query: {
      type: GameItemType.GUN,
      filters: [{type: 'is_player', players: targetIds}],
    },
    numToSelect: 1,
    selected: [],
    task: 'equipment.taser.select_gun',
    description: 'Select a gun to steal',
    tooltip: 'Steal this gun',
  };

  state.shared.selections.push(selection);
  return EquipmentCardResult.IN_PROGRESS;
}

/**
 * Handle a selection routed to this card.
 */
function onSelect(state: GameState, selection: Selection, task: string) {
  const toSteal = selection.selected[0];
  const owner = getPlayer(state, toSteal.owner!);
  const newOwner = getPlayer(state, selection.player);

  if (!owner || !newOwner) {
    return EquipmentCardResult.DONE;
  }

  const gun = owner.gun!;
  gun.aimedAt = undefined;

  owner.gun = undefined;
  newOwner.gun = gun;

  logInfo(state, `${newOwner.name} stole ${owner}'s gun`);

  finishActionStage(state);

  return EquipmentCardResult.DONE;
}

function findPlayersWithAGun(state: GameState, options: {exclude: number}) {
  const players = getAlivePlayers(state);

  return players.filter(player => {
    return player.id !== options.exclude && player.gun !== undefined;
  });
}

export const TASER: EquipmentCardConfig = {
  type: EquipmentCardType.TASER,
  name: 'Taser',
  description:
    'Use only on your turn. This counts as your action for the ' +
    'turn. Steal a gun from any player.',
  canPlay,
  play,
  onSelect,
};
