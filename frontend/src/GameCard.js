// frontend/src/GameCard.js

import React from 'react';
import { Link } from 'react-router-dom';
import './GameCard.css';

function GameCard({ game, multiplier = 1.0 }) {
  return (
    <Link to={`/games/${game.id}`} className="game-card">
      <div className="game-thumbnail">
        <img src={game.imageUrl || '/placeholder-game.png'} alt={game.title} />
        {game.isMystery && <span className="mystery-badge">Mystery</span>}
      </div>
      <div className="game-info">
        <h3>{game.title}</h3>
        <p className="developer">{game.developer}</p>
        <div className="game-footer">
          <span className="price">${(game.price * multiplier).toFixed(2)}</span>
          <button className="wishlist-btn" aria-label="Add to Wishlist">♡</button>
        </div>
      </div>
    </Link>
  );
}

export default GameCard;
