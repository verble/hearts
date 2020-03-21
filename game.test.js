import { toCards, TWO_CLUBS, STANDARD_DECK } from "./card.js";
import {
  newGame, 
  WEST,
  isOver,
  currentHand,
  heartsBroken,
  play,
  canPlay,
  score,
} from "./game.js";
import { newState, advance, AI_MOVE } from "./app.js";

const randomGame = newGame();

const exampleGame1 = {
  turn: WEST,
  hands: [
    toCards("H 2 3 4 5 6 7 8 9 10 J K Q C A"),
    toCards("S 2 3 4 5 6 7 8 9 10 J K Q A"),
    toCards("D 2 3 4 5 6 7 8 9 10 J K Q A"),
    toCards("C 2 3 4 5 6 7 8 9 10 J K Q H A"),
  ],
  tricks: [],
  currentTrick: [],
  names: ["N", "E", "S", "W"]
};

const finishedGame = (() => {
  let next = newState(randomGame);
  while (!isOver(next.game)) {
    next = advance(next, { type: AI_MOVE });
  }
  return next.game;
})();

describe("A game object", () => {
  it("should have 52 cards on initialization", () => {
    const numCards = randomGame.hands.flat().length;
    expect(numCards).toBe(52);
  });

  it("should have one of each card in the deck", () => {
    const cards = randomGame.hands.flat();

    const hasAll = STANDARD_DECK.every(searchCard => {
      return cards.find(card => card.eq(searchCard)) != undefined;
    });

    expect(hasAll).toBe(true);
  });

  it("should start with the holder of the two of clubs", () => {
    let ix = currentHand(randomGame).find(card => card.eq(TWO_CLUBS));
    expect(ix).not.toBe(undefined);
  });

  it("should not be over on initialization", () => {
    expect(isOver(randomGame)).toBeFalsy();
  });

  it("should not have hearts broken on initialization", () => {
    expect(heartsBroken(randomGame)).toBeFalsy();
  });

  it("should allow unbroken heart at start of trick if only option", () => {
    var next = play(exampleGame1, TWO_CLUBS);
    next = play(next, toCards("C A")[0])
    next = play(next, toCards("S 2")[0])
    next = play(next, toCards("D 2")[0])

    expect(heartsBroken(exampleGame1)).toBeFalsy();
    expect(canPlay(next, toCards("H 2")[0])).toBeTruthy();
  });
});

describe("A finished round", () => {
  it("should have 26 or 78 total points", () => {
    const sum = score(finishedGame).reduce((a, b) => a + b);
    expect(sum == 26 || sum == 78).toBeTruthy();
  });
});
