import {useDispatch, useSelector} from 'react-redux';
import {gameSlice} from '../game/game_store.ts';
import {
  Player as PlayerModel,
  IntegrityCard as IntegrityCardModel,
  CardState,
  IntegrityCardType,
} from '../game/models';
import {
  selectActiveSelection,
  selectInvestigatableCards,
  selectSelectableItems,
  selectVisibleIntegrityCards,
} from '../game/selectors';

import './IntegrityCard.scss';

export function IntegrityCard(props: {
  owner: PlayerModel;
  card: IntegrityCardModel;
}) {
  const card = props.card;
  const owner = props.owner;
  const isFaceUp = card.state === CardState.FACE_UP;

  const dispatch = useDispatch();
  const visibleCards = useSelector(selectVisibleIntegrityCards);
  const investigatable = useSelector(selectInvestigatableCards);
  const selectable = useSelector(selectSelectableItems).integrityCards;
  const activeSelection = useSelector(selectActiveSelection);

  const isInvestigatable = investigatable.has(card.id);
  const isSelectable = selectable.has(card.id);
  const isClickable = isInvestigatable || isSelectable;
  const isForcedVisible = visibleCards.has(card.id) && !isFaceUp;
  const isVisible = isForcedVisible || isFaceUp;

  const classNames2 = [
    'integrity-card',
    card.state,
    isForcedVisible ? 'forced-visible' : '',
    isSelectable ? 'selectable' : '',
    isClickable ? 'clickable' : '',
    isVisible ? card.type : '', // don't leak the identity in the DOM!
  ];

  function clicked() {
    if (isSelectable) {
      const item = selectable.get(card.id)!;
      dispatch(gameSlice.actions.select(item));
      return;
    }

    if (isInvestigatable) {
      dispatch(
        gameSlice.actions.investigate({
          player: owner.id,
          card: card.id,
        })
      );
      return;
    }
  }

  function getTooltip() {
    if (isSelectable) {
      return activeSelection?.tooltip || 'Select this integrity card';
    } else if (isInvestigatable) {
      return 'Investigate!';
    } else if (isVisible) {
      if (card.type === IntegrityCardType.GOOD) {
        return 'Good Cop';
      } else if (card.type === IntegrityCardType.BAD) {
        return 'Bad Cop';
      } else if (card.type === IntegrityCardType.KING_PIN) {
        return "It's the King Pin!";
      } else {
        return "It's the Agent!";
      }
    } else {
      return '???';
    }
  }

  return (
    <button
      className={classNames2.join(' ')}
      disabled={!isClickable}
      onClick={clicked}
      title={getTooltip()}
    ></button>
  );
}
