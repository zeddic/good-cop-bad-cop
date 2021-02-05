import {getPlayers} from './utils';
import {
  EquipmentCard,
  Gun,
  IntegrityCard,
  CardState,
  IsPlayer,
  Player,
  GameItemType,
  Selection,
  Query,
  GameItem,
  GameState,
} from './models';

/**
 * Returns game items that match the query within a selection.
 * Items are returned in a map so we can quickly check an item
 * in the wild to see if it is selectable.
 */
export function findSelectableItems(
  selection: Selection | undefined,
  players: Player[]
) {
  const query = selection?.query;
  const items = query ? findItemsAmongPlayers(query, players) : [];

  return organizeItems(items);
}

/**
 * Returns game items that match the supplied query.
 */
export function findItems(query: Query, state: GameState) {
  const players = getPlayers(state);
  return findItemsAmongPlayers(query, players);
}

/**
 * Returns game items that match the supplied query.
 */
export function findItemsAmongPlayers(
  query: Query,
  players: Player[]
): GameItem[] {
  const result: GameItem[] = [];

  for (const player of players) {
    if (matchesPlayer(player, query)) {
      result.push({
        type: GameItemType.PLAYER,
        id: player.id,
        owner: player.id,
      });
    }

    for (const card of player.integrityCards) {
      if (matchesIntegrityCard(card, player, query)) {
        result.push({
          type: GameItemType.INTEGRITY_CARD,
          id: card.id,
          owner: player.id,
        });
      }
    }

    if (player.gun) {
      if (matchesGun(player.gun, player, query)) {
        result.push({
          type: GameItemType.GUN,
          id: player.gun.id,
          owner: player.id,
        });
      }
    }

    for (const card of player.equipment) {
      if (matchesEquipmentCard(card, player, query)) {
        result.push({
          type: GameItemType.EQUIPMENT_CARD,
          id: card.id,
          owner: player.id,
        });
      }
    }
  }

  return result;
}

/**
 * Returns true if the player passes the selection's criteria.
 */
function matchesPlayer(player: Player, query: Query): boolean {
  if (query.type !== GameItemType.PLAYER) {
    return false;
  }

  for (const filter of query.filters) {
    switch (filter.type) {
      case 'is_player':
        if (!matchesIsPlayerFilter(filter, player)) {
          return false;
        }
        break;
      case 'is_face_down':
        break;
      default:
        assertUnreachable(filter);
    }
  }

  return true;
}

/**
 * Returns true if the integrity card passes the selection's criteria
 */
function matchesIntegrityCard(
  card: IntegrityCard,
  owner: Player,
  query: Query
): boolean {
  if (query.type !== GameItemType.INTEGRITY_CARD) {
    return false;
  }

  for (const filter of query.filters) {
    switch (filter.type) {
      case 'is_player':
        if (!matchesIsPlayerFilter(filter, owner)) {
          return false;
        }
        break;
      case 'is_face_down':
        const expected = filter.isFaceDown
          ? CardState.FACE_DOWN
          : CardState.FACE_UP;
        if (card.state !== expected) {
          return false;
        }
        break;
      default:
        assertUnreachable(filter);
    }
  }

  return true;
}

/**
 * Returns true if the gun passes the selection's critiera.
 */
function matchesGun(gun: Gun, owner: Player, query: Query) {
  if (query.type !== GameItemType.GUN) {
    return false;
  }

  for (const filter of query.filters) {
    switch (filter.type) {
      case 'is_player':
        if (!matchesIsPlayerFilter(filter, owner)) {
          return false;
        }
        break;
      case 'is_face_down':
        break;
      default:
        assertUnreachable(filter);
    }
  }

  return true;
}

/**
 * Returns true if the equipment card passes the selection's critiera.
 */
function matchesEquipmentCard(
  card: EquipmentCard,
  owner: Player,
  query: Query
): boolean {
  if (query.type !== GameItemType.EQUIPMENT_CARD) {
    return false;
  }

  for (const filter of query.filters) {
    switch (filter.type) {
      case 'is_player':
        if (!matchesIsPlayerFilter(filter, owner)) {
          return false;
        }
        break;
      case 'is_face_down':
        break;
      default:
        assertUnreachable(filter);
    }
  }

  return true;
}

function assertUnreachable(x: never): never {
  throw new Error('Forgot to handle a filter type');
}

function matchesIsPlayerFilter(filter: IsPlayer, player: Player) {
  const isMatch = filter.players.includes(player.id);
  return filter.not ? !isMatch : isMatch;
}

/**
 * Returns game items that pass the supplied selection criteria.
 */
export function organizeItems(items: GameItem[]) {
  const result = {
    players: mapItemOfTypeById(items, GameItemType.PLAYER),
    guns: mapItemOfTypeById(items, GameItemType.GUN),
    integrityCards: mapItemOfTypeById(items, GameItemType.INTEGRITY_CARD),
    equipmentCards: mapItemOfTypeById(items, GameItemType.EQUIPMENT_CARD),
  };

  return result;
}

/**
 * Given a list of items, create a map of only the specified type,
 * mapping the id to the GameItem type.
 */
function mapItemOfTypeById(
  items: GameItem[],
  type: GameItemType
): Map<number, GameItem> {
  const map = new Map<number, GameItem>();
  for (const item of items) {
    if (item.type === type) {
      map.set(item.id, item);
    }
  }
  return map;
}
