// src/pages/LandingPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

const LOADING_MESSAGES = [
  "Loading question banks…",
  "Summoning bosses…",
  "Preparing your curriculum…",
  "Almost ready…",
];

export default function LandingPage() {
  const navigate = useNavigate();

  const [logoShow,   setLogoShow]   = useState(false);
  const [brandShow,  setBrandShow]  = useState(false);
  const [loaderShow, setLoaderShow] = useState(false);
  const [skipShow,   setSkipShow]   = useState(false);
  const [loadPct,    setLoadPct]    = useState(0);
  const [loadMsg,    setLoadMsg]    = useState(LOADING_MESSAGES[0]);

  const goToSignIn = useCallback(() => navigate("/signin"), [navigate]);

  useEffect(() => {
    const timers = [];
    const t = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); };

    // 0.3s — Logo appears
    t(() => setLogoShow(true), 300);
    // 1.0s — Brand name fades in
    t(() => setBrandShow(true), 1000);
    // 1.6s — Loading bar + skip appear
    t(() => { setLoaderShow(true); setSkipShow(true); }, 1600);

    // Bar fills over ~4.5 seconds (25% steps)
    t(() => { setLoadPct(25);  setLoadMsg(LOADING_MESSAGES[0]); }, 1900);
    t(() => { setLoadPct(50);  setLoadMsg(LOADING_MESSAGES[1]); }, 3100);
    t(() => { setLoadPct(75);  setLoadMsg(LOADING_MESSAGES[2]); }, 4300);
    t(() => { setLoadPct(100); setLoadMsg(LOADING_MESSAGES[3]); }, 5400);

    // 6.2s — Navigate to sign in
    t(goToSignIn, 6200);

    return () => timers.forEach(clearTimeout);
  }, [goToSignIn]);

  return (
    <div className="lp-container">

      {/* Ambient background orbs */}
      <div className="lp-orb lp-orb-1" />
      <div className="lp-orb lp-orb-2" />
      <div className="lp-orb lp-orb-3" />

      {/* Logo + brand + loader */}
      <div className={`lp-logo-wrap ${logoShow ? "lp-logo--show" : ""}`}>

        <div className="lp-m-mark">
          <span>T</span>
        </div>

        <div className={`lp-brand ${brandShow ? "lp-brand--show" : ""}`}>
          <span className="lp-brand-tuko">Tuko</span>
          <span className="lp-brand-zone">Zone</span>
        </div>

        <p className={`lp-tagline ${brandShow ? "lp-tagline--show" : ""}`}>
          Level up your medical journey
        </p>

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