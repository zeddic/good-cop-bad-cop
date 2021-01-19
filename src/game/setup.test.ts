import {buildIntegrityDeck, getIntegrityCardAssignments} from './setup';
import {IntegrityCardType} from './models';

describe('integrity cards', () => {
  test('deck size changes based on number of players', () => {
    expect(buildIntegrityDeck(4).length).toEqual(12);
    expect(buildIntegrityDeck(5).length).toEqual(16);
    expect(buildIntegrityDeck(6).length).toEqual(18);
    expect(buildIntegrityDeck(7).length).toEqual(22);
    expect(buildIntegrityDeck(8).length).toEqual(24);
  });

  test('first two cards in deck are boss cards', () => {
    const deck = buildIntegrityDeck(8);
    expect(deck[0]).toEqual(IntegrityCardType.KING_PIN);
    expect(deck[1]).toEqual(IntegrityCardType.AGENT);
  });

  it('can properly deal sets of cards for players', () => {
    const numPlayersToTest = [4, 5, 6, 7, 8];

    for (const num of numPlayersToTest) {
      const assignments = getIntegrityCardAssignments(num);

      for (const assign of assignments) {
        const hasKingPin = assign.some(c => c.type === 'king_pin');
        const hasAgent = assign.some(c => c.type === 'agent');
        const allFaceDown = assign.every(c => c.state === 'face_down');

        expect(hasAgent && hasKingPin).toBe(false);
        expect(assign.length).toEqual(3);
        expect(allFaceDown).toBe(true);
      }
    }
  });
});
