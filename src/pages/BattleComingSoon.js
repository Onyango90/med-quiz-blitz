import React from "react";
import { useNavigate } from "react-router-dom";
import "./BattleComingSoon.css";

function BattleComingSoon() {
  const navigate = useNavigate();

  return (
    <div className="battle-coming-soon">
      <div className="battle-container">
        <div className="battle-glow"></div>
        
        <div className="battle-icon">⚔️</div>
        
        <h1>Battle Mode</h1>
        <p className="coming-soon-badge">Coming Soon</p>
        
        <div className="battle-description">
          <p>Challenge your friends in real-time medical quizzes!</p>
          <p>Test your knowledge against classmates and climb the ranks.</p>
        </div>
        
        <div className="feature-list">
          <div className="feature">
            <span>🎮</span>
            <span>Real-time 1v1 battles</span>
          </div>
          <div className="feature">
            <span>🏆</span>
            <span>Weekly tournaments</span>
          </div>
          <div className="feature">
            <span>📊</span>
            <span>Battle rankings & ELO system</span>
          </div>
          <div className="feature">
            <span>💪</span>
            <span>Challenge friends with a link</span>
          </div>
        </div>
        
        <div className="progress-container">
          <div className="progress-label">
            <span>Development Progress</span>
            <span>80%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: "80%" }}></div>
          </div>
          <p className="progress-note">Launching soon!</p>
        </div>
        
        <div className="notify-section">
          <p>Want to be the first to know when Battle Mode launches?</p>
          <button 
            className="notify-btn"
            onClick={() => alert("📧 We'll notify you when Battle Mode is ready!")}
          >
            Get Notified
          </button>
        </div>
        
        <button 
          className="back-btn"
          onClick={() => navigate("/home")}
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default BattleComingSoon;