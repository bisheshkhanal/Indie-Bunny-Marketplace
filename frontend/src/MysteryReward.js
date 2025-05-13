import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./MysteryReward.css";

function MysteryReward() {
  const location = useLocation();
  const navigate = useNavigate();
  const claimedGame = location.state?.claimedGame;

  if (!claimedGame) {
    return (
      <div className="mystery-reward">
        <h2>No reward found</h2>
        <p>Try tipping through the <button onClick={() => navigate('/mystery-tip')} className="link-btn">Mystery Tip</button> page.</p>
      </div>
    );
  }

  return (
    <div className="mystery-reward">
      <h2>🎉 Mystery Game Claimed!</h2>
      <div className="reward-selected">
        <h3>You received:</h3>
        <p><strong>{claimedGame.title}</strong> — ${claimedGame.price}</p>
        <div className="reward-actions">
          <button className="primary-btn" onClick={() => navigate('/games')}>Browse More Games</button>
          <button className="secondary-btn" onClick={() => navigate('/wishlist')}>View Wishlist</button>
        </div>
      </div>
    </div>
  );
}

export default MysteryReward;