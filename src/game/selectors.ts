import {current} from 'immer';
import {createSelector} from 'reselect';
import {GameItemType, GameStage, GameState, Player, TurnStage} from './models';
import {findItemsAmongPlayers, findSelectableItems} from './queries';

export function selectGame(rootState: any): GameState {
  return rootState.game;
}

export const selectShared = createSelector(selectGame, g => g.shared);

export const selectCurrentPlayer = createSelector(selectShared, state => {
  const active = state.turn.activePlayer;
  return state.players[active];
});

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

export function selectPlayer(id?: number) {
  return createSelector(selectPlayersById, byId => {
    return id ? byId[id] : undefined;
  });
}

export const selectGunSupply = createSelector(selectShared, s => s.guns);

export const selectEquipment = createSelector(selectShared, s => s.equipment);

export const selectVisibility = createSelector(selectShared, s => s.visibility);

export const selectVisibleIntegrityCards = createSelector(
  selectCurrentPlayer,
  selectVisibility,
  (currentPlayer, visibility) => {
    const visible = new Set<number>();

    for (const view of visibility) {
      for (let item of view.items) {
        if (item.type === GameItemType.INTEGRITY_CARD) {
          visible.add(item.id!);
        }
      }
    }

    // todo: this should be signed in player
    // Players can always view their own cards, even if others cannot
    for (const card of currentPlayer.integrityCards) {
      visible.add(card.id);
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
 * Selects the first selection that the current player must complete.
 * Returns undefined if there is no pending selection.
 */
export const selectActiveSelection = createSelector(
  selectSelections,
  selectCurrentPlayer,
  (selections, currentPlayer) => {
    return selections.filter(s => s.player === currentPlayer.id)[0];
  }
);

/**
 * Selects if there is a pending selection the current player must address
 * before progressing the game.
 */
export const selectIsActiveSelection = createSelector(
  selectActiveSelection,
  a => !!a
);

/**
 * Selects a structure that contains a Sets identifying any items that
 * passed the firsts of the currently active selection and may be
 * picked by the user.
 */
export const selectSelectableItems = createSelector(
  selectActiveSelection,
  selectPlayers,
  findSelectableItems
);

/**
 * Returns whether the current player can take any action-hase
 * action (fire a gun, investigate, equip)
 */
export const selectCanTakeAction = createSelector(
  selectTurn,
  selectActiveSelection,
  (turn, activeSelection) => {
    return (
      turn.stage === TurnStage.TAKE_ACTION &&
      turn.actionsLeft > 0 &&
      !activeSelection
    );
  }
);

/**
 * Returns true if the user can arm a gun.
 */
export const selectCanArmGun = createSelector(
  selectCanTakeAction,
  selectCurrentPlayer,
  (canTakeAction, currentPlayer) => {
    return canTakeAction && !currentPlayer.gun;
  }
);

/**
 * Whether the current player can fire their gun.
 * False if they don't have a gun equiped.
 */
export const selectCanFireGun = createSelector(
  selectCanTakeAction,
  selectCurrentPlayer,
  (canTakeAction, currentPlayer) => {
    return canTakeAction && currentPlayer.gun;
  }
);

/**
 * Returns whether the user can end their turn now.
 */
export const selectCanEndTurn = createSelector(
  selectTurn,
  selectActiveSelection,
  selectGameStage,
  (turn, selection, stage) => {
    return (
      !turn.unresolvedGunShot && !selection && stage !== GameStage.END_GAME
    );
  }
);

/**
 * Returns whether the user is allowed to skip their action
 * phase and go straight to the aiming phase of their turn.
 */
export const selectCanSkipActionStage = createSelector(
  selectTurn,
  selectCurrentPlayer,
  selectActiveSelection,
  (turn, currentPlayer, selection) => {
    // The only point of allowing a user to skip the action phase is if they
    // want to aim their gun. Otherwise, its equivalent to skipping their turn.
    // So if a user doesn't have a gun, we just don't bother given them the option.
    return (
      turn.stage === TurnStage.TAKE_ACTION && currentPlayer.gun && !selection
    );
  }
);

/**
 * Returns a set of player ids that may be aimed at by the
 * current player.
 */
export const selectAimablePlayers = createSelector(
  selectTurn,
  selectCurrentPlayer,
  selectPlayers,
  selectActiveSelection,
  (turn, currentPlayer, players, activeSelection) => {
    const aimable = new Set<number>();

    if (turn.stage !== TurnStage.TAKE_AIM || !!activeSelection) {
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
export const selectFirableGun = createSelector(
  selectCanTakeAction,
  selectCurrentPlayer,
  (canTakeAction, currentPlayer) => {
    return canTakeAction && currentPlayer.gun
      ? currentPlayer.gun.id
      : undefined;
  }
);

// export const selectUnresolvedShotDetails = createSelector(
//   selectTurn,
//   selectPlayersById,
//   (turn, playersById) => {
//     const shot = turn.unresolvedGunShot;
//     if (!shot) return undefined;
//     const src = playersById[shot.player];
//     const dest = playersById[shot.target];
//     const description = `${src.name} shot at ${dest.name}!`;
//     return {description, shot};
//   }
// );
