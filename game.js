"use strict";

const CARD_WIDTH = 110;
const CARD_HEIGHT = 160;
const FONT_SIZE = 20;
const BORDER_SIZE = 5;

const VERTICAL = "vertical";
const HORIZONTAL = "horizontal";

const HEARTS = "♥";
const SPADES = "♠";
const DIAMONDS = "♦";
const CLUBS = "♣";

const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUITS = [HEARTS, SPADES, DIAMONDS, CLUBS];

// let card = { rank: "3", suit: HEARTS };

const suitColor = function(suit) {
  if (suit == HEARTS || suit == DIAMONDS) {
    return "red";
  } else {
    return "black";
  }
};

const suitCompare = function(a, b) {
  let aIx = SUITS.indexOf(a);
  let bIx = SUITS.indexOf(b);

  if (aIx < bIx) {
    return -1;
  } else if (aIx > bIx) {
    return 1;
  } else {
    return 0;
  }
}

const rankCompare = function(a, b) {
  let aIx = RANKS.indexOf(a);
  let bIx = RANKS.indexOf(b);

  if (aIx < bIx) {
    return -1;
  } else if (aIx > bIx) {
    return 1;
  } else {
    return 0;
  }
}

const cardDisplayCompare = function(a, b) {
  if (suitCompare(a.suit, b.suit) == 0) {
    return rankCompare(a.rank, b.rank);
  } else {
    return suitCompare(a.suit, b.suit);
  }
}

const NEW_DECK = function() {
  var deck = [];
  for (let suit of SUITS) {
    for (let rank of RANKS) {
      deck.push({rank, suit});
    }
  }
  return deck;
}();

// https://medium.com/@nitinpatel_20236/how-to-shuffle-correctly-shuffle-an-array-in-javascript-15ea3f84bfb
const shuffle = function(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * i);
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
};

const init = function() {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext('2d');
  return ctx;
};

const drawCard = function(ctx, x, y, card, orientation) {
  ctx.fillStyle = "white";
  ctx.strokeWidth = BORDER_SIZE;
  ctx.font = FONT_SIZE + "px sans-serif";

  const HOR_OFFSET = 10;
  const VER_OFFSET = 5;

  const { width, height } = function() {
    if (orientation == VERTICAL) {
      return { width: CARD_WIDTH, height: CARD_HEIGHT };
    } else {
      return { width: CARD_HEIGHT, height: CARD_WIDTH };
    }
  }();

  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);

  ctx.fillStyle = suitColor(card.suit);
  const label = card.rank + card.suit;

  if (orientation == VERTICAL) {
    // draw top label
    ctx.save();
    ctx.translate(x + HOR_OFFSET, y + VER_OFFSET + FONT_SIZE);
    ctx.fillText(label, 0, 0);
    ctx.restore();

    // draw bottom label
    ctx.save();
    ctx.translate(x + width - HOR_OFFSET, y + height - VER_OFFSET - FONT_SIZE);
    ctx.rotate(Math.PI);
    ctx.fillText(label, 0, 0);
    ctx.restore();
  } else {
    // draw right label
    ctx.save();
    ctx.translate(x + width - VER_OFFSET - FONT_SIZE, y + HOR_OFFSET);
    ctx.rotate(Math.PI/2);
    ctx.fillText(label, 0, 0);
    ctx.restore();

    // draw left label
    ctx.save();
    ctx.translate(x + VER_OFFSET + FONT_SIZE, y + height - HOR_OFFSET);
    ctx.rotate(-Math.PI/2);
    ctx.fillText(label, 0, 0);
    ctx.restore();
  }
};

const drawHand = function(ctx, hand) {
  let xOverlapFactor = 2.3;
  let yOverlapFactor = 0.6;
  let visibleCardWidth = CARD_WIDTH/xOverlapFactor;
  let usedSpace = visibleCardWidth * (hand.length - 1) + CARD_WIDTH;

  let x = (ctx.canvas.clientWidth - usedSpace) / 2;
  let y = ctx.canvas.clientHeight - (yOverlapFactor * CARD_HEIGHT);

  for (let i = 0; i < hand.length; i++) {
    drawCard(ctx, x, y, hand[i], VERTICAL);
    x += visibleCardWidth;
  }
};

const drawBackground = function(ctx) {
  ctx.fillStyle = "green";
  ctx.fillRect(0, 0, 800, 600);
};

const makeHands = function() {
  const deck = [...NEW_DECK];
  shuffle(deck);

  const hands = [];
  const handSize = deck.length / 4;
  for (let i = 0; i < 4; i++) {
    let hand = deck.splice(0, handSize);
    hand.sort(cardDisplayCompare);
    hands.push(hand);
  }

  return hands;
};

document.addEventListener("DOMContentLoaded", function() {
  const ctx = init();
  const hands = makeHands();

  drawBackground(ctx);
  drawHand(ctx, hands[0]);
});
