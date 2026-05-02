// Trigger redeploy: whitespace/encoding issue fixed 2026-03-31
// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Pages
import LandingPage from "./pages/LandingPage";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import HomeDashboard from "./pages/HomeDashboard";
import StudyDashboard from "./pages/StudyDashboard";
import GamesMode from "./pages/GamesMode";
import BattleComingSoon from "./pages/BattleComingSoon";
import Leaderboard from "./pages/Leaderboard";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import ClassicChallenge from "./pages/ClassicChallenge";
import EndPage from "./pages/EndPage";
import ReviewPage from "./pages/ReviewPage";
import DailyChallenge from "./pages/DailyChallenge";
import DailyQuiz from "./pages/DailyQuiz";
import AIQuiz from "./pages/AIQuiz";
import PastPaperImporter from "./pages/PastPaperImporter";
import BossBattle from "./pages/BossBattle";
import DiagnoseGame from "./pages/DiagnoseGame";
import WardRound from "./pages/WardRound";
import StudentPDFQuiz from "./pages/StudentPDFQuiz";
import AdminDashboard from "./pages/AdminDashboard";

// Study Mode (questions page)
import StudyMode from "./components/StudyMode";
import SubcategoryStudyMode from "./components/SubcategoryStudyMode";

// Quiz Component
import Quiz from "./game/Quiz";

// Wrapper to pass questions from navigation state to Quiz
function QuizWrapper() {
  const location = useLocation();
  const navigate = useNavigate();
  const questions = location.state?.questions || [];

  const handleFinish = (score) => {
    navigate("/end");
  };

  if (questions.length === 0) return <p>No questions available!</p>;

  return <Quiz questions={questions} onFinish={handleFinish} />;
}

function App() {
  return (
    <AuthProvider>
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
          
          {/* Main topic route */}
          <Route path="/study/:topic" element={<StudyMode />} />
          
          {/* Subcategory route */}
          <Route path="/study/:topic/:subcategory" element={<SubcategoryStudyMode />} />

          {/* Games */}
          <Route path="/games-dashboard" element={<GamesMode />} />
          <Route path="/classic-challenge" element={<ClassicChallenge />} />

          {/* Daily Challenge */}
          <Route path="/daily-challenge" element={<DailyChallenge />} />
          <Route path="/daily-quiz" element={<DailyQuiz />} />

          {/* AI Quiz */}
          <Route path="/ai-quiz" element={<AIQuiz />} />

          {/* Import Questions (admin only — protected inside component) */}
          <Route path="/import-questions" element={<PastPaperImporter />} />

          {/* Quiz route */}
          <Route path="/quiz" element={<QuizWrapper />} />

          {/* End Page */}
          <Route path="/end" element={<EndPage />} />

          {/* Review Page */}
          <Route path="/review" element={<ReviewPage />} />

          {/* Other pages */}
          <Route path="/battle" element={<BattleComingSoon />} />
          <Route path="/boss-battle" element={<BossBattle />} />
          <Route path="/ward-round" element={<WardRound />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/settings" element={<Settings />} />

          {/* Diagnose in 3 Clues */}
          <Route path="/diagnose-game" element={<DiagnoseGame />} />

          {/* Study PDF Quiz */}
          <Route path="/study-pdf-quiz" element={<StudentPDFQuiz />} />

          {/* Admin — restricted to admin emails only */}
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;