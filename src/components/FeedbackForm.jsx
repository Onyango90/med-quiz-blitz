// src/components/FeedbackForm.jsx
// Triggered from HomeDashboard via a visible floating button.
// Saves responses to Firestore: collection("feedback")
import React, { useState } from "react";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import "./FeedbackForm.css";

// ── Form data shape ───────────────────────────────────────────────────────────
const INITIAL = {
  // A — Basic info
  yearOfStudy: "",
  studyFrequency: "",
  studyEffectiveness: "",
  mainChallenge: "",
  // B — Experience
  firstImpression: "",
  easeOfUse: "",
  mostUsedFeature: "",
  engagement: "",
  moreInteresting: "",
  helpedUnderstand: "",
  // C — Issues & improvements
  challengeDescription: "",
  improvementAreas: [],
  improvementOther: "",
  teamSuggestion: "",
  // D — Overall
  wouldRecommend: "",
  favoriteThing: "",
};

const IMPROVEMENT_OPTIONS = [
  "Theme colour",
  "The logo",
  "Home page appearance",
  "Quality of questions",
  "XP system",
  "Other",
];

export default function FeedbackForm({ onClose }) {
  const { currentUser } = useAuth();
  const [step, setStep] = useState(0); // 0–3 = sections A–D, 4 = success
  const [data, setData] = useState(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (field, value) => setData((d) => ({ ...d, [field]: value }));

  const toggleImprovement = (opt) => {
    setData((d) => ({
      ...d,
      improvementAreas: d.improvementAreas.includes(opt)
        ? d.improvementAreas.filter((o) => o !== opt)
        : [...d.improvementAreas, opt],
    }));
  };

  const STEPS = ["Basic Info", "Experience", "Challenges", "Overall"];

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const db = getFirestore();
      await addDoc(collection(db, "feedback"), {
        ...data,
        userId:    currentUser?.uid   || "anonymous",
        userEmail: currentUser?.email || "anonymous",
        submittedAt: new Date().toISOString(),
      });
      setStep(4);
    } catch (err) {
      console.error(err);
      setError("Failed to submit. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Validate each step has minimum required fields ───────────────────────
  const canAdvance = () => {
    if (step === 0) return data.yearOfStudy && data.studyFrequency;
    if (step === 1) return data.firstImpression && data.easeOfUse;
    if (step === 2) return true; // all optional
    if (step === 3) return data.wouldRecommend;
    return false;
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="fb-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="fb-modal">

        {/* Header */}
        <div className="fb-header">
          <div className="fb-header-left">
            <div className="fb-header-icon">💬</div>
            <div>
              <h2 className="fb-title">Share Your Feedback</h2>
              <p className="fb-subtitle">Help us make MedBlitz better for you</p>
            </div>
          </div>
          <button className="fb-close" onClick={onClose}>✕</button>
        </div>

        {/* Success state */}
        {step === 4 ? (
          <div className="fb-success">
            <div className="fb-success-icon">🎉</div>
            <h3>Thank you!</h3>
            <p>Your feedback means everything to us. We'll use it to make MedBlitz the best medical study app out there.</p>
            <button className="fb-btn-primary" onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            {/* Step progress */}
            <div className="fb-steps">
              {STEPS.map((label, i) => (
                <div key={i} className={`fb-step ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}>
                  <div className="fb-step-dot">{i < step ? "✓" : i + 1}</div>
                  <span className="fb-step-label">{label}</span>
                </div>
              ))}
            </div>

            {/* Body */}
            <div className="fb-body">

              {/* ── STEP 0: Basic Info ── */}
              {step === 0 && (
                <div className="fb-section">
                  <div className="fb-section-badge">📋 Section A</div>
                  <h3 className="fb-section-title">Basic Information</h3>

                  <div className="fb-field">
                    <label>Year of study <span className="fb-req">*</span></label>
                    <div className="fb-chips">
                      {["Year 1","Year 2","Year 3","Year 4","Year 5","Year 6","Graduate"].map((y) => (
                        <button key={y} className={`fb-chip ${data.yearOfStudy === y ? "active" : ""}`} onClick={() => set("yearOfStudy", y)}>{y}</button>
                      ))}
                    </div>
                  </div>

                  <div className="fb-field">
                    <label>How often do you study medicine per week? <span className="fb-req">*</span></label>
                    <div className="fb-chips">
                      {["Daily","5–6 days","3–4 days","1–2 days","Rarely"].map((f) => (
                        <button key={f} className={`fb-chip ${data.studyFrequency === f ? "active" : ""}`} onClick={() => set("studyFrequency", f)}>{f}</button>
                      ))}
                    </div>
                  </div>

                  <div className="fb-field">
                    <label>How effective are your current study methods?</label>
                    <div className="fb-chips">
                      {["Very effective","Effective","Neutral","Not very effective","Ineffective"].map((e) => (
                        <button key={e} className={`fb-chip ${data.studyEffectiveness === e ? "active" : ""}`} onClick={() => set("studyEffectiveness", e)}>{e}</button>
                      ))}
                    </div>
                  </div>

                  <div className="fb-field">
                    <label>What do you think is the main challenge with studying medical content?</label>
                    <textarea
                      className="fb-textarea"
                      placeholder="e.g. Too much information, hard to retain, lack of practice questions…"
                      value={data.mainChallenge}
                      onChange={(e) => set("mainChallenge", e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* ── STEP 1: Experience ── */}
              {step === 1 && (
                <div className="fb-section">
                  <div className="fb-section-badge">✨ Section B</div>
                  <h3 className="fb-section-title">Your Experience</h3>

                  <div className="fb-field">
                    <label>What was your first impression of MedBlitz? <span className="fb-req">*</span></label>
                    <textarea
                      className="fb-textarea"
                      placeholder="Describe your first impression…"
                      value={data.firstImpression}
                      onChange={(e) => set("firstImpression", e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="fb-field">
                    <label>How easy was it to understand how to use MedBlitz? <span className="fb-req">*</span></label>
                    <div className="fb-scale">
                      {["Very Easy","Easy","Neutral","Difficult","Very Difficult"].map((opt, i) => (
                        <button
                          key={opt}
                          className={`fb-scale-btn ${data.easeOfUse === opt ? "active" : ""}`}
                          style={{ "--scale-color": i < 2 ? "#22c55e" : i === 2 ? "#f59e0b" : "#ef4444" }}
                          onClick={() => set("easeOfUse", opt)}
                        >
                          <span className="fb-scale-emoji">{["😄","🙂","😐","🤔","😣"][i]}</span>
                          <span>{opt}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="fb-field">
                    <label>Which feature did you use most?</label>
                    <div className="fb-chips">
                      {["Daily Challenge","Study Centre","AI Quiz","Game Modes","Leaderboard","Stats"].map((f) => (
                        <button key={f} className={`fb-chip ${data.mostUsedFeature === f ? "active" : ""}`} onClick={() => set("mostUsedFeature", f)}>{f}</button>
                      ))}
                    </div>
                  </div>

                  <div className="fb-field">
                    <label>How engaging did you find the app?</label>
                    <div className="fb-chips">
                      {["Extremely engaging","Very engaging","Somewhat engaging","Not very engaging","Not at all"].map((e) => (
                        <button key={e} className={`fb-chip ${data.engagement === e ? "active" : ""}`} onClick={() => set("engagement", e)}>{e}</button>
                      ))}
                    </div>
                  </div>

                  <div className="fb-field">
                    <label>Did MedBlitz make studying medicine more interesting than usual?</label>
                    <div className="fb-chips">
                      {["Yes","No"].map((o) => (
                        <button key={o} className={`fb-chip fb-chip-lg ${data.moreInteresting === o ? "active" : ""}`} onClick={() => set("moreInteresting", o)}>{o}</button>
                      ))}
                    </div>
                  </div>

                  <div className="fb-field">
                    <label>Did MedBlitz help you understand or remember content better?</label>
                    <div className="fb-chips">
                      {["Yes, significantly","Yes, a little","Not really"].map((o) => (
                        <button key={o} className={`fb-chip ${data.helpedUnderstand === o ? "active" : ""}`} onClick={() => set("helpedUnderstand", o)}>{o}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 2: Challenges ── */}
              {step === 2 && (
                <div className="fb-section">
                  <div className="fb-section-badge">🔧 Section C</div>
                  <h3 className="fb-section-title">Challenges & Improvements</h3>

                  <div className="fb-field">
                    <label>Did you experience any challenges while using the app?</label>
                    <textarea
                      className="fb-textarea"
                      placeholder="Please describe any bugs, confusing areas, or frustrations…"
                      value={data.challengeDescription}
                      onChange={(e) => set("challengeDescription", e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="fb-field">
                    <label>What do you think should be improved? (Select all that apply)</label>
                    <div className="fb-chips fb-chips-wrap">
                      {IMPROVEMENT_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          className={`fb-chip ${data.improvementAreas.includes(opt) ? "active" : ""}`}
                          onClick={() => toggleImprovement(opt)}
                        >
                          {data.improvementAreas.includes(opt) ? "✓ " : ""}{opt}
                        </button>
                      ))}
                    </div>
                    {data.improvementAreas.includes("Other") && (
                      <input
                        className="fb-input fb-input-mt"
                        type="text"
                        placeholder="Please describe…"
                        value={data.improvementOther}
                        onChange={(e) => set("improvementOther", e.target.value)}
                      />
                    )}
                  </div>

                  <div className="fb-field">
                    <label>How do you think the MedBlitz team should improve the app to better achieve gamified learning?</label>
                    <textarea
                      className="fb-textarea"
                      placeholder="Your ideas and suggestions…"
                      value={data.teamSuggestion}
                      onChange={(e) => set("teamSuggestion", e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
              )}

              {/* ── STEP 3: Overall ── */}
              {step === 3 && (
                <div className="fb-section">
                  <div className="fb-section-badge">⭐ Section D</div>
                  <h3 className="fb-section-title">Overall</h3>

                  <div className="fb-field">
                    <label>Would you recommend MedBlitz to a friend? <span className="fb-req">*</span></label>
                    <div className="fb-recommend">
                      {[
                        { value: "Yes",   emoji: "🙌", label: "Yes!" },
                        { value: "Maybe", emoji: "🤔", label: "Maybe" },
                        { value: "No",    emoji: "😕", label: "No" },
                      ].map((o) => (
                        <button
                          key={o.value}
                          className={`fb-recommend-btn ${data.wouldRecommend === o.value ? "active" : ""}`}
                          onClick={() => set("wouldRecommend", o.value)}
                        >
                          <span className="fb-rec-emoji">{o.emoji}</span>
                          <span>{o.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="fb-field">
                    <label>What is the one thing you enjoy most about MedBlitz?</label>
                    <textarea
                      className="fb-textarea"
                      placeholder="Tell us what makes MedBlitz special to you…"
                      value={data.favoriteThing}
                      onChange={(e) => set("favoriteThing", e.target.value)}
                      rows={3}
                    />
                  </div>

                  {error && <p className="fb-error">⚠️ {error}</p>}
                </div>
              )}
            </div>

            {/* Footer nav */}
            <div className="fb-footer">
              <button
                className="fb-btn-secondary"
                onClick={() => step === 0 ? onClose() : setStep((s) => s - 1)}
              >
                {step === 0 ? "Cancel" : "← Back"}
              </button>

              {step < 3 ? (
                <button
                  className={`fb-btn-primary ${!canAdvance() ? "disabled" : ""}`}
                  onClick={() => canAdvance() && setStep((s) => s + 1)}
                  disabled={!canAdvance()}
                >
                  Next →
                </button>
              ) : (
                <button
                  className={`fb-btn-submit ${submitting ? "loading" : ""}`}
                  onClick={submit}
                  disabled={submitting || !canAdvance()}
                >
                  {submitting ? "Submitting…" : "Submit Feedback 🚀"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}