// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";

// Pages
import LandingPage from "./pages/LandingPage";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import HomeDashboard from "./pages/HomeDashboard";
import StudyDashboard from "./pages/StudyDashboard";
import GamesMode from "./pages/GamesMode";
import Battle from "./pages/Battle";
import Leaderboard from "./pages/Leaderboard";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import ClassicChallenge from "./pages/ClassicChallenge";
import EndPage from "./pages/EndPage"; // ✅ Added EndPage import
import ReviewPage from "./pages/ReviewPage"; // ✅ Added ReviewPage import

// Study Mode (questions page)
import StudyMode from "./components/StudyMode";

// Quiz Component
import Quiz from "./game/Quiz";

// ✅ Wrapper to pass questions from navigation state to Quiz
function QuizWrapper() {
  const location = useLocation();
  const navigate = useNavigate();
  const questions = location.state?.questions || [];

  const handleFinish = (score) => {
    // alert removed to prevent pop-up
    navigate("/end"); // Quiz.jsx already passes the results to EndPage
  };

  if (questions.length === 0) return <p>No questions available!</p>;

  return <Quiz questions={questions} onFinish={handleFinish} />;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing */}
        <Route path="/" element={<LandingPage />} />

        {/* Sign In */}
        <Route path="/signin" element={<SignIn />} />

        {/* Sign Up */}
        <Route path="/signup" element={<SignUp />} />

        {/* Home */}
        <Route path="/home" element={<HomeDashboard />} />

        {/* Study dashboards */}
        <Route path="/study-dashboard" element={<StudyDashboard />} />
        <Route path="/study/:topic" element={<StudyMode />} />

        {/* Games */}
        <Route path="/games-dashboard" element={<GamesMode />} />
        <Route path="/classic-challenge" element={<ClassicChallenge />} />

        {/* Quiz route */}
        <Route path="/quiz" element={<QuizWrapper />} />

        {/* End Page */}
        <Route path="/end" element={<EndPage />} />  {/* ✅ EndPage route */}

        {/* Review Page */}
        <Route path="/review" element={<ReviewPage />} />  {/* ✅ ReviewPage route */}

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
