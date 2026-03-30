// src/pages/LandingPage.jsx — uses the "M" logo mark as the hero on the landing screen
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

export default function LandingPage() {
  const navigate = useNavigate();
  const [showLogo, setShowLogo] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showSecondWave, setShowSecondWave] = useState(false);

  useEffect(() => {
    // Stage 1: ECG wave animation (3 seconds)
    const waveTimer = setTimeout(() => {
      setShowLogo(true);
    }, 3000);

    // Stage 2: Logo stays, text fades in
    const logoDisplayTimer = setTimeout(() => {
      setShowText(true);
    }, 9000);

    // Stage 3: Exit wave
    const secondWaveTimer = setTimeout(() => {
      setShowSecondWave(true);
    }, 13000);

    // Stage 4: Navigate to signin
    const navigateTimer = setTimeout(() => {
      navigate("/signin");
    }, 15000);

    return () => {
      clearTimeout(waveTimer);
      clearTimeout(logoDisplayTimer);
      clearTimeout(secondWaveTimer);
      clearTimeout(navigateTimer);
    };
  }, [navigate]);

  return (
    <div className="landing-container">
      {/* First ECG Wave Animation */}
      <div className={`ecg-container ${showLogo ? "wave-finished" : ""}`}>
        <svg className="ecg-wave first-wave" viewBox="0 0 1200 200" preserveAspectRatio="none">
          <path className="ecg-path" d="M0,100 L50,100 L70,50 L90,150 L110,100 L150,100 L170,80 L190,120 L210,100 L300,100 L320,60 L340,140 L360,100 L450,100 L470,80 L490,120 L510,100 L600,100 L620,70 L640,130 L660,100 L750,100 L770,90 L790,110 L810,100 L900,100 L920,80 L940,120 L960,100 L1050,100 L1070,50 L1090,150 L1110,100 L1200,100" />
        </svg>
      </div>

      {/* Second ECG Wave Animation (exit wave) */}
      <div className={`ecg-container exit-wave ${showSecondWave ? "wave-active" : ""}`}>
        <svg className="ecg-wave second-wave" viewBox="0 0 1200 200" preserveAspectRatio="none">
          <path className="ecg-path exit-path" d="M0,100 L50,100 L70,50 L90,150 L110,100 L150,100 L170,80 L190,120 L210,100 L300,100 L320,60 L340,140 L360,100 L450,100 L470,80 L490,120 L510,100 L600,100 L620,70 L640,130 L660,100 L750,100 L770,90 L790,110 L810,100 L900,100 L920,80 L940,120 L960,100 L1050,100 L1070,50 L1090,150 L1110,100 L1200,100" />
        </svg>
      </div>

      {/* M Logo mark + brand name */}
      <div className={`logo-wrapper ${showLogo ? "logo-enter" : ""}`}>
        {/* The "M" mark — styled exactly like the sidebar logo mark, but bigger */}
        <div className="landing-m-mark">
          <span>M</span>
        </div>

        <div className={`logo-text ${showText ? "text-enter" : ""}`}>
          <span className="med-text">Med</span>
          <span className="blitz-text">Blitz</span>
        </div>
      </div>
    </div>
  );
}
