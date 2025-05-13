// ManageUsers.js
import React, { useEffect, useState } from 'react';
import { auth } from './firebase';
import API_BASE_URL from './apiConfig';
import './DeveloperDashboard.css';

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchManagedUsers = async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/managed-users/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to load users");

      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagedUsers();
  }, []);

  const handleKick = async (userId) => {
    if (!window.confirm("Are you sure you want to kick this user?")) return;

    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/admin/delete-user/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: userId })
      });

      if (!res.ok) throw new Error("Failed to delete user");

      alert("User kicked.");
      setUsers(prev => prev.filter(u => u.user_id !== userId));
    } catch (err) {
      alert("Error kicking user: " + err.message);
    }
  };

  if (loading) return <div className="loading">Loading managed users...</div>;

  return (
    <div className="developer-dashboard">
      <h2>👥 Manage Assigned Users</h2>
      {users.length === 0 ? (
        <p>No users assigned to you yet.</p>
      ) : (
        <ul className="games-list">
          {users.map((user) => (
            <li key={user.user_id} className="game-item">
              <strong>{user.name}</strong> — {user.email} ({user.role})
              <button onClick={() => handleKick(user.user_id)} className="delete-btn">
                Kick User
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ManageUsers;
