import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "./firebase";
import Navbar from "./Navbar";
import API_BASE_URL from "./apiConfig";

// Import pages
import Login from "./Login";
import Signup from "./Signup";
import DebugDashboard from "./DebugDashboard";
import Home from "./Home";
import GameBrowser from "./GameBrowser";
import GameDetail from "./GameDetail";
import DeveloperDashboard from "./DeveloperDashboard";
import TipDeveloper from "./TipDeveloper";
import MysteryReward from "./MysteryReward";
import Wishlist from "./Wishlist";
import Notifications from "./Notifications";
import Unauthorized from "./Unauthorized";
import AdminApproval from "./AdminApproval";
import MysteryTip from './MysteryTip';
import MyProfile from "./MyProfile"; 
import ManageUsers from "./ManageUsers";

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const location = useLocation();

  const hideNavbar = location.pathname === "/login" || location.pathname === "/signup";

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        const res = await fetch(`${API_BASE_URL}/api/me/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const userData = await res.json();
          setUser({ ...firebaseUser, role: userData.role });
        }
      }
      setAuthLoading(false);
    });

    return () => unsub();
  }, []);

  const hasRole = (roles) => {
    if (!user || !user.role) return false;
    return roles.includes(user.role);
  };

  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading authentication...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {!hideNavbar && <Navbar user={user} />}

      <Routes>
        {/* Public */}
        <Route path="/" element={user ? <Navigate to="/games" /> : <Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Authenticated */}
        <Route path="/games" element={user ? <GameBrowser /> : <Navigate to="/login" />} />
        <Route path="/games/:listingId" element={user ? <GameDetail /> : <Navigate to="/login" />} />
        <Route path="/tip/:developerId" element={user ? <TipDeveloper /> : <Navigate to="/login" />} />
        <Route path="/reward" element={user ? <MysteryReward /> : <Navigate to="/login" />} />
        <Route path="/wishlist" element={user ? <Wishlist /> : <Navigate to="/login" />} />
        <Route path="/notifications" element={user ? <Notifications /> : <Navigate to="/login" />} />
        <Route path="/mystery-tip" element={user ? <MysteryTip /> : <Navigate to="/login" />} />
        <Route path="/MyProfile" element={user ? <MyProfile /> : <Navigate to="/login" />} />

        {/* Developer */}
        <Route
          path="/developer-dashboard"
          element={
            user ? (
              hasRole(["Developer", "Admin", "Player"]) ? (
                <DeveloperDashboard />
              ) : (
                <Navigate to="/unauthorized" />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Admin */}
        <Route
          path="/debug"
          element={
            user ? (
              hasRole(["Admin"]) ? (
                <DebugDashboard />
              ) : (
                <Navigate to="/unauthorized" />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/admin/approvals"
          element={
            user ? (
              hasRole(["Admin"]) ? (
                <AdminApproval />
              ) : (
                <Navigate to="/unauthorized" />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/admin/users"
          element={
            user ? (
              hasRole(["Admin"]) ? (
                <ManageUsers />
              ) : (
                <Navigate to="/unauthorized" />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Error Page */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<Navigate to={user ? "/games" : "/"} />} />
      </Routes>
    </div>
  );
}

export default App;
