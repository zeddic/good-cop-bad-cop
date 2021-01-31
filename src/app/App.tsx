import React from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {gameSlice} from '../game/game_store.ts';
import {selectGunSupply, selectPlayers, selectTurn} from '../game/selectors';
import './App.scss';
import {Gun} from './Gun';
import {Player} from './Player';

function App() {
  const turn = useSelector(selectTurn);
  const players = useSelector(selectPlayers);
  const gunSupply = useSelector(selectGunSupply);

  const dispatch = useDispatch();

  function endTurn() {
    dispatch(gameSlice.actions.endTurn());
  }

  return (
    <div className="App">
      <button onClick={endTurn}>End Turn</button>
      <h2>Current Turn</h2>
      <pre>{JSON.stringify(turn, null, 2)}</pre>

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
