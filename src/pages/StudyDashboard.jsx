import React from "react";
import { useNavigate } from "react-router-dom";

// Optional click sound
let clickSound;
try {
  clickSound = new Audio(require("../sound/click.mp3"));
} catch (e) {
  console.warn("Click sound file not found, skipping sound.");
  clickSound = null;
}

// Define topic cards
const topics = [
  { name: "Anatomy", path: "/study/anatomy", color: "#ff9f80", icon: "🦴", description: "Learn body structures" },
  { name: "Pathology", path: "/study/pathology", color: "#f4d35e", icon: "🧫", description: "Disease processes" },
  { name: "Physiology", path: "/study/physiology", color: "#80ced6", icon: "💓", description: "Body functions" },
  { name: "Microbiology", path: "/study/microbiology", color: "#ff6f61", icon: "🦠", description: "Microbes and infections" },
  { name: "Pharmacology", path: "/study/pharmacology", color: "#6a4c93", icon: "💊", description: "Drugs and mechanisms" },
  { name: "Clinical Skills", path: "/study/clinical-skills", color: "#2a9d8f", icon: "🩺", description: "Practical medical skills" },
];

function StudyDashboard() {
  const navigate = useNavigate();

  const handleClick = (path) => {
    if (clickSound) clickSound.play();
    navigate(path); // use React Router navigation
  };

  return (
    <div style={{ padding: "30px" }}>
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>LET'S MAKE STUDYING FUN!</h1>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center" }}>
        {topics.map((topic) => (
          <div
            key={topic.name}
            onClick={() => handleClick(topic.path)}
            style={{
              cursor: "pointer",
              width: "180px",
              height: "180px",
              background: topic.color,
              borderRadius: "16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 15px rgba(0,0,0,0.25)",
              transition: "all 0.3s ease",
              position: "relative",
              color: "#fff",
              textAlign: "center",
              padding: "15px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-10px) scale(1.05)";
              e.currentTarget.style.boxShadow = "0 12px 25px rgba(0,0,0,0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow = "0 6px 15px rgba(0,0,0,0.25)";
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>{topic.icon}</div>
            <h3 style={{ margin: "5px 0" }}>{topic.name}</h3>
            <p style={{ fontSize: "12px", lineHeight: "1.2" }}>{topic.description}</p>
            <div
              style={{
                position: "absolute",
                bottom: "10px",
                right: "10px",
                fontSize: "12px",
                background: "rgba(255,255,255,0.3)",
                padding: "2px 6px",
                borderRadius: "8px",
              }}
            >
              5 Qs
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StudyDashboard;
