import React from "react";
import { useNavigate } from "react-router-dom";

function ClassicChallenge() {
  const navigate = useNavigate();

  return (
    <div style={{ 
      padding: "40px", 
      textAlign: "center",
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{
        background: "white",
        borderRadius: "32px",
        padding: "48px",
        maxWidth: "500px",
        margin: "0 auto",
        boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
      }}>
        <div style={{ fontSize: "64px", marginBottom: "20px" }}>🏆</div>
        <h1 style={{ color: "#ff7f50", marginBottom: "16px", fontSize: "28px" }}>Classic Challenge</h1>
        <p style={{ color: "#666", marginBottom: "32px", lineHeight: "1.5" }}>
          Get ready for timed challenges! Test your speed and accuracy.
        </p>
        <p style={{ color: "#999", marginBottom: "32px", fontSize: "14px" }}>
          Coming soon! Stay tuned for exciting updates.
        </p>
        <button 
          onClick={() => navigate("/games-dashboard")}
          style={{
            padding: "12px 32px",
            background: "#ff7f50",
            color: "white",
            border: "none",
            borderRadius: "40px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            transition: "transform 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          Back to Games
        </button>
      </div>
    </div>
  );
}

export default ClassicChallenge;
