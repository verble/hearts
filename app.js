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
} from "./ui.js";
import { pick } from "./util.js";

// reducer actions
export const NEW_GAME = "new_game";
export const RANDOM = "random";
export const CONTINUE = "continue";
export const PLAY = "play";

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

export const advance = function(state, action) {

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
