// src/pages/Settings.js — redesigned to match HomeDashboard
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAuth, signOut } from "firebase/auth";
import "./Settings.css";

export default function Settings() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");

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
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const handleExportData = () => {
    const uid = currentUser?.uid;
    const exportData = {
      user: currentUser?.email,
      exportDate: new Date().toISOString(),
      stats: JSON.parse(localStorage.getItem(`medblitz_stats_${uid}`) || "null"),
      dailyChallenge: JSON.parse(localStorage.getItem("dailyChallenge") || "null"),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `medblitz_export_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    alert("✅ Your data has been exported!");
  };

  const handleResetProgress = () => {
    if (window.confirm("Are you sure? This will delete ALL your progress and cannot be undone.")) {
      const uid = currentUser?.uid;
      localStorage.removeItem(`medblitz_stats_${uid}`);
      localStorage.removeItem("dailyChallenge");
      alert("✅ Progress has been reset. Refresh to see changes.");
      window.location.reload();
    }
  };

  const userName = currentUser?.displayName || currentUser?.email?.split("@")[0] || "User";

  return (
    <div className="settings-page">
      <div className="settings-inner">

        {/* ─ Header ─ */}
        <div className="st-page-header">
          <h1 className="st-page-title">⚙️ Settings</h1>
          <button className="st-back-btn" onClick={() => navigate("/home")}>
            ← Dashboard
          </button>
        </div>

        {/* ─ User card ─ */}
        <div className="st-user-card">
          <div className="st-user-card-bg">
            <div className="st-user-orb st-orb-1" />
            <div className="st-user-orb st-orb-2" />
          </div>
          <div className="st-user-avatar">👨‍⚕️</div>
          <div className="st-user-info">
            <span className="st-user-name">{userName}</span>
            <span className="st-user-email">{currentUser?.email}</span>
          </div>
        </div>

        {/* ─ Account ─ */}
        <div className="st-section">
          <div className="st-section-header">
            <span className="st-section-title">Account</span>
          </div>
          <div className="st-row">
            <div className="st-row-left">
              <div className="st-row-icon st-row-icon--teal">✉️</div>
              <span className="st-row-label">Email</span>
            </div>
            <span className="st-row-value">{currentUser?.email}</span>
          </div>
          <div className="st-row">
            <div className="st-row-left">
              <div className="st-row-icon st-row-icon--teal">👤</div>
              <span className="st-row-label">Username</span>
            </div>
            <span className="st-row-value">{currentUser?.displayName || "Not set"}</span>
          </div>
        </div>

        {/* ─ Preferences ─ */}
        <div className="st-section">
          <div className="st-section-header">
            <span className="st-section-title">Preferences</span>
          </div>
          <div className="st-row">
            <div className="st-row-left">
              <div className="st-row-icon st-row-icon--amber">🔊</div>
              <span className="st-row-label">Sound Effects</span>
            </div>
            <label className="st-toggle">
              <input type="checkbox" checked={soundEnabled} onChange={(e) => setSoundEnabled(e.target.checked)} />
              <span className="st-toggle-slider" />
            </label>
          </div>
          <div className="st-row">
            <div className="st-row-left">
              <div className="st-row-icon st-row-icon--amber">🌙</div>
              <span className="st-row-label">Dark Mode</span>
            </div>
            <label className="st-toggle">
              <input type="checkbox" checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />
              <span className="st-toggle-slider" />
            </label>
          </div>
        </div>

        {/* ─ Data ─ */}
        <div className="st-section">
          <div className="st-section-header">
            <span className="st-section-title">Data</span>
          </div>
          <div className="st-action-row">
            <button className="st-btn st-btn--export" onClick={handleExportData}>
              <span>📥</span> Export My Stats
            </button>
          </div>
          <div className="st-action-row">
            <button className="st-btn st-btn--reset" onClick={handleResetProgress}>
              <span>🔄</span> Reset Progress
            </button>
          </div>
        </div>

        {/* ─ About ─ */}
        <div className="st-section">
          <div className="st-section-header">
            <span className="st-section-title">About</span>
          </div>
          <div className="st-row">
            <div className="st-row-left">
              <div className="st-row-icon st-row-icon--teal">ℹ️</div>
              <span className="st-row-label">Version</span>
            </div>
            <span className="st-row-value">1.0.0 MVP</span>
          </div>
          <div className="st-row">
            <div className="st-row-left">
              <div className="st-row-icon st-row-icon--coral">❤️</div>
              <span className="st-row-label">Made for Med Students</span>
            </div>
          </div>
        </div>

        {/* ─ Sign out ─ */}
        <div className="st-section">
          <div className="st-section-header">
            <span className="st-section-title">Session</span>
          </div>
          <div className="st-action-row">
            {!showConfirm ? (
              <button className="st-btn--signout" onClick={() => setShowConfirm(true)}>
                Sign Out
              </button>
            ) : (
              <div className="st-confirm">
                <p>Are you sure you want to sign out?</p>
                <div className="st-confirm-btns">
                  <button onClick={handleSignOut}>Yes, Sign Out</button>
                  <button onClick={() => setShowConfirm(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}