import {useSelector} from 'react-redux';
import {Gun as GunModel} from '../game/models';

import './Gun.scss';

export function Gun(props: {
  gun: GunModel;
  onClick?: (card: GunModel) => void;
}) {
  const gun = props.gun;

  function clicked() {
    props.onClick && props.onClick(gun);
  }

  return (
    <button className="gun" title={gun.id + ''} onClick={clicked}></button>
  );
}
