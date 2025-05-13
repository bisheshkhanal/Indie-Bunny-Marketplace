// AdminApproval.js
import React, { useEffect, useState } from 'react';
import { auth } from './firebase';
import API_BASE_URL from './apiConfig';
import './DeveloperDashboard.css';

function AdminApproval() {
  const [pendingListings, setPendingListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUnapprovedListings = async () => {
      try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch(`${API_BASE_URL}/api/admin/unapproved-listings/`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Failed to fetch listings");

        const data = await res.json();
        setPendingListings(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUnapprovedListings();
  }, []);

  const handleApprove = async (pendingId) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/approve-listing/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ pending_id: pendingId })
      });

      if (!res.ok) throw new Error("Approval failed");

      alert("Listing approved!");
      setPendingListings(prev => prev.filter(listing => listing.id !== pendingId));
    } catch (err) {
      alert("Error approving listing: " + err.message);
    }
  };

  const handleReject = async (pendingId) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/reject-listing/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ pending_id: pendingId })
      });

      if (!res.ok) throw new Error("Rejection failed");

      alert("Listing rejected.");
      setPendingListings(prev => prev.filter(listing => listing.id !== pendingId));
    } catch (err) {
      alert("Error rejecting listing: " + err.message);
    }
  };

  if (loading) return <div className="loading">Loading unapproved listings...</div>;
  if (error) return <p className="error">Error: {error}</p>;

  return (
    <div className="developer-dashboard">
      <h2>🛡️ Admin Panel: Approve Listings</h2>
      {pendingListings.length === 0 ? (
        <p>All listings are approved. 🎉</p>
      ) : (
        <ul className="games-list">
          {pendingListings.map(listing => (
            <li key={listing.id} className="game-item">
              <div className="game-info">
                <strong>{listing.title}</strong> — ${listing.price} ({listing.genre})
              </div>
              <div className="approval-buttons">
                <button onClick={() => handleApprove(listing.id)} className="approve-btn">
                  ✅ Approve
                </button>
                <button onClick={() => handleReject(listing.id)} className="reject-btn">
                  ❌ Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AdminApproval;