import {useDispatch, useSelector} from 'react-redux';
import {gameSlice} from '../game/game_store.ts';
import './App.css';
import {selectAll} from './store';

function App() {
  const allState = useSelector(selectAll);
  const dispatch = useDispatch();

  function increment() {
    dispatch(gameSlice.actions.increment());
  }

  return (
    <div className="App">
      <button onClick={increment}>Increment</button>
      <pre>{JSON.stringify(allState, null, 2)}</pre>
    </div>
  );
}

export default App;
