import {useDispatch} from 'react-redux';
import {
  CardState,
  EquipmentCard as EquipmentCardModel,
  Player as PlayerModel,
} from '../game/models';
import './EquipmentCard.scss';

export function EquipmentCard(props: {
  owner?: PlayerModel;
  card: EquipmentCardModel;
}) {
  const card = props.card;
  const owner = props.owner;
  const isFaceUp = true || card.state === CardState.FACE_UP;
  const isClickable = true;
  const isForcedVisible = false && !isFaceUp;
  const isVisible = isForcedVisible || isFaceUp;

  const dispatch = useDispatch();
  const classNames2 = [
    'equipment-card',
    card.state,
    isVisible ? card.type : '',
  ];

  function clicked() {
    // todo: selection, or play, or pick up
  }

  function getTooltip() {
    return 'Its equipment!';
  }

  return (
    <button
      className={classNames2.join(' ')}
      disabled={!isClickable}
      onClick={clicked}
      title={getTooltip()}
    ></button>
  );
}
