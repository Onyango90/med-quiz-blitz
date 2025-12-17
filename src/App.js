// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages
import LandingPage from "./pages/LandingPage"; // ✅ NEW
import HomeDashboard from "./pages/HomeDashboard";
import StudyDashboard from "./pages/StudyDashboard";
import GamesMode from "./pages/GamesMode";
import Battle from "./pages/Battle";
import Leaderboard from "./pages/Leaderboard";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import ClassicChallenge from "./pages/ClassicChallenge";

// Study Mode (questions page)
import StudyMode from "./components/StudyMode";

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing */}
        <Route path="/" element={<LandingPage />} /> {/* ✅ CHANGED */}

        {/* Home */}
        <Route path="/home" element={<HomeDashboard />} /> {/* ✅ NEW */}

        {/* Study dashboards */}
        <Route path="/study-dashboard" element={<StudyDashboard />} />
        <Route path="/study/:topic" element={<StudyMode />} />

        {/* Games */}
        <Route path="/games-dashboard" element={<GamesMode />} />
        <Route path="/classic-challenge" element={<ClassicChallenge />} />

        {/* Other pages */}
        <Route path="/battle" element={<Battle />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}

export default App;
