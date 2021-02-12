import {aimGun, cancelUnresolvedGunShot, fireGun} from '../guns';
import {logInfo} from '../logs';
import {
  EquipmentCardConfig,
  EquipmentCardResult,
  EquipmentCardType,
  GameItemType,
  GameState,
  Selection,
} from '../models';
import {generateSelectionId, getAlivePlayers, getPlayer} from '../utils';

/**
 * Can this card be played by this player?
 */
function canPlay(state: GameState, player: number) {
  const activeGunShot = state.shared.turn.unresolvedGunShot !== undefined;
  const numPlayers = getAlivePlayers(state).length;
  return activeGunShot && numPlayers > 2;
}

/**
 * Play the card.
 */
function play(state: GameState, player: number) {
  const activeGunShot = state.shared.turn.unresolvedGunShot;
  if (!activeGunShot) {
    return EquipmentCardResult.DONE;
  }

  const originalTarget = activeGunShot.target;
  const personShootingGun = activeGunShot.player;
  const otherOptions = getAlivePlayers(state)
    .filter(p => p.id !== originalTarget && p.id !== personShootingGun)
    .map(p => p.id);

  const selection: Selection = {
    id: generateSelectionId(state),
    player: personShootingGun,
    query: {
      type: GameItemType.PLAYER,
      filters: [{type: 'is_player', players: otherOptions}],
    },
    numToSelect: 1,
    selected: [],
    task: 'equipment.restraining_order.select_new_target',
    description: 'Select a different player to shoot',
    tooltip: 'Shoot this player instead',
  };

  state.shared.selections.push(selection);

  cancelUnresolvedGunShot(state);

  const playerShootingGun = getPlayer(state, personShootingGun)!;
  logInfo(
    state,
    `${playerShootingGun.name} must pick a different player to shoot`
  );

  return EquipmentCardResult.IN_PROGRESS;
}

/**
 * Handle a selection routed to this card.
 */
function onSelect(state: GameState, selection: Selection, task: string) {
  const target = selection.selected[0]!.id;
  const player = selection.player;

  aimGun(state, {player, target});
  fireGun(state, {player});
  return EquipmentCardResult.DONE;
}

export const RESTRAINING_ORDER: EquipmentCardConfig = {
  type: EquipmentCardType.RESTRAINING_ORDER,
  name: 'Restraining Order',
  description:
    'Use when another player shoots their gun. They must choose ' +
    'a different player and immediately aim at and shoot that player instead. ' +
    'This card cannot be used when there are only two players left.',
  canPlay,
  play,
  onSelect,
};
