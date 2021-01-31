import {IntegrityCard as IntegrityCardModel} from '../game/models';

export function IntegrityCard(props: {card: IntegrityCardModel}) {
  const card = props.card;

  return <div className="integrity-card">{card.type}</div>;
}
