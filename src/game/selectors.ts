import {createSelector} from 'reselect';
import {getEquipmentConfig} from './equipment_config';
import {GameItemType, GameStage, GameState, Player, TurnStage} from './models';
import {findItemsAmongPlayers, findSelectableItems} from './queries';

export function selectGame(rootState: {game: GameState}): GameState {
  return rootState.game;
}

export const selectShared = createSelector(selectGame, g => g.shared);

export const selectLocal = createSelector(selectGame, g => g.local);

export const selectDebug = createSelector(selectLocal, s => s.debug);

export const selectName = createSelector(selectLocal, s => s.name);

export const selectGameId = createSelector(selectLocal, s => s.game);

export const selectStage = createSelector(selectShared, s => s.stage);

/**
 * The player who is playing their turn now.
 */
export const selectCurrentPlayer = createSelector(selectShared, state => {
  const active = state.turn.activePlayer;
  return state.players[active];
});

/**
 * The player who this local instance of the game is running for.
 */
export const selectLocalPlayer = createSelector(
  selectShared,
  selectLocal,
  (shared, local) => {
    return local.player !== undefined
      ? shared.players[local.player]
      : undefined;
  }
);

/**
 * Whether it is the local players turn.
 * In this situation, currentPlayer === localPlayer.
 */
export const selectIsLocalPlayersTurn = createSelector(
  selectLocalPlayer,
  selectCurrentPlayer,
  (localPlayer, currentPlayer) => {
    return currentPlayer && localPlayer?.id === currentPlayer?.id;
  }
);

export const selectTurn = createSelector(selectShared, s => s.turn);

export const selectOrder = createSelector(selectShared, s => s.order);

export const selectPlayersById = createSelector(selectShared, s => s.players);

export const selectGameStage = createSelector(selectShared, s => s.stage);

export const selectWinner = createSelector(selectShared, s => s.winner);

export const selectPlayers = createSelector(
  selectOrder,
  selectPlayersById,
  (order, playersById) => {
    const list: Player[] = [];
    for (const id of order) {
      const player = playersById[id];
      if (player) list.push(player);
    }

    return list;
  }
);

export const selectEveryone = createSelector(selectPlayersById, byId => {
  return Object.values(byId);
});

export function selectPlayer(id?: number) {
  return createSelector(selectPlayersById, byId => {
    return id ? byId[id] : undefined;
  });
}

export const selectGunSupply = createSelector(selectShared, s => s.guns);

export const selectEquipment = createSelector(selectShared, s => s.equipment);

export const selectVisibility = createSelector(selectShared, s => s.visibility);

export const selectVisibleIntegrityCards = createSelector(
  selectLocalPlayer,
  selectVisibility,
  (localPlayer, visibility) => {
    const visible = new Set<number>();

    // Granted visibility
    for (const view of visibility) {
      if (view.player === localPlayer?.id) {
        for (let item of view.items) {
          if (item.type === GameItemType.INTEGRITY_CARD) {
            visible.add(item.id!);
          }
        }
      }
    }

    // Players can always view their own cards
    if (localPlayer) {
      for (const card of localPlayer.integrityCards) {
        visible.add(card.id);
      }
    }

    return visible;
  }
);

export const selectVisibleEquipmentCards = createSelector(
  selectLocalPlayer,
  selectVisibility,
  (localPlayer, visibility) => {
    const visible = new Set<number>();

    // Granted visibility
    for (const view of visibility) {
      if (view.player === localPlayer?.id) {
        for (let item of view.items) {
          if (item.type === GameItemType.EQUIPMENT_CARD) {
            visible.add(item.id!);
          }
        }
      }
    }

    // Players can always view their own cards
    if (localPlayer) {
      for (const card of localPlayer.equipment) {
        visible.add(card.id);
      }
    }

    return visible;
  }
);

/**
 * Returns any selections that must be completed to progress the game.
 * Note that selections may be from a mixture of players: not just the current
 * player.
 */
export const selectSelections = createSelector(selectShared, s => s.selections);

/**
 * Gets the first selection that the local player is responsible for
 * resolving. Returns undefined if the local player doesn't need to do
 * anything.
 *
 * Note that there could still be other selections pending that other
 * players must still complete.
 */
export const selectLocalSelection = createSelector(
  selectSelections,
  selectLocalPlayer,
  selectDebug,
  (selections, localPlayer, debug) => {
    return selections.filter(s => s.player === localPlayer?.id)[0];
  }
);

/**
 * Selects a structure that contains a Sets identifying any items that
 * the local player may pick from to fufill any active localSelection.
 */
export const selectSelectableItems = createSelector(
  selectLocalSelection,
  selectPlayers,
  findSelectableItems
);

/**
 * Returns whether the local player can take any action-phase
 * action (fire a gun, investigate, equip)
 */
export const selectCanTakeAction = createSelector(
  selectTurn,
  selectIsLocalPlayersTurn,
  selectSelections,
  (turn, isLocalPlayersTurn, selections) => {
    return (
      isLocalPlayersTurn &&
      turn.stage === TurnStage.TAKE_ACTION &&
      turn.actionsLeft > 0 &&
      !turn.unresolvedGunShot &&
      !turn.unresolvedEquipment &&
      selections.length === 0
    );
  }
);

/**
 * True if the player can arm a gun.
 */
