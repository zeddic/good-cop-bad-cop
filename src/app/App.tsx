import {useDispatch, useSelector} from 'react-redux';
import {gameSlice} from '../game/game_store.ts';
import {selectPlayers, selectTurn} from '../game/selectors';
import './App.scss';
import {Player} from './Player';

function App() {
  const turn = useSelector(selectTurn);
  const players = useSelector(selectPlayers);

  const dispatch = useDispatch();

  function endTurn() {
    dispatch(gameSlice.actions.endTurn());
  }

  return (
    <div className="App">
      <button onClick={endTurn}>End Turn</button>
      <h2>Current Turn</h2>
      <pre>{JSON.stringify(turn, null, 2)}</pre>

      {players.map(player => (
        <Player key={player.id} player={player}></Player>
      ))}
    </div>
  );
}

export default App;
