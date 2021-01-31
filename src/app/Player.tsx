import {Player as PlayerModel} from '../game/models';
import {IntegrityCard} from './IntegrityCard';

export function Player(props: {player: PlayerModel}) {
  const player = props.player;
  const integrityCards = player.integrityCards;

  return (
    <div className="Player">
      {/* <pre>{JSON.stringify(props.player, null, 2)}</pre> */}
      <h3>
        {player.name} (#{player.id}) {player.dead ? 'DEAD' : ''}
      </h3>
      {integrityCards.map(card => (
        <IntegrityCard key={card.id} card={card}></IntegrityCard>
      ))}
    </div>
  );
}

export default Player;
