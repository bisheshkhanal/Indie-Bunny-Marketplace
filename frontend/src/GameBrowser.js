// frontend/src/GameBrowser.js

import React, { useState, useEffect, useCallback } from 'react';
import './GameBrowser.css';
import { Link } from 'react-router-dom';
import API_BASE_URL from './apiConfig';
import { auth } from './firebase';

const GameBrowser = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genreFilter, setGenreFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [listingType, setListingType] = useState('all');
  const [multiplier, setMultiplier] = useState(1.0);

  const fetchListings = useCallback(async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      const params = new URLSearchParams();
      if (genreFilter) params.append("genre", genreFilter);
      if (searchQuery) params.append("query", searchQuery);

      const res = await fetch(`${API_BASE_URL}/api/all-game-listings/?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      const filtered = data.filter(g => {
        if (listingType === 'temporary') return g.is_temporary;
        if (listingType === 'regular') return !g.is_temporary;
        return true;
      });

      setListings(filtered);
    } catch (err) {
      console.error('Failed to fetch game listings:', err);
    } finally {
      setLoading(false);
    }
  }, [genreFilter, searchQuery, listingType]);

  const fetchMultiplier = useCallback(async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/country-multiplier/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMultiplier(data.multiplier);
    } catch (err) {
      console.error('Failed to fetch country multiplier:', err);
      setMultiplier(1.0); // fallback
    }
  }, []);

  useEffect(() => {
    fetchMultiplier();
    fetchListings();
  }, [fetchMultiplier, fetchListings]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchListings();
  };

  return (
    <div className="itchio-browser">
      <header className="store-header">
        <div className="header-content">
          <h1>INDIE BUNNY</h1>
          <div className="header-nav">
            <nav>
              <button className="active" onClick={(e) => e.preventDefault()}>Games</button>
            </nav>
            <form onSubmit={handleSearch} className="search-bar">
              <input
                type="text"
                placeholder="Search games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit">Search</button>
            </form>
            <select
              className="genre-filter"
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
            >
              <option value="">All Genres</option>
              <option value="action">Action</option>
              <option value="adventure">Adventure</option>
              <option value="puzzle">Puzzle</option>
              <option value="rpg">RPG</option>
              <option value="simulation">Simulation</option>
              <option value="strategy">Strategy</option>
            </select>
            <select
              className="genre-filter"
              value={listingType}
              onChange={(e) => setListingType(e.target.value)}
            >
              <option value="all">All Listings</option>
              <option value="regular">Regular Only</option>
              <option value="temporary">Temporary Only</option>
            </select>
          </div>
        </div>
      </header>

      <main className="store-container">
        <section className="games-section">
          <div className="section-header">
            <h2>DISCOVER INDIE GAMES</h2>
          </div>

          {loading ? <p>Loading games...</p> : (
            <div className="games-grid">
              {listings.map((game) => (
                <Link to={`/games/${game.listing_id}`} key={game.listing_id} className="game-card">
                  <div className="game-image-container">
                    <img 
                      src={game.image_url || '/placeholder-game.png'} 
                      alt={game.game_title} 
                      className="game-image" 
                    />
                  </div>
                  <div className="game-details">
                    <h3>
                      {game.game_title}
                      {game.is_temporary && <span className="badge-temp"> ⏳</span>}
                    </h3>
                    <p className="developer">By {game.developer}</p>
                    <div className="price-tag">${(game.price * multiplier).toFixed(2)}</div>
                    <div className="game-tags">
                      <span>{game.genre}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default GameBrowser;
