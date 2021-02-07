import React, {ChangeEvent} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {gameSlice} from '../game/game_store';
import {GameStage, Team} from '../game/models';
import {
  selectCanEndTurn,
  selectCanFireGun,
  selectCanSkipActionStage,
  selectCanStartGame,
  selectDebug,
  selectEquipment,
  selectEveryone,
  selectGunSupply,
  selectLocalPlayer,
  selectLocalSelection,
  selectPlayers,
  selectStage,
  selectTurn,
  selectWinner,
} from '../game/selectors';
import './Game.scss';
import {EquipmentCard} from './EquipmentCard';
import {Gun} from './Gun';
import {Player} from './Player';

function Game() {
  const turn = useSelector(selectTurn);
  const players = useSelector(selectPlayers);
  const everyone = useSelector(selectEveryone);
  const localPlayer = useSelector(selectLocalPlayer);
  const gunSupply = useSelector(selectGunSupply);
  const equipment = useSelector(selectEquipment)[0];
  const activeSelection = useSelector(selectLocalSelection);
  const canEndTurn = useSelector(selectCanEndTurn);
  const canStartGame = useSelector(selectCanStartGame);
  const canSkipActionStage = useSelector(selectCanSkipActionStage);
  const canFireGun = useSelector(selectCanFireGun);
  const winner = useSelector(selectWinner);
  const debug = useSelector(selectDebug);
  const stage = useSelector(selectStage);

  const unresolvedShot = turn.unresolvedGunShot;

  const dispatch = useDispatch();

  function endTurn() {
    dispatch(gameSlice.actions.endTurn());
  }

  function resetGame() {
    dispatch(gameSlice.actions.resetGame());
  }

  function startGame() {
    dispatch(gameSlice.actions.startGame());
  }

  function skipActionStage() {
    dispatch(gameSlice.actions.skipActionStage());
  }

  function fireGun() {
    dispatch(gameSlice.actions.fireGun());
  }

  function resolveGunShot() {
    dispatch(gameSlice.actions.resolveGunShot());
  }

  function emulatePlayer(event: ChangeEvent<HTMLSelectElement>) {
    const player = Number.parseInt(event.target.value);
    dispatch(gameSlice.actions.emulatePlayer(player));
  }

  return (
    <div className="Game">
      <div className="game-bar">
        {stage === GameStage.PLAYING && (
          <>
            <button className="btn" onClick={endTurn} disabled={!canEndTurn}>
              End Turn
            </button>

            {canFireGun && (
              <button className="btn" onClick={fireGun}>
                Fire gun
              </button>
            )}

            {unresolvedShot && (
              <button className="btn" onClick={resolveGunShot}>
                Resolve Gun Shot
              </button>
            )}

            {canSkipActionStage && (
              <button className="btn" onClick={skipActionStage}>
                Skip Action
              </button>
            )}

            {debug && (
              <>
                Emulate:
                <select value={localPlayer?.id} onChange={emulatePlayer}>
                  {players.map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name} ({player.id})
                    </option>
                  ))}
                </select>
              </>
            )}
          </>
        )}

        {stage === GameStage.PRE_GAME && (
          <>
            {everyone.map(player => (
              <div key={player.id}>
                {player.name} ({player.id})
              </div>
            ))}
          </>
        )}

        {canStartGame && (
          <button className="btn" onClick={startGame}>
            Start game
          </button>
        )}

        {true && (
          <button className="btn" onClick={resetGame}>
            Reset Game
          </button>
        )}

        {winner && (
          <h2>
            {winner === Team.GOOD ? 'The good cops win!' : 'The bad cops win!'}
          </h2>
        )}

        {activeSelection && (
          <div>
            <strong>{activeSelection.description}</strong>
          </div>
        )}
      </div>

      <div className="players">
        {players.map(player => (
          <Player key={player.id} player={player}></Player>
        ))}
      </div>

      <h2>Supply</h2>
      {gunSupply.map(gun => (
        <Gun key={gun.id} gun={gun}></Gun>
      ))}

      {equipment && <EquipmentCard card={equipment}></EquipmentCard>}
    </div>
  );
}

export default Game;
