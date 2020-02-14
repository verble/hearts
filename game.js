"use strict";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const CARD_WIDTH = 110;
const CARD_HEIGHT = 160;
const FONT_SIZE = 20;
const BORDER_SIZE = 5;

const VERTICAL = "vertical";
const HORIZONTAL = "horizontal";

const NORTH = "north";
const EAST = "east";
const SOUTH = "south";
const WEST = "west";
const PLAYERS = [NORTH, EAST, SOUTH, WEST];

const HEARTS = "♥";
const SPADES = "♠";
const DIAMONDS = "♦";
const CLUBS = "♣";

const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const SUITS = [HEARTS, SPADES, DIAMONDS, CLUBS];

// game states
const NORMAL = "normal"; // waiting on the next move
const TRICK_END = "trick_end"; // interface paused until user clicks
const GAME_OVER = "game_over"; // show score

const Card = function(rank, suit) {
  this.rank = rank;
  this.suit = suit;
};

Card.prototype.eq = function(card) {
  return this.rank === card.rank && this.suit == card.suit;
};

Card.prototype.suitColor = function() {
  if (this.suit == HEARTS || this.suit == DIAMONDS) {
    return "red";
  } else {
    return "black";
  }
};

const TWO_CLUBS = new Card("2", CLUBS);
const QUEEN_SPADES = new Card("Q", SPADES);

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
      deck.push(new Card(rank, suit));
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

const BoundingBox = function(x, y, width, height) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
};

BoundingBox.prototype.contains = function(x, y) {
  const inX = this.x <= x && x <= (this.x + this.width);
  const inY = this.y <= y && y <= (this.y + this.height);
  return inX && inY;
};

const cardBounds = function(ctx, numCards) {
  const xOverlapFactor = 2.3;
  const yOverlapFactor = 0.6;

  const visibleCardWidth = CARD_WIDTH/xOverlapFactor;
  const usedSpace = visibleCardWidth * (numCards - 1) + CARD_WIDTH;

  // starting values of x and y
  let x = (ctx.canvas.clientWidth - usedSpace) / 2;
  const y = ctx.canvas.clientHeight - (yOverlapFactor * CARD_HEIGHT);

  const bounds = [];
  for (let i = 0; i < numCards; i++) {
    bounds.push(new BoundingBox(x, y, CARD_WIDTH, CARD_HEIGHT));
    x += visibleCardWidth;
  }
  return bounds;
};

const pick = function(array) {
  const i = Math.floor(Math.random() * (array.length - 1));
  return array[i];
}

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

  ctx.fillStyle = card.suitColor();
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
  const bounds = cardBounds(ctx, hand.length);

  for (let i = 0; i < hand.length; i++) {
    drawCard(ctx, bounds[i].x, bounds[i].y, hand[i], VERTICAL);
  }
};

