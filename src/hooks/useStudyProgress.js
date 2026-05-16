// src/hooks/useStudyProgress.js
// Reads and writes per-topic study progress to Firestore.
// Progress is a paid feature — only saved/loaded for Pro users.

import { useState, useEffect, useCallback } from "react";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

/**
 * Progress document shape (stored at users/{uid}/studyProgress/{topicKey}):
 * {
 *   batchIndex:       number,   // which batch the user was on
 *   questionIndex:    number,   // which question within that batch
 *   completedBatches: number[], // indices of fully completed batches
 *   totalAnswered:    number,   // total questions answered across all batches
 *   totalCorrect:     number,
 *   lastStudied:      Timestamp,
 * }
 */

export function useStudyProgress({ uid, isPro, topicKey }) {
  const [progress,     setProgress]     = useState(null);  // null = not yet loaded
  const [loadingProg,  setLoadingProg]  = useState(true);
  const [saveError,    setSaveError]    = useState(null);

  const db      = getFirestore();
  const docRef  = uid && topicKey
    ? doc(db, "users", uid, "studyProgress", topicKey)
    : null;

  // ── Load saved progress on mount ────────────────────────────────────────
  useEffect(() => {
    if (!uid || !isPro || !docRef) {
      setLoadingProg(false);
      return;
    }
    const load = async () => {
      try {
        const snap = await getDoc(docRef);
        if (snap.exists()) setProgress(snap.data());
      } catch (e) {
        console.warn("Could not load study progress:", e);
      } finally {
        setLoadingProg(false);
      }
    };
    load();
  }, [uid, isPro, topicKey]);

  // ── Save progress ────────────────────────────────────────────────────────
  const saveProgress = useCallback(async ({
    batchIndex, questionIndex, completedBatches,
    totalAnswered, totalCorrect,
  }) => {
    if (!uid || !isPro || !docRef) return;
    try {
      await setDoc(docRef, {
        batchIndex,
        questionIndex,
        completedBatches,
        totalAnswered,
        totalCorrect,
        lastStudied: serverTimestamp(),
      }, { merge: true });
      setSaveError(null);
    } catch (e) {
      console.warn("Could not save study progress:", e);
      setSaveError("Progress could not be saved.");
    }
  }, [uid, isPro, topicKey]);

  // ── Clear progress (start fresh) ─────────────────────────────────────────
  const clearProgress = useCallback(async () => {
    if (!uid || !isPro || !docRef) return;
    try {
      await setDoc(docRef, {
        batchIndex: 0, questionIndex: 0,
        completedBatches: [], totalAnswered: 0, totalCorrect: 0,
        lastStudied: serverTimestamp(),
      });
      setProgress(null);
    } catch (e) {
      console.warn("Could not clear progress:", e);
    }
  }, [uid, isPro, topicKey]);

  return { progress, loadingProg, saveProgress, clearProgress, saveError };
}