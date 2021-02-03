import {useDispatch, useSelector} from 'react-redux';
import {gameSlice} from '../game/game_store.ts';
import {
  IntegrityCard as IntegrityCardModel,
  IntegrityCardState,
} from '../game/models';
import {
  selectSelectableItems,
  selectVisibleIntegrityCards,
} from '../game/selectors';

import './IntegrityCard.scss';

export function IntegrityCard(props: {
  card: IntegrityCardModel;
  onClick?: (card: IntegrityCardModel) => void;
}) {
  const card = props.card;
  const dispatch = useDispatch();
  const visibleCards = useSelector(selectVisibleIntegrityCards);
  const selectable = useSelector(selectSelectableItems).integrityCards;
  const isSelectable = selectable.has(card.id);

  const classNames = ['integrity-card', card.type, card.state];
  if (visibleCards.has(card.id) && card.state !== IntegrityCardState.FACE_UP) {
    classNames.push('viewed');
  }

  if (isSelectable) {
    classNames.push('selectable');
  }

  function clicked() {
    if (isSelectable) {
      const item = selectable.get(card.id)!;
      dispatch(gameSlice.actions.select(item));
    }

    props.onClick && props.onClick(card);
  }

  return <button className={classNames.join(' ')} onClick={clicked}></button>;
}
