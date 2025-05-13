// frontend/src/Wishlist.js

import React, { useState, useEffect } from 'react';
import { auth } from "./firebase";
import API_BASE_URL from "./apiConfig";
import GameCard from './GameCard';
import './Wishlist.css';
import { Link } from 'react-router-dom';

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [multiplier, setMultiplier] = useState(1.0);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const token = await auth.currentUser.getIdToken();
        const [wishlistRes, multiplierRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/wishlist/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/country-multiplier/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!wishlistRes.ok || !multiplierRes.ok) {
          throw new Error("Failed to fetch wishlist or multiplier");
        }

        const wishlistData = await wishlistRes.json();
        const multiplierData = await multiplierRes.json();
        setWishlist(wishlistData);
        setMultiplier(multiplierData.multiplier);
      } catch (err) {
        console.error("Error fetching wishlist:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  if (loading) return <div className="loading-screen">Loading your wishlist...</div>;

  return (
    <div className="wishlist-container">
      <div className="wishlist-header">
        <h2>🎮 Your Wishlist</h2>
        {wishlist.length > 0 && (
          <div className="wishlist-actions">
            <Link to="/games" className="primary-btn">Browse More Games</Link>
            <button className="secondary-btn" onClick={() => window.scrollTo(0, 0)}>
              Back to Top ↑
            </button>
          </div>
        )}
      </div>

      {wishlist.length > 0 ? (
        <div className="wishlist-grid">
          {wishlist.map(game => (
            <GameCard key={game.id} game={game} multiplier={multiplier} />
          ))}
        </div>
      ) : (
        <div className="empty-wishlist">
          <img src="/empty-box.png" alt="No wishlist" className="empty-illustration" />
          <p>Your wishlist is currently empty.</p>
          <Link to="/games" className="primary-btn">Discover Games</Link>
        </div>
      )}
    </div>
  );
}

export default Wishlist;
