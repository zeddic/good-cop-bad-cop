import {useDispatch, useSelector} from 'react-redux';
import {gameSlice} from '../game/game_store.ts';
import {Gun as GunModel, Player as PlayerModel} from '../game/models';
import {
  selectActiveSelection,
  selectCanArmGun,
  selectFirableGun,
  selectPlayer,
  selectSelectableItems,
} from '../game/selectors';
import './Gun.scss';

export function Gun(props: {
  gun: GunModel;
  owner?: PlayerModel;
  small?: boolean;
}) {
  const gun = props.gun;
  const owner = props.owner;
  const inSupply = !owner;

  const dispatch = useDispatch();
  const selectable = useSelector(selectSelectableItems).guns;
  const target = useSelector(selectPlayer(gun.aimedAt));
  const activeSelection = useSelector(selectActiveSelection);
  const isFireable = useSelector(selectFirableGun) === gun.id;
  const isEquipable = useSelector(selectCanArmGun) && inSupply;
  const isSelectable = selectable.has(gun.id);
  const isClickable = isSelectable || isFireable || isEquipable;

  const classNames = [
    'gun',
    props.small ? 'small' : '',
    isSelectable ? 'selectable' : '',
    isClickable ? 'clickable' : '',
  ];

  function clicked() {
    if (isSelectable) {
      const item = selectable.get(gun.id)!;
      dispatch(gameSlice.actions.select(item));
      return;
    }

    if (isFireable) {
      dispatch(gameSlice.actions.fireGun());
      return;
    }

    if (isEquipable) {
      dispatch(gameSlice.actions.pickupGun());
    }
  }

  function getTooltip() {
    if (isSelectable) {
      return activeSelection?.tooltip || 'Select this gun';
    } else if (isFireable) {
      return `FIRE! (at ${target?.name})`;
    } else if (isEquipable) {
      return 'Equip this gun';
    } else {
      return target ? `Aimed at ${target.name}` : `Aimed at nobody`;
    }
  }

  return (
    <button
      className={classNames.join(' ')}
      title={getTooltip()}
      disabled={!isClickable}
      onClick={clicked}
    ></button>
  );
}
