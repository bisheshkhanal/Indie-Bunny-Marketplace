import React, { useState } from 'react';
import { auth } from './firebase';
import API_BASE_URL from './apiConfig';
import { useNavigate } from 'react-router-dom';
import './MysteryReward.css';

function MysteryTip() {
  const [amount, setAmount] = useState(5);
  const [gameOptions, setGameOptions] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const fetchMysteryGames = async () => {
    try {
      setIsLoading(true);
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/mystery-pick/?amount=${amount}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      setGameOptions(data);
      setMessage('Pick one of the mystery games!');
    } catch (err) {
      console.error("Failed to fetch mystery games:", err);
      setMessage("Error fetching games. Try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const claimGame = async (gameId) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/mystery-claim/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ game_id: gameId, tip_amount: amount })
      });

      if (!res.ok) throw new Error("Failed to claim game");

      const claimed = gameOptions.find(g => g.id === gameId);
      setSelectedGame(claimed);
      navigate('/reward', { state: { claimedGame: claimed } });
    } catch (err) {
      console.error("Claim failed:", err);
      setMessage("Failed to claim game. Try again.");
    }
  };

  return (
    <div className="mystery-reward">
      <h2>🎁 Mystery Tip Reward</h2>
      <p>Tip an amount and receive a random game from the mystery pool!</p>

      {!selectedGame ? (
        <>
          <div className="tip-selector">
            <label>Tip Amount ($)</label>
            <input
              type="number"
              value={amount}
              min="1"
              step="0.01"
              onChange={(e) => setAmount(Number(e.target.value))}
            />
            <button onClick={fetchMysteryGames} disabled={isLoading}>
              {isLoading ? "Loading..." : "Reveal Mystery Games"}
            </button>
          </div>

          {gameOptions.length > 0 && (
            <div className="game-options">
              <h3>Choose one:</h3>
              <ul>
                {gameOptions.map(game => (
                  <li key={game.id}>
                    <strong>{game.title}</strong> (${game.price})
                    <button onClick={() => claimGame(game.id)}>Pick This</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <div className="reward-selected">
          <h3>You got:</h3>
          <p><strong>{selectedGame.title}</strong> (${selectedGame.price})</p>
          <p className="success-msg">This game has been added to your collection!</p>
        </div>
      )}

      {message && <p className="message-box">{message}</p>}
    </div>
  );
}

export default MysteryTip;