import {
  randomDeck,
  Card,
  TWO_CLUBS,
  Rank,
  HEARTS,
  QUEEN_SPADES,
} from "./card.js";

export const NORTH = "north";
export const EAST = "east";
export const SOUTH = "south";
export const WEST = "west";
export const PLAYERS = [NORTH, EAST, SOUTH, WEST];

const makeHands = function(deck) {
  const hands = [];
  const handSize = deck.length / 4;
  for (let i = 0; i < 4; i++) {
    let hand = deck.splice(0, handSize);
    hand.sort(Card.compare);
    hands.push(hand);
  }

  return hands;
};

export const newGame = function(deck = randomDeck()) {
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

export const currentHand = function(game) {
  return game.hands[PLAYERS.indexOf(game.turn)];
};

export const previousTrick = function(game) {
  return game.tricks[game.tricks.length - 1];
};

const isStartOfGame = function(game) {
  return game.tricks.length === 0 && game.currentTrick.length === 0;
};

const isStartOfTrick = function(game) {
  return game.currentTrick.length === 0;
};

export const heartsBroken = function(game) {
  let previousPlays = game.currentTrick.concat(game.tricks.flat());
  let previousCards = previousPlays.map(play => play.card);
  let firstHeart = previousCards.find(card => card.suit === HEARTS);

  return firstHeart != undefined;
};

export const playableCards = function(game) {
  if (isStartOfGame(game)) {
    return [TWO_CLUBS];
  }

  if (isStartOfTrick(game) && !heartsBroken(game)) {
    const notHearts = currentHand(game).filter(card => card.suit != HEARTS);

    // can we play something other than hearts?
    // TODO: make this work for any point card, not just hearts
    if (notHearts.length > 0) {
      // yes, can play anything except hearts
      return notHearts;
    } else {
      // no, can play anything
      return currentHand(game).slice(0);
    }
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

export const canPlay = function(game, selected) {
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

export const isOver = function(game) {
  return game.hands.every(hand => hand.length === 0);
};

const trickWinner = function(trick) {
  const leadingSuit = trick[0].card.suit;
  let winningPlayIx = 0;

  for (let i = 1; i < 4; i++) {
    let nextCard = trick[i].card;

    let followedSuit = leadingSuit === nextCard.suit;
    let higherRanked =
      Rank.compare(trick[winningPlayIx].card.rank, nextCard.rank) < 0;

    if (followedSuit && higherRanked) {
      winningPlayIx = i;
    }
  }

  return trick[winningPlayIx].player;
};

export const score = function(game) {
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

export const winners = function(game) {
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

// TODO: bad moves are ignored
// don't care whose turn
export const play = function(game, selected) {

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
