import { shuffle } from "./util.js";

export const HEARTS = "♥";
export const SPADES = "♠";
export const DIAMONDS = "♦";
export const CLUBS = "♣";
export const SUITS = [HEARTS, SPADES, DIAMONDS, CLUBS];

export const Suit = new Object();

Suit.compare = function(a, b) {
  let aIx = SUITS.indexOf(a);
  let bIx = SUITS.indexOf(b);

  if (aIx < bIx) {
    return -1;
  } else if (aIx > bIx) {
    return 1;
  } else {
    return 0;
  }
};

export const RANKS =
  ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

export const Rank = new Object();

Rank.compare = function(a, b) {
  let aIx = RANKS.indexOf(a);
  let bIx = RANKS.indexOf(b);

  if (aIx < bIx) {
    return -1;
  } else if (aIx > bIx) {
    return 1;
  } else {
    return 0;
  }
};

export const RED = "red";
export const BLACK = "black";

export const Card = function(rank, suit) {
  this.rank = rank;
  this.suit = suit;
};

Card.prototype.eq = function(card) {
  return this.rank === card.rank && this.suit == card.suit;
};

Card.prototype.suitColor = function() {
  if (this.suit == HEARTS || this.suit == DIAMONDS) {
    return RED;
  } else {
    return BLACK;
  }
};

Card.compare = function(a, b) {
  if (Suit.compare(a.suit, b.suit) == 0) {
    return Rank.compare(a.rank, b.rank);
  } else {
    return Suit.compare(a.suit, b.suit);
  }
}

// usage: toCards("H 10 2 C 1") => [10♥, 2♥, 1♣]
export const toCards = function(str) {
  const tokens = str.split(" ").reverse();
  const cards = [];

  var suit = HEARTS;

  while (tokens.length > 0) {
    const token = tokens.pop();
    switch (token) {
    case "H":
      suit = HEARTS;
      break;
    case "S":
      suit = SPADES;
      break;
    case "D":
      suit = DIAMONDS;
      break;
    case "C":
      suit = CLUBS;
      break;
    default:
      cards.push(new Card(token, suit));
    }
  }

  return cards;
}

export const TWO_CLUBS = new Card("2", CLUBS);
export const QUEEN_SPADES = new Card("Q", SPADES);

export const STANDARD_DECK = function() {
  var deck = [];
  for (let suit of SUITS) {
    for (let rank of RANKS) {
      deck.push(new Card(rank, suit));
    }
  }
  return deck;
}();

export const randomDeck = function() {
  const deck = [...STANDARD_DECK];
  shuffle(deck);
  return deck;
};