export const selectCanArmGun = createSelector(
  selectCanTakeAction,
  selectCurrentPlayer,
  (canTakeAction, currentPlayer) => {
    return canTakeAction && !currentPlayer.gun;
  }
);

/**
 * True if the player can fire a gun that they have armed.
 */
export const selectCanFireGun = createSelector(
  selectCanTakeAction,
  selectCurrentPlayer,
  (canTakeAction, currentPlayer) => {
    return canTakeAction && currentPlayer.gun;
  }
);

/**
 * True if a player can pick up new equipment.
 */
export const selectCanEquip = createSelector(
  selectCanTakeAction,
  selectCurrentPlayer,
  (canTakeAction, currentPlayer) => {
    return canTakeAction && currentPlayer.equipment.length < 2;
  }
);

/**
 * Whether the local player can play their equipment card.
 *
 * Note, this check is a little different from the other checks.
 * Most actions can only be performed on your turn. In most cases
 * equipment can be played at any time. As a result, we check
 * 'localPlayer' which may be different from the current turn player.
 */
export const selectCanPlayEquipment = createSelector(
  selectGame,
  selectTurn,
  selectSelections,
  selectLocalPlayer,
  (state, turn, selections, localPlayer) => {
    if (
      !localPlayer ||
      turn.unresolvedEquipment ||
      selections.length > 0 ||
      localPlayer.equipment.length !== 1
    ) {
      return false;
    }

    const card = localPlayer.equipment[0]!;
    const config = getEquipmentConfig(card.type);
    return config && config.canPlay(state, localPlayer.id);
  }
);

/**
 * Returns whether the user can end their turn now.
 */
export const selectCanEndTurn = createSelector(
  selectTurn,
  selectIsLocalPlayersTurn,
  selectSelections,
  selectGameStage,
  (turn, isLocalPlayersTurn, selections, stage) => {
    return (
      isLocalPlayersTurn &&
      !turn.unresolvedGunShot &&
      !turn.unresolvedEquipment &&
      selections.length === 0 &&
      stage !== GameStage.END_GAME
    );
  }
);

/**
 * Returns whether the game can be started.
 */
export const selectCanStartGame = createSelector(selectShared, shared => {
  // TODO: check size of everyone.
  return shared.stage === GameStage.PRE_GAME;
});

/**
 * Returns whether the user is allowed to skip their action
 * phase and go straight to the aiming phase of their turn.
 */
export const selectCanSkipActionStage = createSelector(
  selectTurn,
  selectIsLocalPlayersTurn,
  selectCurrentPlayer,
  selectLocalSelection,
  (turn, isLocalPlayersTurn, currentPlayer, selection) => {
    // The only point of allowing a user to skip the action phase is if they
    // want to aim their gun. Otherwise, its equivalent to skipping their turn.
    // So if a user doesn't have a gun, we just don't bother given them the option.
    return (
      isLocalPlayersTurn &&
      turn.stage === TurnStage.TAKE_ACTION &&
      currentPlayer.gun &&
      !selection
    );
  }
);

/**
 * Returns a set of player ids that may be aimed at by the
 * current player.
 */
export const selectAimablePlayers = createSelector(
  selectIsLocalPlayersTurn,
  selectTurn,
  selectCurrentPlayer,
  selectPlayers,
  selectLocalSelection,
  (isLocalPlayersTurn, turn, currentPlayer, players, activeSelection) => {
    const aimable = new Set<number>();

    if (
      !isLocalPlayersTurn ||
      turn.stage !== TurnStage.TAKE_AIM ||
      !!activeSelection
    ) {
      return aimable;
    }

    for (const player of players) {
      if (player.id !== currentPlayer.id && !player.dead) {
        aimable.add(player.id);
      }
    }

    return aimable;
  }
);

/**
 * Returns a set of integrity card ids that the current player may
 * investigate during their turn.
 */
export const selectInvestigatableCards = createSelector(
  selectCanTakeAction,
  selectPlayers,
  selectCurrentPlayer,
  (canTakeAction, players, currentPlayer) => {
    if (!canTakeAction) {
      return new Set<number>();
    }

    const items = findItemsAmongPlayers(
      {
        type: GameItemType.INTEGRITY_CARD,
        filters: [
          {type: 'is_player', not: true, players: [currentPlayer.id]},
          {type: 'is_face_down', isFaceDown: true},
        ],
      },
      players
    );

    const ids = items.map(i => i.id);
    return new Set(ids);
  }
);

/**
 * Returns the id of a gun that can be fired by the current player this turn
 * Returns undefined if the current player can't fire their gun.
 */
export const selectFirableGunId = createSelector(
  selectCanTakeAction,
  selectCurrentPlayer,
  (canTakeAction, currentPlayer) => {
    return canTakeAction && currentPlayer.gun
      ? currentPlayer.gun.id
      : undefined;
  }
);

/**
 * Returns the id an equipment card the local player may play.
 * Note that unlike other checks, this is based off of 'localPlayer'
 * and not 'currentPlayer'. That is because equipment, unlike other
 * actions, can be done when it is not your turn.
 */
export const selectPlaybleEquipmentId = createSelector(
  selectCanPlayEquipment,
  selectLocalPlayer,
  (canPlay, localPlayer) => {
    if (!localPlayer || !canPlay) {
      return undefined;
    }

    return localPlayer.equipment[0]!.id;
  }
);
