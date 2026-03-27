import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Import anatomy categories
import grossAnatomy from "../data/questions/gross_anatomy.json";
import histology from "../data/questions/histology.json";
import embryology from "../data/questions/embryology.json";

// Import other subjects
import pathologyQuestions from "../data/questions/pathology.json";
import pharmacologyQuestions, { antibiotics, cardiovascular as pharmaCardio, cns, endocrine as pharmaEndocrine } from "../data/questions/pharmacology/index.js";

// Optional click sound
let clickSound;
try {
  clickSound = new Audio(require("../sound/click.wav"));
} catch (e) {
  console.warn("Click sound file not found, skipping sound.");
  clickSound = null;
}

// Define anatomy subcategories with REAL counts
const anatomySubcategories = [
  { 
    name: "Gross Anatomy", 
    path: "/study/gross_anatomy", 
    icon: "🦴", 
    description: "Macroscopic structures",
    count: grossAnatomy?.length || 0,
    questions: grossAnatomy
  },
  { 
    name: "Histology", 
    path: "/study/histology", 
    icon: "🔬", 
    description: "Microscopic structures",
    count: histology?.length || 0,
    questions: histology
  },
  { 
    name: "Embryology", 
    path: "/study/embryology", 
    icon: "👶", 
    description: "Development",
    count: embryology?.length || 0,
    questions: embryology
  }
];

// Define pharmacology subcategories
const pharmacologySubcategories = [
  { 
    name: "All Pharmacology", 
    path: "/study/pharmacology", 
    icon: "💊", 
    description: "All pharmacology topics",
    count: pharmacologyQuestions?.length || 0,
    questions: pharmacologyQuestions
  },
  { 
    name: "Antibiotics", 
    path: "/study/antibiotics", 
    icon: "🧪", 
    description: "Antibacterial drugs",
    count: antibiotics?.length || 12,
    questions: antibiotics
  },
  { 
    name: "Cardiovascular", 
    path: "/study/cardiovascular", 
    icon: "❤️", 
    description: "Heart drugs & BP meds",
    count: pharmaCardio?.length || 6,
    questions: pharmaCardio
  },
  { 
    name: "CNS Drugs", 
    path: "/study/cns", 
    icon: "🧠", 
    description: "Brain & nervous system drugs",
    count: cns?.length || 5,
    questions: cns
  },
  { 
    name: "Endocrine", 
    path: "/study/endocrine", 
    icon: "⚕️", 
    description: "Hormones & diabetes drugs",
    count: pharmaEndocrine?.length || 3,
    questions: pharmaEndocrine
  },
];

// Main topics with their subcategories
const topics = [
  { 
    name: "Anatomy", 
    path: "/study/anatomy", 
    color: "#ff9f80", 
    icon: "🦴", 
    description: "Learn body structures",
    count: (grossAnatomy?.length || 0) + (histology?.length || 0) + (embryology?.length || 0),
    hasSubcategories: true,
    subcategories: anatomySubcategories
  },
  { 
    name: "Pathology", 
    path: "/study/pathology", 
    color: "#f4d35e", 
    icon: "🧫", 
    description: "Disease processes",
    count: pathologyQuestions?.length || 0,
    hasSubcategories: false
  },
  { 
    name: "Physiology", 
    path: "/study/physiology", 
    color: "#80ced6", 
    icon: "💓", 
    description: "Body functions",
    count: 5,
    hasSubcategories: false
  },
  { 
    name: "Microbiology", 
    path: "/study/microbiology", 
    color: "#ff6f61", 
    icon: "🦠", 
    description: "Microbes and infections",
    count: 5,
    hasSubcategories: false
  },
  { 
    name: "Pharmacology", 
    path: "/study/pharmacology", 
    color: "#6a4c93", 
    icon: "💊", 
    description: "Drugs and mechanisms",
    count: pharmacologyQuestions?.length || 0,
    hasSubcategories: true,
    subcategories: pharmacologySubcategories
  },
  { 
    name: "Clinical Skills", 
    path: "/study/clinical-skills", 
    color: "#2a9d8f", 
    icon: "🩺", 
    description: "Practical medical skills",
    count: 5,
    hasSubcategories: false
  },
];

function StudyDashboard() {
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState(null);

  const handleClick = (path, questions = null) => {
    if (clickSound) clickSound.play();
    
    if (questions) {
      navigate(path, { state: { questions, originalPath: path } });
    } else {
      navigate(path, { state: { originalPath: path } });
    }
  };

  const toggleDropdown = (topicName) => {
    if (openDropdown === topicName) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(topicName);
    }
  };

  return (
    <div style={{ padding: "30px" }}>
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>LET'S MAKE STUDYING FUN!</h1>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center" }}>
        {topics.map((topic) => (
          <div key={topic.name} style={{ position: "relative" }}>
            <div
              onClick={() => topic.hasSubcategories ? toggleDropdown(topic.name) : handleClick(topic.path)}
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
                border: openDropdown === topic.name ? "3px solid white" : "none",
              }}
            >
              <div style={{ fontSize: "40px", marginBottom: "10px" }}>{topic.icon}</div>
              <h3 style={{ margin: "5px 0" }}>{topic.name}</h3>
              <p style={{ fontSize: "12px", lineHeight: "1.2" }}>{topic.description}</p>
              <div style={{
                position: "absolute",
                bottom: "10px",
                right: "10px",
                fontSize: "12px",
                background: "rgba(255,255,255,0.3)",
                padding: "2px 6px",
                borderRadius: "8px",
              }}>
                {topic.count} Qs
              </div>
              {topic.hasSubcategories && (
                <div style={{
                  position: "absolute",
                  bottom: "10px",
                  left: "10px",
                  fontSize: "12px",
                  background: "rgba(0,0,0,0.3)",
                  padding: "2px 6px",
                  borderRadius: "8px",
                }}>
                  ▼ {openDropdown === topic.name ? 'Close' : 'Topics'}
                </div>
              )}
            </div>

            {openDropdown === topic.name && topic.hasSubcategories && (
              <div style={{
                position: "absolute",
                top: "190px",
                left: "0",
                width: "180px",
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
                zIndex: 1000,
                overflow: "hidden",
              }}>
                {topic.subcategories.map((sub, index) => (
                  <div
                    key={sub.name}
                    onClick={() => handleClick(sub.path, sub.questions)}
                    style={{
                      padding: "12px",
                      cursor: "pointer",
                      background: index % 2 === 0 ? "#f8f9fa" : "white",
                      borderBottom: index < topic.subcategories.length - 1 ? "1px solid #eee" : "none",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "20px" }}>{sub.icon}</div>
                    <div style={{ fontWeight: "bold", fontSize: "14px", color: "#333" }}>{sub.name}</div>
                    <div style={{ fontSize: "10px", color: "#666" }}>{sub.count} questions</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default StudyDashboard;