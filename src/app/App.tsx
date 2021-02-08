import * as _ from 'lodash';
import React, {ChangeEvent, useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {setGame, subscribeToGame} from '../firebase/firebase';
import {gameSlice, joinGame} from '../game/game_store';
import {SharedGameState} from '../game/models';
import {selectGameId, selectName, selectShared} from '../game/selectors';
import './App.scss';
import Game from './Game';

let lastUpdate: {shared: SharedGameState; gameId: string} | undefined;

function App() {
  const [inputName, setInputName] = useState('');
  const dispatch = useDispatch();
  const sharedState = useSelector(selectShared);
  const username = useSelector(selectName);
  const gameId = useSelector(selectGameId);
  // const blah = useSelector(selectGame);
  // console.log(blah);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setInputName(event.target.value);
  }

  function onPlayClick() {
    dispatch(gameSlice.actions.setName(inputName));
    // Hard-coded the default game for now. We can add
    // a game list / picker later.
    dispatch(joinGame('1'));
  }

  /**
   * Firebase --> Store
   */
  useEffect(() => {
    if (gameId === undefined) return;
    console.log(`Subscribing to updates in ${gameId}`);
    return subscribeToGame(gameId, shared => {
      console.log('Recieved Update');
      lastUpdate = {gameId, shared};
      dispatch(gameSlice.actions.updateRemoteState(shared));
    });
  }, [gameId, dispatch]);

  /**
   * Store --> Firebase
   */
  useEffect(() => {
    const proposedUpdate = {gameId, shared: sharedState};
    if (gameId === undefined) return;
    if (_.isEqual(lastUpdate, proposedUpdate)) {
      console.log('Skipping sending update');
      return;
    }

    console.log('Sending Update');
    setGame(gameId, sharedState);
  }, [gameId, sharedState]);

  return (
    <div className="App">
      {!username && (
        <div className="login">
          <input
            type="text"
            placeholder="User name"
            value={inputName}
            onChange={handleChange}
          ></input>
          <button className="btn" onClick={onPlayClick}>
            Play
          </button>
        </div>
      )}

      {username && <Game></Game>}
    </div>
  );
}

export default App;
