import {useDispatch, useSelector} from 'react-redux';
import {gameSlice} from '../game/game_store.ts';
import {
  CardState,
  EquipmentCard as EquipmentCardModel,
  Player as PlayerModel,
} from '../game/models';
import {
  selectActiveSelection,
  selectCanEquip,
  selectPlaybleEquipmentId,
  selectSelectableItems,
  selectVisibleEquipmentCards,
} from '../game/selectors';
import './EquipmentCard.scss';

export function EquipmentCard(props: {
  owner?: PlayerModel;
  card: EquipmentCardModel;
}) {
  const card = props.card;
  const owner = props.owner;
  const visibleCards = useSelector(selectVisibleEquipmentCards);
  const canEquip = useSelector(selectCanEquip) && !owner;
  const selectable = useSelector(selectSelectableItems).equipmentCards;
  const activeSelection = useSelector(selectActiveSelection);
  const isPlayable = useSelector(selectPlaybleEquipmentId) === card.id;

  const isFaceUp = card.state === CardState.FACE_UP;
  const isSelectable = selectable.has(card.id);
  const isClickable = canEquip || isSelectable || isPlayable;
  const isForcedVisible = visibleCards.has(card.id) && !isFaceUp;
  const isVisible = isForcedVisible || isFaceUp;

  const dispatch = useDispatch();
  const classNames2 = [
    'equipment-card',
    card.state,
    isForcedVisible ? 'forced-visible' : '',
    isVisible ? 'visible' : '',
    isSelectable ? 'selectable' : '',
    isClickable ? 'clickable' : '',
    isVisible ? card.type : '', // don't leak the card via the class name
  ];

  function clicked() {
    // todo: selection, or play, or pick up
    if (isSelectable) {
      const item = selectable.get(card.id)!;
      dispatch(gameSlice.actions.select(item));
    } else if (canEquip) {
      dispatch(gameSlice.actions.pickupEquipment());
    } else if (isPlayable) {
      dispatch(
        gameSlice.actions.playEquipment({
          player: owner!.id,
          card: card.id,
        })
      );
    }
  }

  function getTooltip() {
    if (isSelectable) {
      return activeSelection?.tooltip || 'Select this equipment';
    } else if (canEquip) {
      return 'Pickup this equipment';
    } else if (isPlayable) {
      return 'Play this card!';
    } else if (isVisible) {
      // TODO: Get the description from the config magp.
      return '';
    } else {
      return 'Its equipment!';
    }
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
