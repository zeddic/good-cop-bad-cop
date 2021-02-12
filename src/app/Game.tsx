import * as _ from 'lodash';
import React, {useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {setGame, subscribeToGame} from '../firebase/firebase';
import {gameSlice} from '../game/game_store';
import {SharedGameState} from '../game/models';
import {selectGameId, selectPlayers, selectShared} from '../game/selectors';
import './Game.scss';
import GameSidebar from './GameSidebar';
import {Player} from './Player';

let lastUpdate: {shared: SharedGameState; gameId: string} | undefined;

function Game() {
  const gameId = useSelector(selectGameId);
  const sharedState = useSelector(selectShared);
  const players = useSelector(selectPlayers);
  const dispatch = useDispatch();

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
    <div className="Game">
      <GameSidebar className="sidebar"></GameSidebar>
      <div className="content">
        {players.map(player => (
          <Player key={player.id} player={player}></Player>
        ))}
      </div>
    </div>
  );
}

export default Game;
