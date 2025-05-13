import React, { useEffect, useState } from 'react';
import { auth } from './firebase';
import API_BASE_URL from './apiConfig';
import './Notifications.css';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/notifications/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id) => {
    try {
      const token = await auth.currentUser.getIdToken();
      await fetch(`${API_BASE_URL}/api/notifications/mark-read/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const clearAll = async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      await fetch(`${API_BASE_URL}/api/notifications/clear/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications([]);
    } catch (err) {
      console.error("Error clearing notifications:", err);
    }
  };

  if (loading) return <div className="loading">Loading notifications...</div>;

  return (
    <div className="notifications">
      <div className="notifications-header">
        <h2>🔔 Your Notifications</h2>
        <div className="notif-controls">
          <button className="clear-btn" onClick={fetchNotifications}>🔁 Refresh</button>
          {notifications.length > 0 && (
            <button className="clear-btn" onClick={clearAll}>🗑️ Clear All</button>
          )}
        </div>
      </div>

      {notifications.length > 0 ? (
        <div className="notifications-list">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`notification ${notif.read ? 'read' : 'unread'}`}
              onClick={() => {
                markAsRead(notif.id);
                if (notif.target_url) window.location.href = notif.target_url;
              }}
            >
              <div className="notification-content">
                <p>{notif.message}</p>
                <small>{new Date(notif.timestamp).toLocaleString()}</small>
              </div>
              {!notif.read && <div className="unread-dot" />}
            </div>
          ))}
        </div>
      ) : (
        <div className="no-notifications">
          <img src="/no-alert.png" alt="No notifications" />
          <p>No notifications yet. We’ll update you here.</p>
        </div>
      )}
    </div>
  );
}

export default Notifications;