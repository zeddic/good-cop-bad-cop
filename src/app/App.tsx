import React, {ChangeEvent, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {gameSlice, joinGame} from '../game/game_store';
import {selectGameId, selectName} from '../game/selectors';
import './App.scss';
import Game from './Game';

function App() {
  const [inputName, setInputName] = useState('');
  const dispatch = useDispatch();
  const username = useSelector(selectName);
  const gameId = useSelector(selectGameId);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setInputName(event.target.value);
  }

  function onPlayClick() {
    dispatch(gameSlice.actions.setName(inputName));
    // Hard-coded the default game for now. I can add
    // a game list / picker later.
    dispatch(joinGame('1'));
  }

  return (
    <div className="App">
      {!username && (
        <div className="login">
          <input
            type="text"
            placeholder="Username"
            value={inputName}
            onChange={handleChange}
          ></input>
          <button className="btn" onClick={onPlayClick}>
            Join game
          </button>
        </div>
      )}

      {username && gameId && <Game></Game>}
    </div>
  );
}

export default App;
