// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth } from "../firebase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

// ── How often to proactively refresh the token (45 min — well before 1hr expiry) ──
const TOKEN_REFRESH_INTERVAL_MS = 45 * 60 * 1000;

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser]   = useState(null);
  const [userData,    setUserData]       = useState(null);
  const [loading,     setLoading]        = useState(true);

  const db = getFirestore();

  // ── Load Firestore profile for a user ────────────────────────────────────
  const loadUserData = useCallback(async (user) => {
    if (!user) { setUserData(null); return; }
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        setUserData(snap.data());
      } else {
        // First-time Google sign-in — create a basic profile document
        const profile = {
          profile: {
            name:  user.displayName || user.email?.split("@")[0] || "Student",
            email: user.email || "",
            year:  localStorage.getItem("userYear") || 1,
            photoURL: user.photoURL || "",
          },
          isPro: false,
          subscription: { isPro: false },
          createdAt: serverTimestamp(),
        };
        await setDoc(doc(db, "users", user.uid), profile, { merge: true });
        setUserData(profile);
      }
    } catch (e) {
      console.warn("Could not load user data from Firestore:", e);
    }
  }, [db]);

  // ── Force-refresh the Firebase ID token ──────────────────────────────────
  const refreshToken = useCallback(async () => {
    if (!auth.currentUser) return;
    try {
      await auth.currentUser.getIdToken(true);
      console.log("Token refreshed successfully");
    } catch (e) {
      console.warn("Token refresh failed:", e);
    }
  }, []);

  // ── Auth state listener ───────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user?.email);
      setCurrentUser(user);
      await loadUserData(user);
      if (user) {
        // Cache basic info in localStorage for components that need it fast
        localStorage.setItem("userName",  user.displayName || user.email?.split("@")[0] || "Student");
        localStorage.setItem("userEmail", user.email || "");
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [loadUserData]);

  // ── Proactive token refresh every 45 minutes ──────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    // Refresh immediately on login, then every 45 min
    refreshToken();
    const interval = setInterval(refreshToken, TOKEN_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [currentUser, refreshToken]);

  // ── Also refresh token when tab becomes visible again ─────────────────────
  // (handles the case where a user leaves the tab for >1hr and comes back)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && auth.currentUser) {
        await refreshToken();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [refreshToken]);

  // ── Google Sign-In ────────────────────────────────────────────────────────
  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    // Force account picker every time so users can switch accounts
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await signInWithPopup(auth, provider);
    await loadUserData(result.user);
    return result.user;
  }, [loadUserData]);

  // ── Sign out ──────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setCurrentUser(null);
    setUserData(null);
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userYear");
  }, []);

  // ── Reload user data (call this after profile updates) ───────────────────
  const reloadUserData = useCallback(() => loadUserData(auth.currentUser), [loadUserData]);

  const value = {
    currentUser,
    userData,
    loading,
    signInWithGoogle,
    signOut,
    refreshToken,
    reloadUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}