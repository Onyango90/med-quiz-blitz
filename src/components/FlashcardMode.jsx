// src/components/FlashcardMode.jsx
import React, { useState, useCallback, useRef } from "react";
import "./FlashcardMode.css";

// Convert a question bank entry into a flashcard
function toFlashcard(q, subject) {
  // Normalise format A (text/correctAnswer) and format B (question/answer)
  const front = q.question || q.text || "";
  const back   = q.answer   || (q.options && typeof q.correctAnswer === "number" ? q.options[q.correctAnswer] : "");
  return {
    id:          q.id || Math.random().toString(36).slice(2),
    subject:     q.subject || subject || "General",
    topic:       q.topic || q.category || "",
    difficulty:  q.difficulty || "medium",
    front,
    back,
    explanation: q.explanation || "",
    options:     q.options || [],
  };
}

const DIFF_COLOR = { easy: "#0d9488", medium: "#d97706", hard: "#ef4444" };
const DIFF_BG    = { easy: "#f0fdfa", medium: "#fffbeb", hard: "#fef2f2" };

export default function FlashcardMode({ questions = [], subject = "Study", onExit }) {
  const cards = questions.map(q => toFlashcard(q, subject)).filter(c => c.front);

  const [index,     setIndex]     = useState(0);
  const [flipped,   setFlipped]   = useState(false);
  const [known,     setKnown]     = useState(new Set());   // card ids marked known
  const [unsure,    setUnsure]    = useState(new Set());   // card ids marked unsure
  const [mode,      setMode]      = useState("all");       // all | unsure | known
  const [completed, setCompleted] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragDelta, setDragDelta] = useState(0);
  const [throwing,  setThrowing]  = useState(null); // "left" | "right"
  const cardRef = useRef(null);

  // Filtered deck based on mode
  const deck = cards.filter(c => {
    if (mode === "unsure") return unsure.has(c.id);
    if (mode === "known")  return known.has(c.id);
    return true;
  });

  const card = deck[index];
  const progress = deck.length > 0 ? Math.round(((known.size) / cards.length) * 100) : 0;

  // ── Flip ──────────────────────────────────────────────────────────────────
  const flip = useCallback(() => {
    setFlipped(f => !f);
  }, []);

  // ── Advance ───────────────────────────────────────────────────────────────
  const advance = useCallback((direction) => {
    setThrowing(direction);
    setTimeout(() => {
      setThrowing(null);
      setFlipped(false);
      setDragDelta(0);
      if (index + 1 >= deck.length) {
        setCompleted(true);
      } else {
        setIndex(i => i + 1);
      }
    }, 320);
  }, [index, deck.length]);

  // ── Mark known / unsure ───────────────────────────────────────────────────
  const markKnown = useCallback(() => {
    if (!card) return;
    setKnown(prev => new Set([...prev, card.id]));
    setUnsure(prev => { const n = new Set(prev); n.delete(card.id); return n; });
    advance("right");
  }, [card, advance]);

  const markUnsure = useCallback(() => {
    if (!card) return;
    setUnsure(prev => new Set([...prev, card.id]));
    setKnown(prev => { const n = new Set(prev); n.delete(card.id); return n; });
    advance("left");
  }, [card, advance]);

  const skipCard = useCallback(() => {
    advance("right");
  }, [advance]);

  // ── Drag / swipe ──────────────────────────────────────────────────────────
  const onPointerDown = (e) => {
    setDragStart(e.clientX);
  };
  const onPointerMove = (e) => {
    if (dragStart === null) return;
    setDragDelta(e.clientX - dragStart);
  };
  const onPointerUp = () => {
    if (dragStart === null) return;
    const delta = dragDelta;
    setDragStart(null);
    if (delta > 70)          { markKnown();  return; }
    if (delta < -70)         { markUnsure(); return; }
    if (Math.abs(delta) < 10) flip();  // tap = flip
    setDragDelta(0);
  };

  // ── Reset ─────────────────────────────────────────────────────────────────
  const restart = useCallback((newMode = "all") => {
    setMode(newMode);
    setIndex(0);
    setFlipped(false);
    setCompleted(false);
    setDragDelta(0);
    setThrowing(null);
    if (newMode === "all") { setKnown(new Set()); setUnsure(new Set()); }
  }, []);

  // ── Empty deck ────────────────────────────────────────────────────────────
  if (cards.length === 0) {
    return (
      <div className="fc-empty">
        <span>📭</span>
        <p>No flashcards available for this topic yet.</p>
        <button className="fc-btn-back" onClick={onExit}>← Back to Study</button>
      </div>
    );
  }

  // ── COMPLETED ─────────────────────────────────────────────────────────────
  if (completed) {
    return (
      <div className="fc-page">
        <div className="fc-complete">
          <div className="fc-complete-hero">
            <span className="fc-complete-icon">
              {known.size === cards.length ? "🏆" : known.size > cards.length * 0.7 ? "⭐" : "💪"}
            </span>
            <h2 className="fc-complete-title">
              {known.size === cards.length ? "Perfect round!" : "Round complete!"}
            </h2>
            <p className="fc-complete-sub">{subject} · {deck.length} cards</p>
          </div>

          <div className="fc-complete-stats">
            <div className="fc-cs">
              <span className="fc-cs-val" style={{ color: "#0d9488" }}>{known.size}</span>
              <span className="fc-cs-lbl">Got it ✓</span>
            </div>
            <div className="fc-cs">
              <span className="fc-cs-val" style={{ color: "#d97706" }}>{unsure.size}</span>
              <span className="fc-cs-lbl">Review again</span>
            </div>
            <div className="fc-cs">
              <span className="fc-cs-val">{progress}%</span>
              <span className="fc-cs-lbl">Mastered</span>
            </div>
          </div>

          <div className="fc-complete-actions">
            {unsure.size > 0 && (
              <button className="fc-btn-retry" onClick={() => restart("unsure")}>
                🔄 Retry unsure cards ({unsure.size})
              </button>
            )}
            <button className="fc-btn-all" onClick={() => restart("all")}>
              ↩ Restart all cards
            </button>
            <button className="fc-btn-back" onClick={onExit}>
              ← Back to Study
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN ──────────────────────────────────────────────────────────────────
  if (!card) {
    return (
      <div className="fc-page">
        <div className="fc-empty">
          <span>🎉</span>
          <p>No more cards in this deck!</p>
          <button className="fc-btn-back" onClick={() => restart("all")}>Start over</button>
        </div>
      </div>
    );
  }

  const swipeHint = dragDelta > 30 ? "known" : dragDelta < -30 ? "unsure" : null;
  const cardStyle = {
    transform: `rotate(${dragDelta * 0.04}deg) translateX(${dragDelta}px)`,
    transition: dragStart !== null ? "none" : throwing ? "all .3s cubic-bezier(.4,0,.2,1)" : "transform .2s",
    ...(throwing === "right" ? { transform: "translateX(120%) rotate(15deg)", opacity: 0 } : {}),
    ...(throwing === "left"  ? { transform: "translateX(-120%) rotate(-15deg)", opacity: 0 } : {}),
  };

  return (
    <div className="fc-page">

      {/* Header */}
      <div className="fc-header">
        <button className="fc-close" onClick={onExit}>← Back</button>
        <div className="fc-header-center">
          <span className="fc-subject">{subject}</span>
          <span className="fc-counter">{index + 1} / {deck.length}</span>
        </div>
        {/* Mode tabs */}
        <div className="fc-mode-tabs">
          {["all", "unsure"].map(m => (
            <button key={m}
              className={`fc-mode-tab ${mode === m ? "fc-mode-tab--active" : ""}`}
              onClick={() => { setMode(m); setIndex(0); setFlipped(false); setCompleted(false); }}
            >
              {m === "all" ? `All (${cards.length})` : `Unsure (${unsure.size})`}
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="fc-progress-track">
        <div className="fc-progress-known"  style={{ width: `${(known.size / cards.length) * 100}%` }} />
        <div className="fc-progress-unsure" style={{ width: `${(unsure.size / cards.length) * 100}%`, left: `${(known.size / cards.length) * 100}%` }} />
      </div>
      <div className="fc-progress-labels">
        <span style={{ color: "#0d9488" }}>✓ {known.size} known</span>
        <span style={{ color: "#d97706" }}>~ {unsure.size} unsure</span>
        <span style={{ color: "#9ca3af" }}>{cards.length - known.size - unsure.size} left</span>
      </div>

      {/* Swipe hint overlays */}
      {swipeHint === "known"  && <div className="fc-swipe-hint fc-hint-known">✓ Got it!</div>}
      {swipeHint === "unsure" && <div className="fc-swipe-hint fc-hint-unsure">~ Review</div>}

      {/* Card */}
      <div className="fc-card-area">
        <div
          ref={cardRef}
          className={`fc-card ${flipped ? "fc-card--flipped" : ""}`}
          style={cardStyle}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {/* Front */}
          <div className="fc-card-front">
            <div className="fc-card-meta">
              <span className="fc-card-subject">{card.subject}</span>
              {card.topic && <span className="fc-card-topic">{card.topic}</span>}
              <span className="fc-card-diff" style={{ color: DIFF_COLOR[card.difficulty], background: DIFF_BG[card.difficulty] }}>
                {card.difficulty}
              </span>
            </div>
            <div className="fc-card-body">
              <p className="fc-card-question">{card.front}</p>
            </div>
            <div className="fc-card-hint">
              <span>👆 Tap to reveal answer</span>
            </div>
          </div>

          {/* Back */}
          <div className="fc-card-back">
            <div className="fc-card-meta">
              <span className="fc-card-subject">{card.subject}</span>
              <span className="fc-answer-label">Answer</span>
            </div>
            <div className="fc-card-body">
              <p className="fc-card-answer">{card.back}</p>
              {card.explanation && (
                <div className="fc-explanation">
                  <span className="fc-exp-icon">💡</span>
                  <p className="fc-exp-text">{card.explanation}</p>
                </div>
              )}
              {card.options.length > 0 && (
                <div className="fc-options-preview">
                  {card.options.map((opt, i) => (
                    <span key={i} className={`fc-opt ${opt === card.back ? "fc-opt--correct" : ""}`}>
                      {opt === card.back ? "✓ " : ""}{opt}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="fc-card-hint">
              <span>👆 Tap to see question</span>
            </div>
          </div>
        </div>

        {/* Next card shadow (depth effect) */}
        <div className="fc-card-shadow" />
      </div>

      {/* Action buttons */}
      <div className="fc-actions">
        <button className="fc-action-btn fc-btn-unsure" onClick={markUnsure}>
          <span className="fc-action-icon">←</span>
          <span>Review again</span>
        </button>
        <button className="fc-action-skip" onClick={skipCard}>
          Skip
        </button>
        <button className="fc-action-btn fc-btn-known" onClick={markKnown}>
          <span>Got it!</span>
          <span className="fc-action-icon">→</span>
        </button>
      </div>

      {/* Swipe hint text */}
      <p className="fc-swipe-guide">← Swipe left to review · Swipe right if you know it →</p>

    </div>
  );
}