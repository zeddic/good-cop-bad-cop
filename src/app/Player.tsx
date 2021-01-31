import {useDispatch, useSelector} from 'react-redux';
import {gameSlice} from '../game/game_store.ts';
import {
  IntegrityCard as IntegrityCardModel,
  Player as PlayerModel,
} from '../game/models';
import {selectCurrentPlayer} from '../game/selectors';
import {IntegrityCard} from './IntegrityCard';
import './Player.scss';

export function Player(props: {player: PlayerModel}) {
  const dispatch = useDispatch();
  const currentPlayer = useSelector(selectCurrentPlayer);
  const player = props.player;
  const integrityCards = player.integrityCards;

  const classNames = ['player'];
  if (currentPlayer.id === player.id) {
    classNames.push('current');
  }

  function clicked(idx: number, card: IntegrityCardModel) {
    dispatch(
      gameSlice.actions.investigate({
        player: player.id,
        card: idx,
      })
    );
  }

  return (
    <div className={classNames.join(' ')}>
      <h3>
        {player.name} (#{player.id}) {player.dead ? 'DEAD' : ''}
      </h3>
      {integrityCards.map((card, idx) => (
        <IntegrityCard
          key={card.id}
          card={card}
          onClick={clicked.bind(null, idx)}
        ></IntegrityCard>
      ))}
    </div>
  );
}

export default Player;
