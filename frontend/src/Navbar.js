// NavBar.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "./firebase";

function Navbar({ user }) {
  const navigate = useNavigate();

  if (!user) return null;

  const role = user.role;

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/login");
    } catch (err) {
      alert("Logout failed: " + err.message);
    }
  };

  const linkStyle = {
    color: "white",
    textDecoration: "none",
    fontWeight: "500",
  };

  return (
    <nav className="navbar" style={styles.nav}>
      <Link to="/" style={{ ...styles.logo, ...linkStyle }}>
        <img src="/mainbunny.png" alt="Indie Bunny Logo" style={styles.logoImage} />
      </Link>

      <ul style={styles.navList}>
        <li><Link to="/games" style={linkStyle}>Games</Link></li>
        <li><Link to="/wishlist" style={linkStyle}>Wishlist</Link></li>
        <li><Link to="/notifications" style={linkStyle}>Notifications</Link></li>
        <li><Link to="/reward" style={linkStyle}>Mystery Reward</Link></li>
        <li><Link to="/assets" style={linkStyle}>Assets</Link></li>
        <li><Link to="/books" style={linkStyle}>Books</Link></li>
        <li><Link to="/soundtracks" style={linkStyle}>Soundtracks</Link></li>
        <li><Link to="/mystery-tip" style={linkStyle}>Mystery Tip</Link></li>
        <li><Link to="/myprofile" style={linkStyle}>My Profile</Link></li>

        {role === "Player" && (
          <>
            <li><Link to="/developer-dashboard" style={linkStyle}>Upload Game</Link></li>
          </>
        )}

        {role === "Developer" && (
          <>
            <li><Link to="/developer-dashboard" style={linkStyle}>Dashboard</Link></li>
          </>
        )}
        {role === "Admin" && (
          <>
            <li><Link to="/debug" style={linkStyle}>Debug Dashboard</Link></li>
            <li><Link to="/admin/approvals" style={linkStyle}>Approvals</Link></li>
            <li><Link to="/admin/users" style={linkStyle}>Manage Users</Link></li>
          </>
        )}
        <li>
          <button onClick={handleLogout} style={{ ...styles.logout, ...linkStyle }}>
            Logout
          </button>
        </li>
      </ul>
    </nav>
  );
}

const styles = {
  nav: {
    background: "#1a1625",
    padding: "1rem 2rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "white",
    borderBottom: "2px solid #8c41e9",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    textDecoration: "none",
  },
  logoImage: {
    height: "32px",
    marginRight: "0.6rem",
    verticalAlign: "middle",
  },
  logoText: {
    fontWeight: "bold",
    fontSize: "1.3rem",
    verticalAlign: "middle",
  },
  navList: {
    display: "flex",
    gap: "1.5rem",
    listStyle: "none",
    alignItems: "center",
    margin: 0,
    padding: 0,
  },
  logout: {
    background: "#8c41e9",
    padding: "0.4rem 0.9rem",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
  },
};

export default Navbar;