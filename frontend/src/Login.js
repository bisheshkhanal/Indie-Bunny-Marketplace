import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "/games";
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Left: Bunny visuals */}
        <div className="auth-logo-section">
          <img src="/bunny.png" alt="Bunny Logo Small" className="top-logo" />
          <div className="bunny-welcome">
            <img src="/mainbunny.png" alt="Main Bunny" />
            <h1 className="animated-title">Welcome to Indie Bunny</h1>
            <p>Your cozy home for indie game adventures 🕹️✨</p>
          </div>
        </div>

        {/* Right: Login Form */}
        <div className="auth-form-section">
          <h2>Login</h2>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Login</button>
          </form>
          <div className="auth-footer">
            Don’t have an account? <a href="/signup">Sign Up</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;