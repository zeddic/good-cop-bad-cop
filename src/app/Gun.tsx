import {useDispatch, useSelector} from 'react-redux';
import {gameSlice} from '../game/game_store.ts';
import {Gun as GunModel, Player as PlayerModel} from '../game/models';
import {selectSelectableItems} from '../game/selectors';

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
  const isSelectable = selectable.has(gun.id);

  const classNames = ['gun'];
  if (isSelectable) {
    classNames.push('selectable');
  }

  function clicked() {
    if (isSelectable) {
      const item = selectable.get(gun.id)!;
      dispatch(gameSlice.actions.select(item));
    }

    props.onClick && props.onClick(gun);
  }

  return (
    <button
      className={classNames.join('')}
      title={gun.id + ''}
      onClick={clicked}
    ></button>
  );
}
