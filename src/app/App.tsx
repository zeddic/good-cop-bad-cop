import React, { useEffect, useState } from 'react';
import { Game } from '../game/game';
import './App.css';

let i = 0;

function App() {

  const [game] = useState(() => new Game());
  const [gameState, setGameState] = useState(game.getState());

  useEffect(() => {
    game.changed.subscribe(() => {
      setGameState(game.getState());
    });
  }, [game]);

  function updatePlayer() {
    game.setActivePlayer(i++);
  }

  return (
    <div className="App">
      <button onClick={updatePlayer}>Increment</button>
      <pre>
        {JSON.stringify(gameState, null, 2)}
      </pre>
    </div>
  );
}

export default App;
