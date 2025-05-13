// Home.js
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentGameIndex, setCurrentGameIndex] = useState(0);

  const featuredGames = [
    { name: "Pixel Adventure", creator: "Studio 8-bit", tipCount: 1243 },
    { name: "Neon Racer", creator: "RetroDev", tipCount: 876 },
    { name: "Cosmic Explorer", creator: "Stellar Games", tipCount: 1532 }
  ];

  useEffect(() => {
    setIsAnimating(true);
    const interval = setInterval(() => {
      setCurrentGameIndex((prev) => (prev + 1) % featuredGames.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="home-container">
      <div className="bg-particles">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              transform: `scale(${Math.random() * 0.5 + 0.5})`
            }}
          ></div>
        ))}
      </div>

      <div className={`hero-section ${isAnimating ? "animate" : ""}`}>
        <div className="hero-content">
          <div className="hero-text">
            <h1>
              <span className="text-gradient">Indie Bunny</span>
              <span className="sparkle">✨</span>
            </h1>
            <p className="tagline">
              Support indie game developers and discover{" "}
              <span className="highlight">hidden gems</span> through our unique
              tipping and mystery reward system!
            </p>

            <div className="cta-buttons">
              <Link to="/signup" className="btn primary pulse">
                Get Started <span className="arrow">→</span>
              </Link>
              <Link to="/games" className="btn secondary">
                Browse Games <span className="icon">🎮</span>
              </Link>
            </div>

            <div className="stats-container">
              <div className="stat">
                <div className="stat-number">1,200+</div>
                <div className="stat-label">Games Supported</div>
              </div>
              <div className="stat">
                <div className="stat-number">$85K+</div>
                <div className="stat-label">Tips Sent</div>
              </div>
              <div className="stat">
                <div className="stat-number">98%</div>
                <div className="stat-label">Happy Developers</div>
              </div>
            </div>
          </div>

          <div className="hero-image">
            <img src="/bunny.png" alt="Bunny mascot" className="bounce" />
            <div className="floating-icons">
              <span className="icon gamepad" aria-label="Gamepad">🎮</span>
              <span className="icon heart" aria-label="Heart">💖</span>
              <span className="icon coin" aria-label="Coin">🪙</span>
            </div>
          </div>
        </div>
      </div>

      <div className="featured-game">
        <h2>Recently Tipped</h2>
        <div className="game-card">
          <h3>{featuredGames[currentGameIndex].name}</h3>
          <p>by {featuredGames[currentGameIndex].creator}</p>
          <div className="tip-meter">
            <div
              className="tip-progress"
              style={{
                width: `${Math.min(
                  featuredGames[currentGameIndex].tipCount / 20,
                  100
                )}%`
              }}
            ></div>
            <span>{featuredGames[currentGameIndex].tipCount} tips</span>
          </div>
          <Link to="/reward" className="btn small view-reward-btn">
            Tip This Game
          </Link>
        </div>
      </div>

      <div className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Discover Games</h3>
            <p>Browse our curated collection of indie games across all genres.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Tip Creators</h3>
            <p>Support developers directly with any amount you choose.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Get Rewards</h3>
            <p>Receive mystery rewards based on your tip amount!</p>
          </div>
        </div>
      </div>

      <div className="testimonial">
        <blockquote>
          "Indie Bunny helped me connect with players who truly appreciate my work.
          The tips I've received have allowed me to focus full-time on my passion!"
        </blockquote>
        <div className="author">
          <img src="/stardust.png" alt="Game developer" />
          <span>Alex, Creator of 'Stardust Valley'</span>
        </div>
      </div>
    </div>
  );
}

export default Home;