const drawBackground = function(ctx) {
  ctx.fillStyle = "green";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
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

const makeGame = function() {
  const hands = makeHands();

  // who has the two of clubs?
  const starter = function() {
    for (let i = 0; i < 4; i++) {
      let hasTwoOfClubs = hands[i].find(function(card) {
        return card.rank === "2" && card.suit === CLUBS;
      });
      if (hasTwoOfClubs != undefined) {
        return PLAYERS[i];
      }
    }
  }();

  // game state object
  return {
    hands: hands,
    turn: starter,
    tricks: [],
    currentTrick: [],
    state: NORMAL,

    currentHand: function() {
      return this.hands[PLAYERS.indexOf(this.turn)];
    }
  };
};

const drawTrick = function(ctx, trick) {

  const centerX = CANVAS_WIDTH / 2;
  const centerY = CANVAS_HEIGHT / 2;
  const centerMargin = 10;

  const opts = {};
  opts[NORTH] = {
      x: centerX - (CARD_WIDTH / 2),
      y: centerY - CARD_HEIGHT - centerMargin,
      orientation: VERTICAL
  };
  opts[EAST] = {
      x: centerX + centerMargin,
      y: centerY - (CARD_WIDTH / 2),
      orientation: HORIZONTAL
  };
  opts[SOUTH] = {
    x: centerX - (CARD_WIDTH / 2),
    y: centerY + centerMargin,
    orientation: VERTICAL
  };
  opts[WEST] = {
    x: centerX - CARD_HEIGHT - centerMargin,
    y: centerY - (CARD_WIDTH / 2),
    orientation: HORIZONTAL
  };

  for (let i = 0; i < trick.length; i++) {
    let o = opts[trick[i].player];
    drawCard(ctx, o.x, o.y, trick[i].card, o.orientation);
  }
};

// (x, y) is located at the bottom middle of the card
const drawReverse = function(ctx, x, y, deg) {
  const margin = 10;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(deg * 2 * Math.PI / 360);

  const adjX = -CARD_WIDTH / 2;
  const adjY = -CARD_HEIGHT;

  // back
  ctx.fillStyle = "white";
  ctx.fillRect(adjX, adjY, CARD_WIDTH, CARD_HEIGHT);

  // border
  ctx.strokeWidth = BORDER_SIZE;
  ctx.strokeRect(adjX, adjY, CARD_WIDTH, CARD_HEIGHT);

  // inset rectangle
  ctx.fillStyle = "#beebe9";
  ctx.fillRect(
    adjX + margin,
    adjY + margin,
    CARD_WIDTH - margin * 2,
    CARD_HEIGHT - margin * 2
  );

  ctx.restore();
};

// (x, y) is located at the bottom middle of fan
// at the edge of the cards
const drawFan = function(ctx, numCards, x, y, deg) {
  const rotationIncrement = 6;
  const baseRotation = -rotationIncrement * (numCards - 1) / 2;
  const degreeConvFactor = 2 * Math.PI / 360;

  const xIncrement = 6;
  const baseX = -xIncrement * numCards / 2;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(deg * degreeConvFactor);

  for (let i = 0; i < numCards; i++) {
    const ix = i * xIncrement + baseX;
    const ideg = i * rotationIncrement + baseRotation;
    drawReverse(ctx, ix, 0, ideg);
  }
  ctx.restore();
};

const draw = function(ctx, game) {
  drawBackground(ctx);
  drawTrick(ctx, game.currentTrick);
  drawHand(ctx, game.hands[PLAYERS.indexOf(SOUTH)]);

  // draw computer hands
  drawFan(ctx, game.hands[PLAYERS.indexOf(NORTH)].length, 400, -60, 180);
  drawFan(ctx, game.hands[PLAYERS.indexOf(EAST)].length, 860, 300, 270);
  drawFan(ctx, game.hands[PLAYERS.indexOf(WEST)].length, -60, 300, 90);
};

const playableCards = function(game) {
  // is this the start of the game?
  const isStartOfGame =
    game.tricks.length === 0 && game.currentTrick.length === 0;
  if (isStartOfGame) {
    // yes, we have to play the two of clubs
    return [TWO_CLUBS];
  }

  // is this the start of the trick?
  const isStartOfTrick = game.currentTrick.length === 0;

  // have hearts been broken?
  const heartsBroken = function() {
    let previousPlays = game.currentTrick.concat(game.tricks.flat());
    let previousCards = previousPlays.map(play => play.card);
    let firstHeart = previousCards.find(card => card.suit === HEARTS);

    return firstHeart != undefined;
  }();

  if (isStartOfTrick && !heartsBroken) {
    // can play anything except hearts
    return game.currentHand().filter(card => card.suit != HEARTS);
  } else if (isStartOfTrick) {
    // can play anything
    return game.currentHand().slice(0);
  }

  // if not start of trick, can we follow suit?
  const leadingSuit = game.currentTrick[0].card.suit;
  const matchingCards =
    game.currentHand().filter(card => card.suit === leadingSuit);

  if (matchingCards.length != 0) {
    // yes, must follow suit
    return matchingCards;
  } else {
    // no, we can play anything
    return game.currentHand().slice(0);
  }
};

const trickWinner = function(trick) {
  const leadingSuit = trick[0].card.suit;
  let winningPlayIx = 0;

  for (let i = 1; i < 4; i++) {
    let nextCard = trick[i].card;

    let followedSuit = leadingSuit === nextCard.suit;
    let higherRanked =
      rankCompare(trick[winningPlayIx].card.rank, nextCard.rank) < 0;

    if (followedSuit && higherRanked) {
      winningPlayIx = i;
    }
  }

  return trick[winningPlayIx].player;
};

const score = function(tricks) {
  const score = {
    [NORTH]: 0,
    [SOUTH]: 0,
    [EAST]: 0,
    [WEST]: 0
  };

  for (let i = 0; i < tricks.length; i++) {
    const winner = trickWinner(tricks[i]);
    const points = tricks[i].reduce(function(sum, play) {
      if (play.card.suit == HEARTS) {
        return sum + 1;
      } else if (play.card.eq(QUEEN_SPADES)) {
        return sum + 13;
      } else {
        return sum
      }
    }, 0);

    score[winner] += points;
  };

  return score;
};

const advance = function(game, selected) {

  switch (game.state) {
    case NORMAL:
      break;
    case TRICK_END:
      game.state = NORMAL;
      // reset current trick
      game.currentTrick = [];
      break;
    case GAME_OVER:
      return;
  }

  let cardToPlay = null;
  const ps = playableCards(game);

  // is it the player's turn?
  if (game.turn == SOUTH) {
    // did the player select a card?
    if (selected === undefined) {
      // do nothing
      return;
    }

    // is player's choice allowed?
    if (ps.findIndex(card => card.eq(selected)) != -1) {
      cardToPlay = selected;
    } else {
      // do nothing
      return;
    }
  } else {
    // play a random (allowed) card
    cardToPlay = pick(ps);
  }

  const i = game.currentHand().findIndex(card => card.eq(cardToPlay));

  console.log(game.turn + " played " + cardToPlay.rank + cardToPlay.suit);
  game.currentTrick.push({
    card: cardToPlay,
    player: game.turn
  });
  game.currentHand().splice(i, 1);

  // is round over?
  if (game.currentTrick.length === 4) {
    // need to save for pausing logic
    const currentPlayer = game.turn;

    // winner of trick is next to play
    game.turn = trickWinner(game.currentTrick);
    console.log(game.turn + " takes the trick");

    // pause if last card played was not the user's card
    if (currentPlayer != SOUTH) {
      game.state = TRICK_END;
    } else {
      // reset current trick
      game.currentTrick = [];
    }

    // save trick
    game.tricks.push(game.currentTrick);
  } else {
    // no, play continues clockwise
    let i = PLAYERS.indexOf(game.turn);
    if (i == PLAYERS.length - 1) {
      i = 0;
    } else {
      i++;
    }
    game.turn = PLAYERS[i];
  }

  // is game over?
  if (game.hands.every(hand => hand.length === 0)) {
    game.state = GAME_OVER;
    console.log("game over");
    console.log(score(game.tricks));
  }
};

const getSelectedCard = function(ctx, game, x, y) {
  const playerHand = game.hands[PLAYERS.indexOf(SOUTH)];
  const bounds = cardBounds(ctx, playerHand.length);

  let selected = undefined;
  // cards with a higher z-index appear later in the array,
  // so this loop returns the topmost card in the case that
  // the click coordinates are over multiple cards
  for (let i = 0; i < playerHand.length; i++) {
    if (bounds[i].contains(x, y)) {
      selected = playerHand[i];
    }
  }

  return selected;
};

const makeClickHandler = function(ctx, game) {
  return function(event) {
    // process input
    const canvasRect = ctx.canvas.getBoundingClientRect();
    const x = event.clientX - canvasRect.left;
    const y = event.clientY - canvasRect.top;
    let selected = getSelectedCard(ctx, game, x, y);

    advance(game, selected);
    draw(ctx, game);
  };
};

document.addEventListener("DOMContentLoaded", function() {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext('2d');

  const game = makeGame();
  canvas.addEventListener("click", makeClickHandler(ctx, game));

  // initial draw
  draw(ctx, game);
});
