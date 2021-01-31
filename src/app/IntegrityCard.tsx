import {useSelector} from 'react-redux';
import {IntegrityCard as IntegrityCardModel} from '../game/models';
import {selectViewedIntegrityCards} from '../game/selectors';

import './IntegrityCard.scss';

export function IntegrityCard(props: {
  card: IntegrityCardModel;
  onClick?: (card: IntegrityCardModel) => void;
}) {
  const viewedCards = useSelector(selectViewedIntegrityCards);
  const card = props.card;

  const classNames = ['integrity-card', card.type, card.state];

  if (viewedCards.has(card.id)) {
    classNames.push('viewed');
  }

  function clicked() {
    props.onClick && props.onClick(card);
  }

  return <button className={classNames.join(' ')} onClick={clicked}></button>;
}
