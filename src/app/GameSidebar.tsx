import React, {ChangeEvent, useEffect, useRef} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {gameSlice} from '../game/game_store';
import {GameStage, Team} from '../game/models';
import {
  selectCanEndTurn,
  selectCanFireGun,
  selectCanSkipActionStage,
  selectCanStartGame,
  selectCurrentPlayer,
  selectDebug,
  selectEquipment,
  selectEveryone,
  selectGunSupply,
  selectIsLocalPlayersTurn,
  selectLocalPlayer,
  selectLog,
  selectPlayers,
  selectStage,
  selectTurn,
  selectWinner,
} from '../game/selectors';
import {EquipmentCard} from './EquipmentCard';
import './GameSidebar.scss';
import {Gun} from './Gun';
import NextTaskSummary from './NextTaskSummary';

function GameSidebar(props: {className?: string}) {
  const className = props.className ?? '';
  const isYourTurn = useSelector(selectIsLocalPlayersTurn);
  const turn = useSelector(selectTurn);
  const players = useSelector(selectPlayers);
  const everyone = useSelector(selectEveryone);
  const localPlayer = useSelector(selectLocalPlayer);
  const currentPlayer = useSelector(selectCurrentPlayer);
  const gunSupply = useSelector(selectGunSupply);
  const equipment = useSelector(selectEquipment)[0];
  const canEndTurn = useSelector(selectCanEndTurn);
  const canStartGame = useSelector(selectCanStartGame);
  const canSkipActionStage = useSelector(selectCanSkipActionStage);
  const canFireGun = useSelector(selectCanFireGun);
  const winner = useSelector(selectWinner);
  const debug = useSelector(selectDebug);
  const stage = useSelector(selectStage);
  const log = useSelector(selectLog);
  const unresolvedShot = turn.unresolvedGunShot;
  const logEndRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();

  useEffect(() => {
    logEndRef.current?.scrollIntoView({behavior: 'smooth'});
  }, [log]);

  function endTurn() {
    dispatch(gameSlice.actions.endTurn());
  }

  function resetGame() {
    dispatch(gameSlice.actions.resetGame());
  }

  function startGame() {
    dispatch(gameSlice.actions.startGame());
  }

  function startDebugGame() {
    dispatch(gameSlice.actions.startDebugGame());
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
    <div className={className + ' GameSidebar'}>
      <header className="header">Good Cop/Bad Cop</header>

      <div className="actions">
        <div className="summary">
          {stage === GameStage.END_GAME && (
            <h2>
              {winner === Team.GOOD
                ? 'The good cops win!'
                : 'The bad cops win!'}
            </h2>
          )}

          {stage === GameStage.PLAYING && (
            <>
              {isYourTurn && <h2>Your turn!</h2>}
              {!isYourTurn && <h2>{currentPlayer.name}'s turn</h2>}
              <NextTaskSummary></NextTaskSummary>
            </>
          )}

          {stage === GameStage.PRE_GAME && (
            <>
              <h2>Waiting for the game to start</h2>
              Players:
              <ul>
                {everyone.map(player => (
                  <li key={player.id}>
                    {player.name} ({player.id})
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="btns">
          {stage === GameStage.PRE_GAME && (
            <>
              {canStartGame && (
                <button className="btn" onClick={startGame}>
                  Start game
                </button>
              )}
            </>
          )}

          {stage === GameStage.PLAYING && isYourTurn && (
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
            </>
          )}
        </div>
      </div>

      <div className="supply">
        <h2>Supply</h2>

        <div className="supply-groups">
          <div className="equipment">
            {equipment && <EquipmentCard card={equipment}></EquipmentCard>}
          </div>
          <div className="guns">
            {gunSupply.map(gun => (
              <Gun key={gun.id} gun={gun} small={true}></Gun>
            ))}
          </div>
        </div>
      </div>

      <div className="log">
        <ol>
          {log.map((entry, i) => (
            <li key={i}>{entry.msg}</li>
          ))}
          <div ref={logEndRef}></div>
        </ol>
      </div>

      <div className="debug">
        <button className="btn" onClick={resetGame}>
          Reset
        </button>

        {debug && (
          <>
            <button className="btn" onClick={startDebugGame}>
              Debug game
            </button>

            <select value={localPlayer?.id} onChange={emulatePlayer}>
              {players.map(player => (
                <option key={player.id} value={player.id}>
                  {player.name} ({player.id})
                </option>
              ))}
            </select>
          </>
        )}
      </div>
    </div>
  );
}

export default GameSidebar;
