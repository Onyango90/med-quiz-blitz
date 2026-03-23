import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAuth, signOut } from "firebase/auth";
import "./Settings.css";

function Settings() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  // Apply dark mode to body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("darkMode", "true");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("darkMode", "false");
    }
  }, [darkMode]);

  const handleSignOut = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      localStorage.clear();
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleExportData = () => {
    const userId = currentUser?.uid;
    const stats = localStorage.getItem(`medblitz_stats_${userId}`);
    const daily = localStorage.getItem("dailyChallenge");
    
    const exportData = {
      user: currentUser?.email,
      exportDate: new Date().toISOString(),
      stats: stats ? JSON.parse(stats) : null,
      dailyChallenge: daily ? JSON.parse(daily) : null
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `medblitz_export_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    alert("✅ Your data has been exported!");
  };

  const handleResetProgress = () => {
    if (window.confirm("Are you sure? This will delete ALL your progress and cannot be undone.")) {
      const userId = currentUser?.uid;
      localStorage.removeItem(`medblitz_stats_${userId}`);
      localStorage.removeItem("dailyChallenge");
      alert("✅ Progress has been reset. Refresh to see changes.");
      window.location.reload();
    }
  };

  return (
    <div className={`settings-container ${darkMode ? "dark" : ""}`}>
      <div className="settings-card">
        <h1>⚙️ Settings</h1>
        
        {/* Account Section */}
        <div className="settings-section">
          <h2>Account</h2>
          <div className="setting-item">
            <span className="setting-label">Email</span>
            <span className="setting-value">{currentUser?.email}</span>
          </div>
          <div className="setting-item">
            <span className="setting-label">Username</span>
            <span className="setting-value">{currentUser?.displayName || "Not set"}</span>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="settings-section">
          <h2>Preferences</h2>
          <div className="setting-item">
            <span className="setting-label">🔊 Sound Effects</span>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <div className="setting-item">
            <span className="setting-label">🌙 Dark Mode</span>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* Data Section */}
        <div className="settings-section">
          <h2>Data</h2>
          <button className="settings-btn export-btn" onClick={handleExportData}>
            📥 Export My Stats
          </button>
          <button className="settings-btn reset-btn" onClick={handleResetProgress}>
            🔄 Reset Progress
          </button>
        </div>

        {/* About Section */}
        <div className="settings-section">
          <h2>About</h2>
          <div className="setting-item">
            <span className="setting-label">Version</span>
            <span className="setting-value">1.0.0 MVP</span>
          </div>
          <div className="setting-item">
            <span className="setting-label">Made with ❤️ for Med Students</span>
          </div>
        </div>

        {/* Sign Out */}
        {!showConfirm ? (
          <button className="signout-btn" onClick={() => setShowConfirm(true)}>
            Sign Out
          </button>
        ) : (
          <div className="confirm-box">
            <p>Are you sure you want to sign out?</p>
            <div className="confirm-buttons">
              <button onClick={handleSignOut}>Yes, Sign Out</button>
              <button onClick={() => setShowConfirm(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Back Button */}
        <button className="back-btn" onClick={() => navigate("/home")}>
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default Settings;