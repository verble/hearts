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

const exampleGame1 = {
  turn: g.WEST,
  hands: [
    g.toCards("H 2 3 4 5 6 7 8 9 10 J K Q C A"),
    g.toCards("S 2 3 4 5 6 7 8 9 10 J K Q A"),
    g.toCards("D 2 3 4 5 6 7 8 9 10 J K Q A"),
    g.toCards("C 2 3 4 5 6 7 8 9 10 J K Q H A"),
  ],
  tricks: [],
  currentTrick: [],
  names: ["N", "E", "S", "W"]
};

const finishedGame = (() => {
  let next = g.newState(game);
  while (!g.isOver(next.game)) {
    next = g.advance(next, { type: g.RANDOM });
  }
  return next.game;
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

  it("should allow unbroken heart at start of trick if only option", () => {
    var next = g.play(exampleGame1, g.TWO_CLUBS);
    next = g.play(next, g.toCards("C A")[0])
    next = g.play(next, g.toCards("S 2")[0])
    next = g.play(next, g.toCards("D 2")[0])

    expect(g.heartsBroken(exampleGame1)).toBeFalsy();
    expect(g.canPlay(next, g.toCards("H 2")[0])).toBeTruthy();
  });
});

describe("A finished round", () => {
  it("should have 26 or 78 total points", () => {
    const sum = g.score(finishedGame).reduce((a, b) => a + b);
    expect(sum == 26 || sum == 78).toBeTruthy();
  });
});
