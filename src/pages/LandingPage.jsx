// src/pages/LandingPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

// Loading messages shown during the bar fill
const LOADING_MESSAGES = [
  "Loading question banks…",
  "Summoning bosses…",
  "Preparing your curriculum…",
  "Almost ready…",
];

export default function LandingPage() {
  const navigate = useNavigate();

  // Animation stages
  const [ecgDone,      setEcgDone]      = useState(false);  // ECG fades out
  const [logoShow,     setLogoShow]     = useState(false);  // M logo appears
  const [brandShow,    setBrandShow]    = useState(false);  // MedBlitz text
  const [loaderShow,   setLoaderShow]   = useState(false);  // loading bar
  const [skipShow,     setSkipShow]     = useState(false);  // skip button
  const [loadPct,      setLoadPct]      = useState(0);      // bar fill 0-100
  const [loadMsg,      setLoadMsg]      = useState(LOADING_MESSAGES[0]);

  const goToSignIn = useCallback(() => navigate("/signin"), [navigate]);

  useEffect(() => {
    const timers = [];
    const t = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); };

    // 0.0s — ECG starts drawing (CSS animation handles it)
    // 2.4s — ECG fades, logo appears
    t(() => { setEcgDone(true); setLogoShow(true); }, 2400);
    // 3.0s — Brand name fades in
    t(() => setBrandShow(true), 3000);
    // 3.4s — Loading bar + skip appear
    t(() => { setLoaderShow(true); setSkipShow(true); }, 3400);

    // Loading bar increments: 0→25→50→75→100 over ~3 seconds
    t(() => { setLoadPct(25);  setLoadMsg(LOADING_MESSAGES[0]); }, 3600);
    t(() => { setLoadPct(50);  setLoadMsg(LOADING_MESSAGES[1]); }, 4400);
    t(() => { setLoadPct(75);  setLoadMsg(LOADING_MESSAGES[2]); }, 5200);
    t(() => { setLoadPct(100); setLoadMsg(LOADING_MESSAGES[3]); }, 5900);

    // 6.4s — Navigate to sign in
    t(goToSignIn, 6400);

    return () => timers.forEach(clearTimeout);
  }, [goToSignIn]);

  return (
    <div className="lp-container">

      {/* Ambient background orbs */}
      <div className="lp-orb lp-orb-1" />
      <div className="lp-orb lp-orb-2" />
      <div className="lp-orb lp-orb-3" />

      {/* ECG heartbeat wave */}
      <div className={`lp-ecg-wrap ${ecgDone ? "lp-ecg--hide" : ""}`}>
        <svg className="lp-ecg-svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path
            className="lp-ecg-path"
            d="M0,60 L80,60 L100,30 L120,90 L140,60
               L240,60 L260,40 L280,80 L300,60
               L420,60 L440,10 L460,110 L480,60
               L580,60 L600,40 L620,80 L640,60
               L760,60 L780,30 L800,90 L820,60
               L920,60 L940,45 L960,75 L980,60
               L1100,60 L1120,20 L1140,100 L1160,60 L1200,60"
          />
        </svg>
      </div>

      {/* Logo + brand + loader */}
      <div className={`lp-logo-wrap ${logoShow ? "lp-logo--show" : ""}`}>
        <div className="lp-m-mark">
          <span>M</span>
        </div>

        <div className={`lp-brand ${brandShow ? "lp-brand--show" : ""}`}>
          <span className="lp-brand-med">Med</span>
          <span className="lp-brand-blitz">Blitz</span>
        </div>

        <p className={`lp-tagline ${brandShow ? "lp-tagline--show" : ""}`}>
          Your medical quiz companion
        </p>

        {/* Loading bar */}
        <div className={`lp-loader-wrap ${loaderShow ? "lp-loader--show" : ""}`}>
          <div className="lp-loader-track">
            <div className="lp-loader-fill" style={{ width: `${loadPct}%` }} />
          </div>
          <p className="lp-loader-text">{loadMsg}</p>
        </div>
      </div>

      {/* Skip button */}
      <div className={`lp-skip ${skipShow ? "lp-skip--show" : ""}`}>
        <button onClick={goToSignIn}>Skip intro</button>
      </div>

    </div>
  );
}