import {
  Suit,
  SUITS,
  HEARTS,
  SPADES,
  DIAMONDS,
  CLUBS,
  Rank,
  RANKS,
  Card,
  RED,
  toCards,
  STANDARD_DECK,
  randomDeck,
} from "./card.js";
import { arraysEqual } from "./util.js";

describe("Suits", () => {
  it("should be ordered according to SUIT array", () => {
    const sorted = [...SUITS].sort(Suit.compare);
    expect(arraysEqual(sorted, SUITS)).toBeTruthy();
  });

  it("and there should be four of them", () => {
    expect(SUITS.length).toBe(4);
  });
});

describe("Ranks", () => {
  it("should be ordered according to RANK array", () => {
    const sorted = [...RANKS].sort(Rank.compare);
    expect(arraysEqual(sorted, RANKS)).toBeTruthy();
  });

  it("and there should be thirteen of them", () => {
    expect(RANKS.length).toBe(13);
  });
});

describe("A Card", () => {
  const card = new Card("3", HEARTS);

  it("should have a suit and rank", () => {
    expect(card.suit).toBe(HEARTS);
    expect(card.rank).toBe("3");
  });

  it("should have a suit color", () => {
    expect(card.suitColor()).toBe(RED);
  });

  it("should be ordered by suit first, then rank", () => {
    const one = new Card("3", CLUBS);
    const two = new Card("3", DIAMONDS);
    const three = new Card("A", DIAMONDS);
    const actual = [one, two, three].sort(Card.compare);
    const expected = [two, three, one];

    expect(arraysEqual(actual, expected)).toBeTruthy();
  });

  it("should equal another card of same suit and rank", () => {
    const one = new Card("K", SPADES);
    const two = new Card("K", SPADES);
    const three = new Card("Q", SPADES);
    const four = new Card("K", DIAMONDS);

    expect(one.eq(two)).toBeTruthy();
    expect(one.eq(three)).toBeFalsy();
    expect(one.eq(four)).toBeFalsy();
  });

  it("should be constructable with `toCards`", () => {
    const actual = toCards("H 3 4 A C 2 H K");
    const expected = [
      new Card("3", HEARTS),
      new Card("4", HEARTS),
      new Card("A", HEARTS),
      new Card("2", CLUBS),
      new Card("K", HEARTS),
    ];

    const eq = actual.every((e, ix) => e.eq(expected[ix]));
    expect(eq).toBeTruthy();
  });
});

describe("A randomly generated deck", () => {
  it("should have all 52 cards", () => {
    const deck = randomDeck().sort(Card.compare);
    expect(arraysEqual(deck, STANDARD_DECK));
  });
});
