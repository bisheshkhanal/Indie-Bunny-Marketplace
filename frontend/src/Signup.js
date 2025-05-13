import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import { useNavigate } from "react-router-dom";
import "./Login.css"; // shared auth styles
import API_BASE_URL from "./apiConfig";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCred.user;

      await fetch(`${API_BASE_URL}/api/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: firebaseUser.email.split("@")[0],
          email: firebaseUser.email,
          password: password,
          role: "Player",
        }),
      });

      window.location.href = "/games";
      
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Left side bunny + welcome */}
        <div className="auth-logo-section">
          <img src="/bunny.png" alt="Bunny Logo Small" className="top-logo" />
          <div className="bunny-welcome">
            <img src="/mainbunny.png" alt="Main Bunny" />
            <h1 className="animated-title">Welcome to Indie Bunny</h1>
            <p>Create your account and hop into the fun 🐇✨</p>
          </div>
        </div>

        {/* Right side form */}
        <div className="auth-form-section">
          <h2>Sign Up</h2>
          <form onSubmit={handleSignup}>
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
            <button type="submit">Sign Up</button>
          </form>
          <div className="auth-footer">
            Already have an account? <a href="/login">Login</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;