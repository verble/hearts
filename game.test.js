import * as g from "./game";

const game = g.newGame();

const testGame = (() => {
  const shuffleString =
      "4♠ 3♦ Q♥ Q♣ 3♣ 9♣ 7♥ 2♣ 3♥ 9♠ A♥ 6♠ 9♥"
    + " 3♠ 4♥ 2♠ 7♦ A♦ 2♦ 10♣ 6♦ 5♠ K♠ K♥ 5♥ 4♣"
    + " 10♠ K♣ A♣ 8♠ K♦ J♦ 5♦ 10♦ 2♥ 9♦ 8♣ 7♠ 4♦"
    + " 5♣ A♠ J♠ 8♥ Q♠ J♥ 10♥ 6♥ J♣ 7♣ 6♣ 8♦ Q♦";
  const shuffledDeck = shuffleString.split(" ").map(str => {
    return new g.Card(str[0], str[1]);
  });
  return g.newGame(shuffledDeck);
})();

describe("a new game object", () => {
  it("should have 52 cards on initialization", () => {
    const numCards = game.hands.flat().length;
    expect(numCards).toBe(52);
  });

  it("should have one of each card in the deck", () => {
    const cards = game.hands.flat();

    const hasAll = g.NEW_DECK.every(searchCard => {
      return cards.find(card => card.eq(searchCard)) != undefined;
    });

    expect(hasAll).toBe(true);
  });

  it("should start with the holder of the two of clubs", () => {
    let ix = g.currentHand(game).find(card => card.eq(g.TWO_CLUBS));
    expect(ix).not.toBe(undefined);
  });
});
