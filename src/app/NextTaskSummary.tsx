import React from 'react';
import {useSelector} from 'react-redux';
import {TurnStage} from '../game/models';
import {
  selectIsLocalPlayersTurn,
  selectLocalSelection,
  selectPlayersById,
  selectSelections,
  selectTurn,
} from '../game/selectors';
import './NextTaskSummary.scss';

/**
 * Summarizes in text the what needs to be done next to progress the
 * game forward.
 *
 * If it is the local players turn, this could be something like:
 * "Investigate a player".
 *
 * If it is not the local players turn, this will describe what other
 * players must do to progress the game.
 */
function NextTaskSummary() {
  const isYourTurn = useSelector(selectIsLocalPlayersTurn);
  const turn = useSelector(selectTurn);
  const selections = useSelector(selectSelections);

  return (
    <div className="NextTaskSummary">
      {isYourTurn && (
        <>
          {selections.length > 0 && <SelectionsSummary></SelectionsSummary>}
          {selections.length === 0 && (
            <>
              {turn.stage === TurnStage.TAKE_ACTION && (
                <>Investigate, Arm, Equip, or Shoot</>
              )}

              {turn.stage === TurnStage.TAKE_AIM && <>Aim your gun</>}

              {turn.stage === TurnStage.POST && (
                <>Turn over. End turn when ready.</>
              )}
            </>
          )}
        </>
      )}

      {!isYourTurn && (
        <>
          {selections.length > 0 && <SelectionsSummary></SelectionsSummary>}
          {selections.length === 0 && (
            <>
              {turn.stage === TurnStage.TAKE_ACTION && (
                <>Player is picking an action</>
              )}

              {turn.stage === TurnStage.TAKE_AIM && (
                <>Player is aiming their gun</>
              )}

              {turn.stage === TurnStage.POST && (
                <>Waiting for player to hit end turn</>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function SelectionsSummary() {
  const activeSelection = useSelector(selectLocalSelection);
  const selections = useSelector(selectSelections);
  const playersById = useSelector(selectPlayersById);

  return (
    <>
      {activeSelection && (
        <div className="your-selection">{activeSelection.description}</div>
      )}
      {!activeSelection && selections.length > 0 && (
        <>
          Waiting on:
          <ul>
            {selections.map(selection => (
              <li key={selection.id}>
                {playersById[selection.player].name}: {selection.description}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

export default NextTaskSummary;
