import React, { useEffect, useState } from 'react';
import { Game } from '../game/game';
import './App.css';


function App() {

  const [game] = useState(() => new Game());
  const [gameState, setGameState] = useState(game.state().snapshot());

  useEffect(() => {
    game.state().select().subscribe(val => {
      setGameState(val);
    })
  }, [game]);

  function updatePlayer() {
    game.increment();
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
