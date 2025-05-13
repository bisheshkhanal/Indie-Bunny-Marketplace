// DeveloperDashboard.js
import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import API_BASE_URL from './apiConfig';
import './DeveloperDashboard.css';

function DeveloperDashboard() {
  const [approvedGames, setApprovedGames] = useState([]);
  const [pendingGames, setPendingGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newGame, setNewGame] = useState({
    title: '',
    description: '',
    price: 0,
    genre: 'action',
    min_tip_required: 0,
    is_temporary: false,
    start_time: '',
    end_time: ''
  });
  const [showForm, setShowForm] = useState(false);

  const fetchGames = async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      const [approvedRes, pendingRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/developer/games/`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/developer/pending/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const approvedData = await approvedRes.json();
      const pendingData = await pendingRes.json();

      setApprovedGames(approvedData);
      setPendingGames(pendingData);
    } catch (error) {
      console.error("Error fetching games:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewGame(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/upload_game/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newGame.title,
          description: newGame.description,
          genre: newGame.genre,
          price: parseFloat(newGame.price),
          min_tip_required: parseFloat(newGame.min_tip_required || 0),
          region_adjustment: 'Global',
          is_temporary: newGame.is_temporary,
          start_time: newGame.start_time,
          end_time: newGame.end_time
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      alert('Game uploaded successfully. Pending approval.');
      setNewGame({
        title: '',
        description: '',
        price: 0,
        genre: 'action',
        min_tip_required: 0,
        is_temporary: false,
        start_time: '',
        end_time: ''
      });
      setShowForm(false);
      fetchGames();
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed.');
    }
  };

  if (loading) return <div className="loading">Loading your dashboard...</div>;

  return (
    <div className="developer-dashboard">
      <h2>Developer Dashboard</h2>

      <button className="add-game-btn" onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancel' : 'Add New Game'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="game-form">
          <div className="form-group">
            <label>Game Title</label>
            <input type="text" name="title" value={newGame.title} onChange={handleInputChange} required />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={newGame.description} onChange={handleInputChange} rows="4" required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Price ($)</label>
              <input type="number" name="price" value={newGame.price} onChange={handleInputChange} min="0" step="0.01" required />
            </div>

            <div className="form-group">
              <label>Genre</label>
              <select name="genre" value={newGame.genre} onChange={handleInputChange}>
                <option value="action">Action</option>
                <option value="adventure">Adventure</option>
                <option value="puzzle">Puzzle</option>
                <option value="rpg">RPG</option>
                <option value="simulation">Simulation</option>
                <option value="strategy">Strategy</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Min Tip Required ($)</label>
            <input type="number" name="min_tip_required" value={newGame.min_tip_required} onChange={handleInputChange} min="0" step="0.01" required />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="is_temporary"
                checked={newGame.is_temporary}
                onChange={handleInputChange}
              /> Temporary Listing
            </label>
          </div>

          {newGame.is_temporary && (
            <>
              <div className="form-group">
                <label>Start Time</label>
                <input
                  type="datetime-local"
                  name="start_time"
                  value={newGame.start_time}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>End Time</label>
                <input
                  type="datetime-local"
                  name="end_time"
                  value={newGame.end_time}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </>
          )}

          <button type="submit" className="submit-btn">Upload Game</button>
        </form>
      )}

      <section className="your-games">
        <h3>✅ Approved Listings</h3>
        {approvedGames.length ? (
          <ul className="games-list">
            {approvedGames.map(game => (
              <li key={game.listing_id} className="game-item">
                <strong>{game.game_title}</strong> — ${game.price}
              </li>
            ))}
          </ul>
        ) : (
          <p>No approved games yet.</p>
        )}
      </section>

      <section className="your-games">
        <h3>⏳ Pending Uploads</h3>
        {pendingGames.length ? (
          <ul className="games-list">
            {pendingGames.map(game => (
              <li key={game.id} className="game-item">
                <strong>{game.title}</strong> — ${game.price}
              </li>
            ))}
          </ul>
        ) : (
          <p>No pending games right now.</p>
        )}
      </section>
    </div>
  );
}

export default DeveloperDashboard;
