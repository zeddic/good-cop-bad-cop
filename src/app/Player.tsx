import React from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {gameSlice} from '../game/game_store';
import {Player as PlayerModel} from '../game/models';
import {
  selectAimablePlayers,
  selectCurrentPlayer,
  selectLocalSelection,
  selectSelectableItems,
} from '../game/selectors';
import {EquipmentCard} from './EquipmentCard';
import {Gun} from './Gun';
import {IntegrityCard} from './IntegrityCard';
import './Player.scss';
import {WoundToken} from './WoundToken';

export function Player(props: {player: PlayerModel}) {
  const player = props.player;
  const integrityCards = player.integrityCards;
  const equipmentCards = player.equipment;

  const dispatch = useDispatch();
  const currentPlayer = useSelector(selectCurrentPlayer);
  const canAimAt = useSelector(selectAimablePlayers).has(player.id);
  const selectable = useSelector(selectSelectableItems).players;
  const activeSelection = useSelector(selectLocalSelection);

  const isSelectable = selectable.has(player.id);
  const wounds = new Array(player.wounds).fill(null).map((_, i) => i);

  const classNames = [
    'player',
    isSelectable ? 'selectable' : '',
    currentPlayer.id === player.id ? 'current' : '',
    player.dead ? 'dead' : '',
  ];

  function onAimAtClicked() {
    dispatch(gameSlice.actions.aimGun(player.id));
  }

  function onSelectClicked() {
    const item = selectable.get(player.id)!;
    dispatch(gameSlice.actions.select(item));
  }

  function getSelectTooltip() {
    return activeSelection?.tooltip || 'Select this integrity card';
  }

  return (
    <div className={classNames.join(' ')}>
      <h2>
        {player.name} {player.dead ? '(Dead)' : ''}
        {canAimAt && (
          <button className="btn" onClick={onAimAtClicked}>
            Aim at
          </button>
        )}
        {isSelectable && (
          <button
            className="btn"
            onClick={onSelectClicked}
            title={getSelectTooltip()}
          >
            Select
          </button>
        )}
      </h2>

      <div className="cards">
        {integrityCards.map((card, idx) => (
          <IntegrityCard
            key={card.id}
            card={card}
            owner={player}
          ></IntegrityCard>
        ))}

        {equipmentCards.map(card => (
          <EquipmentCard
            key={card.id}
            card={card}
            owner={player}
          ></EquipmentCard>
        ))}
      </div>

      <div className="tokens">
        {player.gun && <Gun gun={player.gun} owner={player} small={true}></Gun>}

        {!player.dead && wounds.map(i => <WoundToken key={i}></WoundToken>)}
      </div>
    </div>
  );
}

export default Player;
