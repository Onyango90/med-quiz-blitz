// src/hooks/useWellbeingCheckin.js
// Privacy-first well-being check-in.
// Responses live ONLY in this browser's localStorage. They are never sent to
// Firebase, analytics, or any admin view, and nothing here labels or diagnoses.
import { useState, useCallback } from "react";

const KEY = "tz_checkin_log_v1";
const DAY = 24 * 60 * 60 * 1000;

const read = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
};
const write = (log) => { try { localStorage.setItem(KEY, JSON.stringify(log.slice(-20))); } catch { /* storage unavailable: fine */ } };

export function useWellbeingCheckin() {
  const [log, setLog] = useState(read);
  const [current, setCurrent] = useState(null);

  const record = useCallback((mood) => {
    const next = [...read(), { mood, t: Date.now() }];
    write(next); setLog(next); setCurrent(mood);
  }, []);
  const clear = useCallback(() => {
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    setLog([]); setCurrent(null);
  }, []);

  // "Persistent" = 3+ tougher check-ins in the last 14 days (on this device).
  const persistent =
    log.filter((e) => (e.mood === "struggling" || e.mood === "really") && Date.now() - e.t < 14 * DAY).length >= 3;

  return { current, record, clear, persistent, hasHistory: log.length > 0 };
}