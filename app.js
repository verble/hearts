import {
  Card,
  randomDeck,
  TWO_CLUBS,
  QUEEN_SPADES,
  HEARTS,
} from "./card.js";
import {
  newGame,
  NORTH,
  EAST,
  SOUTH,
  WEST,
  PLAYERS,
  isOver,
  canPlay,
  play,
  playableCards,
  previousTrick,
  score,
  winners,
} from "./game.js";
import {
  ScoreDisplay,
  draw,
  NORMAL,
  PAUSED,
  getSelectedCard,
  shouldPause,
  animateDeal,
} from "./ui.js";
import { pick } from "./util.js";

// reducer actions
export const PLAY = "play";
export const AI_MOVE = "ai_move";
export const CONTINUE = "continue";
export const NEW_GAME = "new_game";

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

export const newState = function(game = newGame(), uiState = NORMAL) {
  return { game, uiState };
};

export const computerTurn = function(state) {
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

// converts a canvas click into the correct action
const actionFromClick = function(x, y, state) {
  const card = getSelectedCard(state.game, x, y);
  if (card != null) {
    return { type: PLAY, card };
  } else if (state.uiState === PAUSED) {
    return { type: CONTINUE };
  } else if (state.game.turn != SOUTH && !isOver(state.game)) {
    return { type: AI_MOVE };
  } else {
    // no op
    return null;
  }
}

export const advance = function(state, action) {

  // PLAY card = play selected card, do nothing if invalid move
  // AI_MOVE = play card chosen by ai
  // CONTINUE = clear paused interface
  // NEW_GAME = start new game

  switch (action.type) {
  case PLAY:
    return (() => {
      const updatedGame = play(state.game, action.card);
      if (updatedGame === state.game) {
        // invalid move, do nothing
        return state;
      }
      return {
        ...state,
        game: updatedGame,
        uiState: shouldPause(updatedGame) ? PAUSED : NORMAL,
      };
    })();
    return play(state, card);
  case AI_MOVE:
    return (() => {
      // play a random, valid card
      const card = pick(playableCards(state.game));
      const updatedGame = play(state.game, card);
      return {
        ...state,
        game: updatedGame,
        uiState: shouldPause(updatedGame) ? PAUSED : NORMAL,
      };
    })();
  case CONTINUE:
    return {
      ...state,
      uiState: NORMAL,
    };
  case NEW_GAME:
    return newState();
  default:
    console.log("Unrecognized action:", action);
    return state;
  }
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

    const action = actionFromClick(x, y, app.state);
    if (action != null) {
      app.advance(action);
    }
  });

  display.buttonHandler = event => {
    app.advance({ type: NEW_GAME });
  };

  // initial draw
  // app.draw();

  animateDeal(ctx);
});
