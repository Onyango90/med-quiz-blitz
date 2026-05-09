// src/components/ThemeToggle.jsx
// Drop this anywhere — sidebar, topbar, settings page, etc.

import React from "react";
import { useTheme } from "../context/ThemeContext";
import "./ThemeToggle.css";

export default function ThemeToggle({ size = "md" }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      className={`tt-btn tt-${size} ${isDark ? "tt-dark" : "tt-light"}`}
      onClick={toggleTheme}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle theme"
    >
      <div className="tt-track">
        <div className="tt-thumb">
          <span className="tt-icon">{isDark ? "🌙" : "☀️"}</span>
        </div>
      </div>
      <span className="tt-label">{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}