import React from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {pickupGun} from '../game/actions';
import {gameSlice} from '../game/game_store.ts';
import {
  selectActiveSelection,
  selectGunSupply,
  selectPlayers,
  selectTurn,
} from '../game/selectors';
import './App.scss';
import {Gun} from './Gun';
import {Player} from './Player';

function App() {
  const turn = useSelector(selectTurn);
  const players = useSelector(selectPlayers);
  const gunSupply = useSelector(selectGunSupply);
  const activeSelection = useSelector(selectActiveSelection);

  const dispatch = useDispatch();

  function endTurn() {
    dispatch(gameSlice.actions.endTurn());
  }

  function pickupGun() {
    // TODO: only allow this when the user has an action left.
    dispatch(gameSlice.actions.pickupGun());
  }

  return (
    <div className="App">
      <button onClick={endTurn}>End Turn</button>
      <h2>Current Turn</h2>
      <pre>{JSON.stringify(turn, null, 2)}</pre>

      {activeSelection && (
        <>
          <strong>Select something to cointue!</strong>
          <pre>{JSON.stringify(activeSelection, null, 2)}</pre>
        </>
      )}

      <h2>Players</h2>
      {players.map(player => (
        <Player key={player.id} player={player}></Player>
      ))}

      <h2>Supply</h2>
      {gunSupply.map(gun => (
        <Gun key={gun.id} gun={gun} onClick={pickupGun}></Gun>
      ))}
    </div>
  );
}

export default App;
