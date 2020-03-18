"use strict";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const CARD_WIDTH = 110;
const CARD_HEIGHT = 160;
const FONT_SIZE = 20;
const BORDER_SIZE = 5;

const VERTICAL = "vertical";
const HORIZONTAL = "horizontal";

const LEFT = "left";
const RIGHT = "right";
const CENTER = "center";

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
const PAUSED = "paused"; // give user time to see cards played

// reducer actions
const NEW_GAME = "new_game";
const RANDOM = "random";
const CONTINUE = "continue";
const PLAY = "play";

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

// usage: toCards("H 10 2 C 1") => [10♥, 2♥, 1♣]
const toCards = function(str) {
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

const randomDeck = function() {
  const deck = [...NEW_DECK];
  shuffle(deck);
  return deck;
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

const cardBounds = function(numCards) {
  const xOverlapFactor = 2.3;
  const yOverlapFactor = 0.6;

  const visibleCardWidth = CARD_WIDTH/xOverlapFactor;
  const usedSpace = visibleCardWidth * (numCards - 1) + CARD_WIDTH;

  // starting values of x and y
  let x = (CANVAS_WIDTH - usedSpace) / 2;
  const y = CANVAS_HEIGHT - (yOverlapFactor * CARD_HEIGHT);

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
  const bounds = cardBounds(hand.length);

  for (let i = 0; i < hand.length; i++) {
    drawCard(ctx, bounds[i].x, bounds[i].y, hand[i], VERTICAL);
  }
};

const drawBackground = function(ctx) {
  const x = CANVAS_WIDTH / 2;
  const y = CANVAS_HEIGHT / 2;
  const gradient = ctx.createRadialGradient(x, y, 150, x, y, 700);

  gradient.addColorStop(0, "#007415");
  gradient.addColorStop(1, "#115200");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
};

const makeHands = function(deck) {
  const hands = [];
  const handSize = deck.length / 4;
  for (let i = 0; i < 4; i++) {
    let hand = deck.splice(0, handSize);
    hand.sort(cardDisplayCompare);
    hands.push(hand);
  }

  return hands;
};

const newGame = function(deck = randomDeck()) {
  const hands = makeHands(deck);

  // who has the two of clubs?
  const starterIx = hands.findIndex(hand =>
    hand.findIndex(card => card.eq(TWO_CLUBS)) != -1
  );

  return {
    turn: PLAYERS[starterIx],
    hands: hands,
    tricks: [],
    currentTrick: [],
    names: ["Trixie", "Coco", "You", "Katya"]
  };
};

const currentHand = function(game) {
  return game.hands[PLAYERS.indexOf(game.turn)];
};

const previousTrick = function(game) {
  return game.tricks[game.tricks.length - 1];
};

const isStartOfGame = function(game) {
  return game.tricks.length === 0 && game.currentTrick.length === 0;
};

const isStartOfTrick = function(game) {
  return game.currentTrick.length === 0;
};

const heartsBroken = function(game) {
  let previousPlays = game.currentTrick.concat(game.tricks.flat());
  let previousCards = previousPlays.map(play => play.card);
  let firstHeart = previousCards.find(card => card.suit === HEARTS);

  return firstHeart != undefined;
};

const playableCards = function(game) {
  if (isStartOfGame(game)) {
    return [TWO_CLUBS];
  }

  if (isStartOfTrick(game) && !heartsBroken(game)) {
    // can play anything except hearts
    return currentHand(game).filter(card => card.suit != HEARTS);
  } else if (isStartOfTrick(game)) {
    // can play anything
    return currentHand(game).slice(0);
  } else {
    // if not start of trick, can we follow suit?
    const leadingSuit = game.currentTrick[0].card.suit;
    const matchingCards = currentHand(game)
      .filter(card => card.suit === leadingSuit);

    if (matchingCards.length != 0) {
      // yes, must follow suit
      return matchingCards;
    } else {
      // no, we can play anything
      return currentHand(game).slice(0);
    }
  }
};

const canPlay = function(game, selected) {
  return playableCards(game).findIndex(card => card.eq(selected)) != -1;
};

const nextClockwise = function(game) {
  let i = PLAYERS.indexOf(game.turn);
  if (i == PLAYERS.length - 1) {
    i = 0;
  } else {
    i++;
  }
  return PLAYERS[i];
};

const isOver = function(game) {
  return game.hands.every(hand => hand.length === 0);
};

const getSelectedCard = function(game, x, y) {
  const playerHand = game.hands[PLAYERS.indexOf(SOUTH)];
  const bounds = cardBounds(playerHand.length);

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

const score = function(game) {
  const score = [0, 0, 0, 0];

  for (let i = 0; i < game.tricks.length; i++) {
    const winner = trickWinner(game.tricks[i]);
    const points = game.tricks[i].reduce(function(sum, play) {
      if (play.card.suit == HEARTS) {
        return sum + 1;
      } else if (play.card.eq(QUEEN_SPADES)) {
        return sum + 13;
      } else {
        return sum
      }
    }, 0);

    score[PLAYERS.indexOf(winner)] += points;
  };

  // did anyone shoot the moon?
  if (score.some(s => s === 26)) {
    return score.map(s => s === 26 ? 0 : 26);
  }

  return score;
};

const winners = function(game) {
  const s = score(game);
  const lowScore = Math.min.apply(null, s);
  const winners = [];
  for (let i = 0; i < PLAYERS.length; i++) {
    if (s[i] === lowScore) {
      winners.push(PLAYERS[i]);
    }
  }
  return winners;
};

const drawTrick = function(ctx, trick) {

  const centerX = CANVAS_WIDTH / 2;
  const centerY = CANVAS_HEIGHT / 2;
  const centerMargin = 10;

  const opts = {
    [NORTH]: {
      x: centerX - (CARD_WIDTH / 2),
      y: centerY - CARD_HEIGHT - centerMargin,
      orientation: VERTICAL
    },
    [EAST]: {
        x: centerX + centerMargin,
        y: centerY - (CARD_WIDTH / 2),
        orientation: HORIZONTAL
    },
    [SOUTH]:  {
      x: centerX - (CARD_WIDTH / 2),
      y: centerY + centerMargin,
      orientation: VERTICAL
    },
    [WEST]: {
      x: centerX - CARD_HEIGHT - centerMargin,
      y: centerY - (CARD_WIDTH / 2),
      orientation: HORIZONTAL
    }
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

// x and y refer to the top-left corner
const drawRoundedBox = function(ctx, x, y, width, height, radius) {

  // midpoint of each edge
  const north = { x: x + width / 2, y: y              };
  const east  = { x: x + width,     y: y + height / 2 };
  const south = { x: x + width / 2, y: y + height     };
  const west  = { x: x,             y: y + height / 2 };

  // corners
  const northEast = { x: x + width, y: y          };
  const southEast = { x: x + width, y: y + height };
  const southWest = { x: x,         y: y + height };
  const northWest = { x: x,         y: y          };

  ctx.beginPath();
  ctx.moveTo(north.x, north.y);
  ctx.arcTo(northEast.x, northEast.y, east.x, east.y, radius);
  ctx.arcTo(southEast.x, southEast.y, south.x, south.y, radius);
  ctx.arcTo(southWest.x, southWest.y, west.x, west.y, radius);
  ctx.arcTo(northWest.x, northWest.y, north.x, north.y, radius);
  ctx.fill();
};

const drawLabel = function(ctx, x, y, fontSize, align, text) {
  ctx.save();

  ctx.font = fontSize + "px Verdana";
  ctx.textBaseline = "middle";

  const cornerRadius = 5;
  const margin = 6;
  const textX = x + margin;
  const textY = y + margin + fontSize / 2;
  const textWidth = ctx.measureText(text).width + margin * 2;

  if (align === CENTER) {
    ctx.translate(-textWidth / 2, 0);
  } else if (align === RIGHT) {
    ctx.translate(-textWidth, 0);
  } else {
    // no adjustment needed
  }

  ctx.fillStyle = "#ab0b00";
  drawRoundedBox(ctx, x, y, textWidth, fontSize + margin * 2, cornerRadius);
  ctx.fillStyle = "white";
  ctx.fillText(text, textX, textY);

  ctx.restore();
};

const drawNames = function(ctx, names) {
  // TODO: remove magic number 12 which vertically centers labels
  drawLabel(ctx, 10, CANVAS_HEIGHT / 2 - 12, 20, LEFT, names[3]);
  drawLabel(ctx, CANVAS_WIDTH / 2, 10, 20, CENTER, names[0]);
  drawLabel(ctx, CANVAS_WIDTH - 10, CANVAS_HEIGHT / 2 - 12, 20, RIGHT, names[1]);
};

const draw = function(ctx, scoreDisplay, state) {
  drawBackground(ctx);

  console.log(state);

  const trick = function() {
    if (state.uiState === PAUSED) {
      return state.game.tricks[state.game.tricks.length - 1];
    } else {
      return state.game.currentTrick;
    }
  }();
  drawTrick(ctx, trick);

  drawHand(ctx, state.game.hands[PLAYERS.indexOf(SOUTH)]);

  // draw computer hands
  drawFan(ctx, state.game.hands[PLAYERS.indexOf(NORTH)].length, 400, -60, 180);
  drawFan(ctx, state.game.hands[PLAYERS.indexOf(EAST)].length, 860, 300, 270);
  drawFan(ctx, state.game.hands[PLAYERS.indexOf(WEST)].length, -60, 300, 90);

  drawNames(ctx, state.game.names);

  // draw displayScore
  if (isOver(state.game) && state.uiState != PAUSED) {
    scoreDisplay.hidden = false;
    scoreDisplay.names = state.game.names;
    scoreDisplay.scores = score(state.game);

    const ws = winners(state.game);
    if (ws.length != 1) {
      scoreDisplay.winText = "It’s a Tie!";
    } else if (ws[0] === SOUTH) {
      scoreDisplay.winText = "You Win!";
    } else {
      scoreDisplay.winText =
        state.game.names[PLAYERS.indexOf(ws[0])] + " Wins!";
    }
  } else {
    scoreDisplay.hidden = true;
  }
};

// TODO: bad moves are ignored
// don't care whose turn
const play = function(game, selected) {

  // add move to current trick
  let updatedTrick = [
    ...game.currentTrick,
    { card: selected, player: game.turn }
  ];

  // remove card from current hand
  const removeIx = currentHand(game).findIndex(card => card.eq(selected));
  let updatedHands = game.hands.map((hand, handsIx) => {
    if (handsIx !== PLAYERS.indexOf(game.turn)) {
      return hand;
    } else {
      return hand.filter((card, cardIx) => cardIx !== removeIx);
    }
  });

  // is round over?
  if (updatedTrick.length === 4) {
    // winner of trick is next to play
    let nextPlayer = trickWinner(updatedTrick);

    return {
      ...game,
      currentTrick: [],
      hands: updatedHands,
      tricks: [...game.tricks, updatedTrick],
      turn: nextPlayer
    };

  } else {
    // no, play continues clockwise
    let nextPlayer = nextClockwise(game);

    return {
      ...game,
      currentTrick: updatedTrick,
      hands: updatedHands,
      turn: nextPlayer
    };
  }
};

const computerTurn = function(state) {
  let updatedGame = play(state.game, pick(playableCards(state.game)));

  let trickOver = updatedGame.currentTrick.length === 0;
  let computerPlayedLast =
    previousTrick(updatedGame) !== undefined
    && previousTrick(updatedGame)[3] !== SOUTH;

  if (trickOver && computerPlayedLast) {
    // need to pause so user can see play
    return {
      ...state,
      uiState: PAUSED,
      game: updatedGame
    };
  } else {
    return {
      ...state,
      game: updatedGame
    };
  }
};

const advance = function(state, action) {

  console.log(action);

  // CONTINUE = next computer player goes or start next trick
  // PLAY card = play selected card
  // NEW_GAME = start new game
  // RANDOM = for testing, current player makes random legal move

  switch (action.type) {
  case PLAY:
    if (state.uiState === PAUSED) {
      return {
        ...state,
        uiState: NORMAL
      };
    }
    // is it the player's turn?
    if (state.game.turn === SOUTH) {
      // legal move?
      if (canPlay(state.game, action.card)) {
        return {
          ...state,
          game: play(state.game, action.card)
        };
      } else {
        // illegal, do nothing
        return state;
      }
    } else {
      // no, have the computer go
      return computerTurn(state);
    }
  case CONTINUE:
    if (state.uiState === PAUSED) {
      return {
        ...state,
        uiState: NORMAL
      };
    } else if (state.game.turn === SOUTH) {
      return state;
    } else {
      return computerTurn(state);
    }
  case NEW_GAME:
    return {
      game: newGame(),
      uiState: NORMAL
    };
  case RANDOM:
    return computerTurn(state);
  default:
    return state;
  }
};

const ScoreDisplay = function(containingDiv) {
  const template = `
    <h1>You Win!</h1>
    <table>
      <tbody>
        <tr id="west">
          <td class="name"></td>
          <td class="score"></td>
        </tr>
        <tr id="north">
          <td class="name"></td>
          <td class="score"></td>
        </tr>
        <tr id="east">
          <td class="name"></td>
          <td class="score"></td>
        </tr>
        <tr id="south">
          <td class="name"></td>
          <td class="score"></td>
        </tr>
      </tbody>
    </table>
    <button type="button">New Game</button>
  `;

  // stackoverflow.com/questions/16270761
  this.element = document.createElement("div");
  this.element.setAttribute("id", "finalScore");
  this.element.innerHTML = template;
  this.element.style.display = "none";
  containingDiv.appendChild(this.element);
};

ScoreDisplay.prototype = {
  set names(value) {
    this.element.querySelector("#north .name").innerHTML = value[0];
    this.element.querySelector("#east .name").innerHTML = value[1];
    this.element.querySelector("#south .name").innerHTML = value[2]
    this.element.querySelector("#west .name").innerHTML = value[3];
  },

  set scores(value) {
    this.element.querySelector("#north .score").innerHTML = value[0];
    this.element.querySelector("#east .score").innerHTML = value[1];
    this.element.querySelector("#south .score").innerHTML = value[2]
    this.element.querySelector("#west .score").innerHTML = value[3];
  },

  set hidden(value) {
    if (value) {
      this.element.style.display = "none";
    } else {
      this.element.style.display = "";
    }
  },

  set buttonHandler(value) {
    this.element.querySelector("button").addEventListener("click", value);
  },

  set winText(value) {
    this.element.querySelector("h1").innerHTML = value;
  }
};

const Application = function(state, reducer, drawer) {
  this.state = state;
  this.reducer = reducer;
  this.drawer = drawer;
};

Application.prototype.draw = function() {
  this.drawer(this.state);
};

Application.prototype.advance = function(action) {
  this.state = this.reducer(this.state, action);
  this.draw();
}

const newState = function(game = newGame(), uiState = NORMAL) {
  return { game, uiState };
};

document.addEventListener("DOMContentLoaded", function() {
  // get DOM references
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext('2d');
  const display = new ScoreDisplay(canvas.parentElement);

  const drawer = (state) => {
    draw(ctx, display, state);
  };

  const state = newState();
  const app = new Application(state, advance, drawer);

  canvas.addEventListener("click", event => {
    // get (x,y) in canvas coordinate system
    const canvasRect = canvas.getBoundingClientRect();
    const x = event.clientX - canvasRect.left;
    const y = event.clientY - canvasRect.top;

    // get selected card if any
    const card = getSelectedCard(app.state.game, x, y);
    if (card !== undefined) {
      app.advance({ type: PLAY, card: card });
    } else {
      app.advance({ type: CONTINUE });
    }
  });

  display.buttonHandler = event => {
    app.advance({ type: NEW_GAME });
  };

  // initial draw
  app.draw();
});

export { newGame, Card, NEW_DECK, TWO_CLUBS, currentHand, advance, isOver, RANDOM, newState, score, toCards, SOUTH, play, WEST, heartsBroken, canPlay };
