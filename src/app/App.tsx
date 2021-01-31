import {useDispatch, useSelector} from 'react-redux';
import {gameSlice} from '../game/game_store.ts';
import {selectCurrentPlayer, selectTurn} from '../game/selectors';
import './App.css';
import {selectAll} from './store';

function App() {
  const allState = useSelector(selectAll);
  const currentPlayer = useSelector(selectCurrentPlayer);
  const turn = useSelector(selectTurn);

  const dispatch = useDispatch();

  function increment() {
    dispatch(gameSlice.actions.increment());
  }

  function endTurn() {
    dispatch(gameSlice.actions.endTurn());
  }

  return (
    <div className="App">
      <button onClick={endTurn}>End Turn</button>
      {/* <pre>{JSON.stringify(allState, null, 2)}</pre> */}
      <h2>Current Player</h2>
      <pre>{JSON.stringify(currentPlayer, null, 2)}</pre>
      <h2>Current Turn</h2>
      <pre>{JSON.stringify(turn, null, 2)}</pre>
    </div>
  );
}

export default App;
