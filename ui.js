import {
  NORTH,
  EAST,
  SOUTH,
  WEST,
  PLAYERS,
  isOver,
  score,
  winners,
  isStartOfTrick,
  isStartOfGame,
} from "./game.js";

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

// ui states
export const NORMAL = "normal"; // waiting on the next move
export const PAUSED = "paused"; // give user time to see cards played

const Sprite = function(x = 0, y = 0) {
  this.x = x;
  this.y = y;
};

Sprite.prototype.draw = function(ctx) { };

Sprite.prototype.hitTest = function(x, y) {
  return false;
};

export const CardSprite = function(card, x = 0, y = 0) {
  Sprite.call(this, x, y);
  this.card = card;
};

CardSprite.prototype = Object.create(Sprite.prototype);
CardSprite.prototype.constructor = CardSprite;

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

export const getSelectedCard = function(game, x, y) {
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

CardSprite.prototype.draw = function(ctx) {
  // draw card centered on sprites coordinates
  const adjY = this.y + (CARD_HEIGHT / 2);
  drawReverse(ctx, this.x, adjY, 0);
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

export const draw = function(ctx, scoreDisplay, state) {
  drawBackground(ctx);

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

export const shouldPause = function(game) {
  return isStartOfTrick(game) && !isStartOfGame(game);
};

export const ScoreDisplay = function(containingDiv) {
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

export const animateDeal = function(ctx) {
  drawBackground(ctx);

  // NESW order
  const targets = [
    { x: CANVAS_WIDTH / 2,          y: -CARD_HEIGHT },
    { x: CANVAS_WIDTH + CARD_WIDTH, y: CANVAS_HEIGHT / 2 },
    { x: CANVAS_WIDTH / 2,          y: CANVAS_HEIGHT + CARD_HEIGHT },
    { x: -CARD_WIDTH,               y: CANVAS_HEIGHT / 2 },
  ];

  const speed = 2000; // pixels per second

  // create sprites
  const sprites = [];
  for (var i = 0; i < 52; i++) {
    sprites.push(new CardSprite(null, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2));
    sprites[i].target = targets[i % 4];
    sprites[i].animating = true;
    sprites[i].delay = (52 - i) * 0.07; // seconds
  };

  // for every card,
  // move card up/down/left/right off screen

  const draw = function(ctx, state) {
    drawBackground(ctx);
    for (var sprite of state.sprites) {
      sprite.draw(ctx);
    };
  };

  const update = function(state, delta) {
    for (var sprite of state.sprites) {
      const xDiff = sprite.target.x - sprite.x;
      const yDiff = sprite.target.y - sprite.y;

      const displacement = speed * delta;

      if (sprite.delay > 0) {
        sprite.delay -= delta;
        continue;
      }

      if (xDiff != 0) {
        if (Math.abs(xDiff) <= displacement) {
          sprite.x = sprite.target.x;
          sprite.animating = false;
        } else {
          sprite.x = sprite.x + Math.sign(xDiff) * displacement;
        }
      }

      if (yDiff != 0) {
        if (Math.abs(yDiff) <= displacement) {
          sprite.y = sprite.target.y;
          sprite.animating = false;
        } else {
          sprite.y = sprite.y + Math.sign(yDiff) * displacement;
        }
      };
    }

    state.animating = sprites.some(sprite => sprite.animating);
  };

  const run = function(state, previousTime, currentTime) {
    const delta = (currentTime - previousTime) / 1000; // seconds
    update(state, delta);
    draw(ctx, state);

    if (state.animating) {
      requestAnimationFrame(futureTime => run(state, currentTime, futureTime));
    } else {
      console.log("done");
    };
  };

  const now = performance.now();
  run({animating: true, sprites}, now, now);
};
