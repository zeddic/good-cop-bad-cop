import React from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {gameSlice} from '../game/game_store.ts';
import {Team} from '../game/models';
import {
  selectActiveSelection,
  selectCanEndTurn,
  selectCanFireGun,
  selectCanSkipActionStage,
  selectGunSupply,
  selectPlayers,
  selectTurn,
  selectWinner,
} from '../game/selectors';
import './App.scss';
import {Gun} from './Gun';
import {Player} from './Player';

function App() {
  const turn = useSelector(selectTurn);
  const players = useSelector(selectPlayers);
  const gunSupply = useSelector(selectGunSupply);
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
      <button onClick={endTurn} disabled={!canEndTurn}>
        End Turn
      </button>

      {canFireGun && <button onClick={fireGun}>Fire gun</button>}

      {unresolvedShot && (
        <button onClick={resolveGunShot}>Resolve Gun Shot</button>
      )}

      {canSkipActionStage && (
        <button onClick={skipActionStage}>Skip Action</button>
      )}

      {winner && (
        <h2>
          {winner === Team.GOOD ? 'The good cops win!' : 'The bad cops win!'}
        </h2>
      )}

      {activeSelection && <strong>{activeSelection.description}</strong>}

      <h2>Players</h2>
      {players.map(player => (
        <Player key={player.id} player={player}></Player>
      ))}

      <h2>Supply</h2>
      {gunSupply.map(gun => (
        <Gun key={gun.id} gun={gun}></Gun>
      ))}
    </div>
  );
}

export default App;
