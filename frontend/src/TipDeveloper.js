// TipDeveloper.js
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { auth } from "./firebase";
import API_BASE_URL from "./apiConfig";
import "./TipDeveloper.css";

function TipDeveloper() {
  const { developerId } = useParams();
  const [developer, setDeveloper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(5);
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [tipSent, setTipSent] = useState(false);

  useEffect(() => {
    const fetchDeveloper = async () => {
      try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch(`${API_BASE_URL}/api/developers/${developerId}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch developer details");

        const data = await res.json();
        setDeveloper(data);
      } catch (err) {
        console.error("Error fetching developer:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeveloper();
  }, [developerId]);

  const handleTipSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/tip-developer/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          developerId,
          amount,
          message,
          isAnonymous,
        }),
      });

      if (!res.ok) throw new Error("Failed to send tip");

      setTipSent(true);
    } catch (err) {
      console.error("Error sending tip:", err);
    }
  };

  if (loading) return <div className="loading">Loading developer info...</div>;
  if (!developer) return <div className="error">Developer not found</div>;

  if (tipSent) {
    return (
      <div className="tip-success">
        <h2>🎉 Thank You!</h2>
        <p>Your tip has been sent to <strong>{developer.name}</strong>.</p>
        <a href="/reward" className="btn view-reward-btn">View Mystery Reward</a>
      </div>
    );
  }

  return (
    <div className="tip-developer">
      <h2>Tip {developer.name}</h2>
      <p>Support this developer and get a mystery reward 🎁</p>

      <form className="tip-form" onSubmit={handleTipSubmit}>
        <div className="amount-selector">
          <label>Choose an amount:</label>
          <div className="amount-options">
            {[5, 10, 20, 50].map((val) => (
              <button
                type="button"
                key={val}
                className={`amount-btn ${amount === val ? "selected" : ""}`}
                onClick={() => setAmount(val)}
              >
                ${val}
              </button>
            ))}
            <input
              type="number"
              className="custom-amount"
              value={amount}
              min="1"
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="Custom"
            />
          </div>
        </div>

        <div className="message-field">
          <label>Message (optional):</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Leave a message of support..."
          />
        </div>

        <div className="anonymous-option">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
          />
          <label>Send tip anonymously</label>
        </div>

        <button type="submit" className="submit-tip-btn btn primary">Send Tip</button>
      </form>

      <p className="tip-note">Every tip helps fund future game development!</p>
    </div>
  );
}

export default TipDeveloper;