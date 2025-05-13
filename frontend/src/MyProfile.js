// frontend/src/MyProfile.js

import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL from "./apiConfig";
import { auth } from "./firebase";

function MyProfile() {
  const [profile, setProfile] = useState({ name: "", email: "", role: "", wallet_balance: 0, country: "" });
  const [newPassword, setNewPassword] = useState("");
  const [newWalletBalance, setNewWalletBalance] = useState("");
  const [newCountry, setNewCountry] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await auth.currentUser.getIdToken();
        const profileRes = await axios.get(`${API_BASE_URL}/api/me/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(profileRes.data);
        setNewWalletBalance(profileRes.data.wallet_balance);
        setNewCountry(profileRes.data.country || "");
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    };

    fetchProfile();
  }, []);

  const handlePasswordChange = async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      await axios.put(
        `${API_BASE_URL}/api/myprofile/update-password/`,
        { password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Password updated.");
      setNewPassword("");
    } catch {
      alert("Failed to update password.");
    }
  };

  const handleWalletUpdate = async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      await axios.put(
        `${API_BASE_URL}/api/myprofile/update-wallet/`,
        { wallet_balance: newWalletBalance },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Wallet balance updated.");
    } catch {
      alert("Failed to update wallet balance.");
    }
  };

  const handleCountryUpdate = async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      await axios.put(
        `${API_BASE_URL}/api/myprofile/update-country/`,
        { country: newCountry },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Country updated.");
    } catch {
      alert("Failed to update country.");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>My Profile</h2>
      <p><strong>Name:</strong> {profile.name}</p>
      <p><strong>Email:</strong> {profile.email}</p>
      <p><strong>Role:</strong> {profile.role}</p>
      <p><strong>Wallet Balance:</strong> ${parseFloat(profile.wallet_balance || 0).toFixed(2)}</p>
      <p><strong>Country:</strong> {profile.country || "Not set"}</p>

      <div style={{ marginTop: "1.5rem" }}>
        <label htmlFor="newPassword">Change Password:</label>
        <input
          type="password"
          id="newPassword"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          style={{ marginLeft: "1rem" }}
        />
        <button onClick={handlePasswordChange} style={{ marginLeft: "1rem" }}>
          Update Password
        </button>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <label htmlFor="newWalletBalance">Change Wallet Balance:</label>
        <input
          type="number"
          id="newWalletBalance"
          value={newWalletBalance}
          onChange={(e) => setNewWalletBalance(e.target.value)}
          style={{ marginLeft: "1rem" }}
        />
        <button onClick={handleWalletUpdate} style={{ marginLeft: "1rem" }}>
          Update Wallet
        </button>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <label htmlFor="newCountry">Change Country:</label>
        <select
          id="newCountry"
          value={newCountry}
          onChange={(e) => setNewCountry(e.target.value)}
          style={{ marginLeft: "1rem" }}
        >
          <option value="">-- Select Country --</option>
          <option value="United States">United States</option>
          <option value="United Kingdom">United Kingdom</option>
          <option value="Australia">Australia</option>
          <option value="Germany">Germany</option>
          <option value="France">France</option>
          <option value="Japan">Japan</option>
          <option value="South Korea">South Korea</option>
          <option value="Brazil">Brazil</option>
          <option value="India">India</option>
          <option value="Mexico">Mexico</option>
          <option value="Russia">Russia</option>
          <option value="Italy">Italy</option>
          <option value="Spain">Spain</option>
          <option value="Canada">Canada</option>
          <option value="China">China</option>
          <option value="Netherlands">Netherlands</option>
          <option value="Sweden">Sweden</option>
          <option value="Switzerland">Switzerland</option>
          <option value="Norway">Norway</option>
          <option value="Turkey">Turkey</option>
        </select>
        <button onClick={handleCountryUpdate} style={{ marginLeft: "1rem" }}>
          Update Country
        </button>
      </div>
    </div>
  );
}

export default MyProfile;
