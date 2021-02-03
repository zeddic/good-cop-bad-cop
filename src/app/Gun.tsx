import {useDispatch, useSelector} from 'react-redux';
import {gameSlice} from '../game/game_store.ts';
import {Gun as GunModel, Player as PlayerModel} from '../game/models';
import {
  selectFirableGun,
  selectPlayer,
  selectSelectableItems,
} from '../game/selectors';

import './Gun.scss';

export function Gun(props: {
  gun: GunModel;
  owner?: PlayerModel;
  onClick?: (card: GunModel) => void;
}) {
  const gun = props.gun;
  const owner = props.gun;
  const dispatch = useDispatch();
  const selectable = useSelector(selectSelectableItems).guns;
  const target = useSelector(selectPlayer(gun.aimedAt));
  const isSelectable = selectable.has(gun.id);
  const isFireable = useSelector(selectFirableGun) === gun.id;

  const tooltip = target ? `Aimed at ${target.name}` : `Aimed at nobody`;

  const classNames = ['gun'];
  if (isSelectable) {
    classNames.push('selectable');
  }

  function clicked() {
    if (isSelectable) {
      const item = selectable.get(gun.id)!;
      dispatch(gameSlice.actions.select(item));
    }

    if (isFireable) {
      dispatch(gameSlice.actions.fireGun());
    }

    props.onClick && props.onClick(gun);
  }

  return (
    <button
      className={classNames.join('')}
      title={tooltip}
      onClick={clicked}
    ></button>
  );
}
