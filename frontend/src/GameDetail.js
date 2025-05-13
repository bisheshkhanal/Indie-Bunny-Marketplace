// frontend/src/GameDetail.js

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API_BASE_URL from './apiConfig';
import { auth } from './firebase';
import './GameDetail.css';

const GameDetail = () => {
  const { listingId } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [multiplier, setMultiplier] = useState(1.0);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch(`${API_BASE_URL}/api/listings/${listingId}/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setListing(data);
      } catch (err) {
        console.error('Failed to fetch listing:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchMultiplier = async () => {
      try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch(`${API_BASE_URL}/api/country-multiplier/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setMultiplier(data.multiplier);
      } catch (err) {
        console.error('Failed to fetch multiplier:', err);
        setMultiplier(1.0);
      }
    };

    fetchMultiplier();
    fetchListing();
  }, [listingId]);

  const handleBuy = async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/purchase-game/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ listing_id: listingId, use_wallet: true })
      });
      if (res.ok) {
        setActionMsg('Purchase successful!');
      } else {
        const errData = await res.json();
        setActionMsg(`Error: ${errData.error || 'Purchase failed'}`);
      }
    } catch (err) {
      console.error('Purchase error:', err);
      setActionMsg('Error during purchase');
    }
  };

  const handleWishlist = async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/wishlist/add/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ listing_id: listingId })
      });
      if (res.ok) {
        setActionMsg('Added to wishlist!');
      } else {
        const errData = await res.json();
        setActionMsg(`Error: ${errData.error || 'Could not add to wishlist'}`);
      }
    } catch (err) {
      console.error('Wishlist error:', err);
      setActionMsg('Error adding to wishlist');
    }
  };

  if (loading) return <div className="game-detail">Loading...</div>;
  if (!listing) return <div className="game-detail">Listing not found.</div>;

  return (
    <div className="game-detail">
      <div className="game-hero">
        <img src={listing.image_url || '/placeholder-game.png'} alt={listing.game_title} />
        <div className="hero-info">
          <h1>{listing.game_title}</h1>
          <p>By {listing.developer}</p>
          <p className="genre">{listing.genre}</p>
          <p className="price">${(listing.price * multiplier).toFixed(2)}</p>

          {listing.is_temporary && (
            <p className="time-limit">
              ⏳ Available from {new Date(listing.start_time).toLocaleString()} to {new Date(listing.end_time).toLocaleString()}
            </p>
          )}

          <div className="actions">
            <button className="buy" onClick={handleBuy}>Buy Now</button>
            <button className="wishlist" onClick={handleWishlist}>Add to Wishlist</button>
          </div>
          {actionMsg && <p className="action-msg">{actionMsg}</p>}
        </div>
      </div>
    </div>
  );
};

export default GameDetail;
