import React from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {gameSlice} from '../game/game_store.ts';
import {CardState, Team} from '../game/models';
import {
  selectActiveSelection,
  selectCanEndTurn,
  selectCanFireGun,
  selectCanSkipActionStage,
  selectEquipment,
  selectGunSupply,
  selectPlayers,
  selectTurn,
  selectWinner,
} from '../game/selectors';
import './App.scss';
import {EquipmentCard} from './EquipmentCard';
import {Gun} from './Gun';
import {Player} from './Player';

function App() {
  const turn = useSelector(selectTurn);
  const players = useSelector(selectPlayers);
  const gunSupply = useSelector(selectGunSupply);
  const equipment = useSelector(selectEquipment);
  const activeSelection = useSelector(selectActiveSelection);
  const canEndTurn = useSelector(selectCanEndTurn);
  const canSkipActionStage = useSelector(selectCanSkipActionStage);
  const canFireGun = useSelector(selectCanFireGun);
  const winner = useSelector(selectWinner);
  const unresolvedShot = turn.unresolvedGunShot;

  const dispatch = useDispatch();

  function endTurn() {
    dispatch(gameSlice.actions.endTurn());
  }

  function skipActionStage() {
    dispatch(gameSlice.actions.skipActionStage());
  }

  function fireGun() {
    dispatch(gameSlice.actions.fireGun());
  }

  function resolveGunShot() {
    dispatch(gameSlice.actions.resolveGunShot());
  }

  return (
    <div className="App">
      <div className="game-bar">
        <button className="btn" onClick={endTurn} disabled={!canEndTurn}>
          End Turn
        </button>

        {canFireGun && (
          <button className="btn" onClick={fireGun}>
            Fire gun
          </button>
        )}

        {unresolvedShot && (
          <button className="btn" onClick={resolveGunShot}>
            Resolve Gun Shot
          </button>
        )}

        {canSkipActionStage && (
          <button className="btn" onClick={skipActionStage}>
            Skip Action
          </button>
        )}

        {winner && (
          <h2>
            {winner === Team.GOOD ? 'The good cops win!' : 'The bad cops win!'}
          </h2>
        )}

        {activeSelection && (
          <div>
            <strong>{activeSelection.description}</strong>
          </div>
        )}
      </div>

      <div className="players">
        {players.map(player => (
          <Player key={player.id} player={player}></Player>
        ))}
      </div>

      <h2>Supply</h2>
      {gunSupply.map(gun => (
        <Gun key={gun.id} gun={gun}></Gun>
      ))}

      {equipment.map(card => (
        <EquipmentCard key={card.id} card={card}></EquipmentCard>
      ))}
    </div>
  );
}

export default App;
