// src/hooks/useSeenQuestions.js
// Tracks which question IDs a user has already seen per topic.
// Stores in Firestore so it persists across devices and sessions.
// Falls back to localStorage if Firestore is unavailable.

import { useState, useEffect, useCallback } from "react";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

const LOCAL_KEY = (uid, topicKey) => `medblitz_seen_${uid}_${topicKey}`;

/**
 * Returns questions sorted so unseen ones come first,
 * then seen ones shuffled at the end.
 */
export function sortQuestionsByUnseen(questions, seenIds = []) {
  const seenSet  = new Set(seenIds);
  const unseen   = shuffle(questions.filter(q => !seenSet.has(getQId(q))));
  const seen     = shuffle(questions.filter(q =>  seenSet.has(getQId(q))));
  return [...unseen, ...seen];
}

function getQId(q) {
  // Use the question's id field, or fall back to a hash of the question text
  return q.id || q._id || hashString(q.question || q.text || "");
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function useSeenQuestions({ uid, topicKey }) {
  const [seenIds,     setSeenIds]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const db = getFirestore();

  const docRef = uid && topicKey
    ? doc(db, "users", uid, "seenQuestions", topicKey)
    : null;

  // ── Load seen question IDs ────────────────────────────────────────────────
  useEffect(() => {
    if (!uid || !topicKey) { setLoading(false); return; }

    const load = async () => {
      // Try localStorage first for instant load
      try {
        const local = localStorage.getItem(LOCAL_KEY(uid, topicKey));
        if (local) setSeenIds(JSON.parse(local));
      } catch {}

      // Then sync from Firestore (authoritative)
      if (docRef) {
        try {
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const ids = snap.data().seenIds || [];
            setSeenIds(ids);
            // Keep localStorage in sync
            localStorage.setItem(LOCAL_KEY(uid, topicKey), JSON.stringify(ids));
          }
        } catch (e) {
          console.warn("Could not load seen questions from Firestore:", e);
        }
      }
      setLoading(false);
    };

    load();
  }, [uid, topicKey]);

  // ── Mark questions as seen ────────────────────────────────────────────────
  const markSeen = useCallback(async (questions = []) => {
    if (!uid || !topicKey) return;

    const newIds = questions.map(getQId).filter(Boolean);
    if (newIds.length === 0) return;

    setSeenIds(prev => {
      const merged = [...new Set([...prev, ...newIds])];

      // Save to localStorage immediately
      try {
        localStorage.setItem(LOCAL_KEY(uid, topicKey), JSON.stringify(merged));
      } catch {}

      // Save to Firestore (non-blocking)
      if (docRef) {
        setDoc(docRef, {
          seenIds:   merged,
          topicKey,
          updatedAt: serverTimestamp(),
        }, { merge: true }).catch(e => console.warn("Could not save seen questions:", e));
      }

      return merged;
    });
  }, [uid, topicKey, docRef]);

  // ── Reset seen questions for a topic (start fresh) ────────────────────────
  const resetSeen = useCallback(async () => {
    if (!uid || !topicKey) return;
    setSeenIds([]);
    try {
      localStorage.removeItem(LOCAL_KEY(uid, topicKey));
    } catch {}
    if (docRef) {
      try {
        await setDoc(docRef, { seenIds: [], topicKey, updatedAt: serverTimestamp() });
      } catch (e) {
        console.warn("Could not reset seen questions:", e);
      }
    }
  }, [uid, topicKey, docRef]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const getProgress = useCallback((totalQuestions) => {
    const seen  = seenIds.length;
    const total = totalQuestions || 0;
    const pct   = total > 0 ? Math.round((seen / total) * 100) : 0;
    return { seen, total, pct, allSeen: seen >= total && total > 0 };
  }, [seenIds]);

  return { seenIds, loading, markSeen, resetSeen, getProgress };
}