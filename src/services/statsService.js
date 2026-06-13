// src/services/statsService.js

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

const XP_RULES = {
  CORRECT_ANSWER:   10,
  WRONG_ANSWER:      2,
  STREAK_BONUS:      5,
  SESSION_BONUS:    15,
  PERFECT_BONUS:    30,
  DAILY_COMPLETION: 20,
};

class StatsService {
  constructor(userId) {
    this.userId     = userId;
    this.storageKey = `medblitz_stats_${userId}`;
    this.db         = getFirestore();
    this.fsDocRef   = doc(this.db, "users", userId, "stats", "main");

    this.sessionStartTime    = null;
    this.sessionQuestions    = [];
    this.onStatsUpdated      = null; // callback for UI refresh
  }

  // ── Init: always load from Firestore first ────────────────────────────────
  async initialize() {
    try {
      const snap = await getDoc(this.fsDocRef);
      if (snap.exists()) {
        this.stats = snap.data();
        // FIX: Check streak validity on every login
        this._checkStreakOnLogin();
      } else {
        this.initializeNewStats();
        await this._saveToFirestore();
      }
    } catch (e) {
      console.warn("Firestore unavailable, using localStorage:", e);
      this._loadFromLocal();
    }
    this._saveToLocal();
    return this.stats;
  }

  // FIX: Validate streak on login — reset if more than 1 day has passed
  _checkStreakOnLogin() {
    const today     = new Date().toISOString().split("T")[0];
    const yesterday = this._getYesterday();
    const last      = this.stats.lastCorrectDate;

    if (last && last !== today && last !== yesterday) {
      // Gap of 2+ days — reset streak
      this.stats.currentStreak = 0;
    }
    // If last === today or yesterday, streak is still valid — do nothing
  }

  _getYesterday() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  }

  // ── Local storage (fallback only) ─────────────────────────────────────────
  _loadFromLocal() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        this.stats = JSON.parse(saved);
        this._checkStreakOnLogin();
      } else {
        this.initializeNewStats();
      }
    } catch {
      this.initializeNewStats();
    }
  }

  _saveToLocal() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.stats));
    } catch {}
  }

  // ── Firestore save (authoritative) ───────────────────────────────────────
  async _saveToFirestore() {
    try {
      await setDoc(this.fsDocRef, {
        ...this.stats,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (e) {
      console.warn("Could not save to Firestore:", e);
    }
  }

  // ── Stats init ────────────────────────────────────────────────────────────
  initializeNewStats() {
    this.stats = {
      totalAttempted:          0,
      totalCorrect:            0,
      totalXP:                 0,
      currentStreak:           0,
      longestStreak:           0,
      lastCorrectDate:         null,
      sessionsCompleted:       0,
      totalTimeSpent:          0,
      currentSessionQuestions: 0,
      currentSessionCorrect:   0,
      subjectStats:            {},
      dailyActivity:           {},
      featureUsage:            {},
      achievements:            [],
      joinDate:                new Date().toISOString().split("T")[0],
    };
  }

  // ── Session management ────────────────────────────────────────────────────
  startSession(mode) {
    this.sessionStartTime = Date.now();
    this.sessionQuestions = [];
    this.stats.currentSessionQuestions = 0;
    this.stats.currentSessionCorrect   = 0;
    this.trackFeatureUsage(mode);
    return { sessionStarted: true };
  }

  trackFeatureUsage(featureName) {
    if (!this.stats.featureUsage[featureName]) {
      this.stats.featureUsage[featureName] = { count: 0, lastUsed: null };
    }
    this.stats.featureUsage[featureName].count++;
    this.stats.featureUsage[featureName].lastUsed = new Date().toISOString();
    this._saveToLocal();
    this._saveToFirestore();
  }

  // ── Answer processing ─────────────────────────────────────────────────────
  processAnswer(question, wasCorrect, timeSpentSeconds, mode) {
    const today   = new Date().toISOString().split("T")[0];
    const subject = question.subject || "General";

    this.stats.totalAttempted++;
    if (wasCorrect) {
      this.stats.totalCorrect++;
      this.stats.currentSessionCorrect++;
    }

    const xpEarned = this.calculateXP(wasCorrect, timeSpentSeconds);
    this.stats.totalXP += xpEarned;

    // FIX: Update streak correctly
    this._updateStreak(wasCorrect, today);

    if (!this.stats.subjectStats[subject]) {
      this.stats.subjectStats[subject] = { correct: 0, total: 0, xpEarned: 0 };
    }
    this.stats.subjectStats[subject].total++;
    if (wasCorrect) this.stats.subjectStats[subject].correct++;
    this.stats.subjectStats[subject].xpEarned += xpEarned;

    if (!this.stats.dailyActivity[today]) {
      this.stats.dailyActivity[today] = { attempted: 0, correct: 0, xpEarned: 0, timeSpent: 0, sessions: 0 };
    }
    this.stats.dailyActivity[today].attempted++;
    if (wasCorrect) this.stats.dailyActivity[today].correct++;
    this.stats.dailyActivity[today].xpEarned  += xpEarned;
    this.stats.dailyActivity[today].timeSpent += timeSpentSeconds;

    this.stats.currentSessionQuestions++;
    this.sessionQuestions.push({ correct: wasCorrect, subject, timeSpent: timeSpentSeconds, xpEarned });

    this.checkAchievements();
    this._saveToLocal();
    this._saveToFirestore(); // non-blocking

    return {
      xpEarned,
      newStreak: this.stats.currentStreak,
      totalXP:   this.stats.totalXP,
      accuracy:  this.getOverallAccuracy(),
    };
  }

  // FIX: Streak increments on first correct answer of the day only
  _updateStreak(wasCorrect, today) {
    if (!wasCorrect) return; // wrong answers never affect streak
    if (this.stats.lastCorrectDate === today) return; // already counted today

    const yesterday = this._getYesterday();

    if (this.stats.lastCorrectDate === yesterday) {
      this.stats.currentStreak++; // consecutive day
    } else {
      this.stats.currentStreak = 1; // gap — restart
    }

    this.stats.lastCorrectDate = today;

    if (this.stats.currentStreak > this.stats.longestStreak) {
      this.stats.longestStreak = this.stats.currentStreak;
    }
  }

  calculateXP(wasCorrect, timeSpentSeconds) {
    let xp = wasCorrect ? XP_RULES.CORRECT_ANSWER : XP_RULES.WRONG_ANSWER;
    if (wasCorrect && timeSpentSeconds <= 5) xp += 3;
    if (wasCorrect && this.stats.currentStreak > 0 && this.stats.currentStreak % 5 === 0) {
      xp += XP_RULES.STREAK_BONUS;
    }
    return xp;
  }

  endSession() {
    if (!this.sessionStartTime) return;

    const sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    const sessionTotal    = this.stats.currentSessionQuestions;
    const sessionCorrect  = this.stats.currentSessionCorrect;
    const sessionAccuracy = sessionTotal > 0 ? (sessionCorrect / sessionTotal) * 100 : 0;
    const today           = new Date().toISOString().split("T")[0];

    let bonusXP = 0;
    let bonuses = [];

    if (sessionTotal >= 10) {
      bonusXP += XP_RULES.SESSION_BONUS;
      bonuses.push(`+${XP_RULES.SESSION_BONUS} XP for completing 10+ questions`);
    }
    if (sessionAccuracy === 100 && sessionTotal >= 5) {
      bonusXP += XP_RULES.PERFECT_BONUS;
      bonuses.push(`+${XP_RULES.PERFECT_BONUS} XP for perfect accuracy`);
    }

    if (bonusXP > 0) {
      this.stats.totalXP += bonusXP;
      if (this.stats.dailyActivity[today]) {
        this.stats.dailyActivity[today].xpEarned += bonusXP;
      }
    }

    this.stats.sessionsCompleted++;
    this.stats.totalTimeSpent += sessionDuration;
    if (this.stats.dailyActivity[today]) {
      this.stats.dailyActivity[today].sessions++;
    }

    this._saveToLocal();
    this._saveToFirestore();

    return { sessionDuration, sessionTotal, sessionAccuracy, bonusXP, bonuses, totalXP: this.stats.totalXP };
  }

  checkAchievements() {
    const achieved = this.stats.achievements;
    let newOnes = [];

    if (this.stats.totalAttempted === 1   && !achieved.includes("first_question"))  newOnes.push({ id: "first_question",  xp: 50  });
    if (this.stats.totalAttempted >= 100  && !achieved.includes("100_questions"))   newOnes.push({ id: "100_questions",   xp: 200 });
    if (this.stats.currentStreak  >= 7   && !achieved.includes("7_day_streak"))    newOnes.push({ id: "7_day_streak",    xp: 150 });
    if (
      this.stats.currentSessionCorrect === this.stats.currentSessionQuestions &&
      this.stats.currentSessionQuestions >= 5 &&
      !achieved.includes("perfect_session")
    ) newOnes.push({ id: "perfect_session", xp: 100 });

    const today = new Date().toISOString().split("T")[0];
    newOnes.forEach(ach => {
      this.stats.achievements.push(ach.id);
      this.stats.totalXP += ach.xp;
      if (this.stats.dailyActivity[today]) {
        this.stats.dailyActivity[today].xpEarned += ach.xp;
      }
    });

    if (newOnes.length > 0) this._saveToLocal();
    return newOnes;
  }

  // ── Getters ───────────────────────────────────────────────────────────────
  getOverallAccuracy() {
    if (this.stats.totalAttempted === 0) return 0;
    return ((this.stats.totalCorrect / this.stats.totalAttempted) * 100).toFixed(1);
  }

  getSubjectPerformance() {
    return Object.entries(this.stats.subjectStats).map(([name, data]) => ({
      name,
      correct:  data.correct,
      total:    data.total,
      accuracy: ((data.correct / data.total) * 100).toFixed(1),
      xpEarned: data.xpEarned,
    })).sort((a, b) => b.accuracy - a.accuracy);
  }

  getTodayStats() {
    const today     = new Date().toISOString().split("T")[0];
    const todayData = this.stats.dailyActivity[today] || { attempted: 0, correct: 0, xpEarned: 0, timeSpent: 0 };
    return {
      ...todayData,
      accuracy: todayData.attempted > 0
        ? ((todayData.correct / todayData.attempted) * 100).toFixed(0)
        : 0,
    };
  }

  getWeeklyProgress() {
    const days    = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const today   = new Date();
    const current = today.getDay();
    const monday  = new Date(today);
    monday.setDate(today.getDate() - (current === 0 ? 6 : current - 1));

    return days.map((day, index) => {
      const date    = new Date(monday);
      date.setDate(monday.getDate() + index);
      const dateStr = date.toISOString().split("T")[0];
      const d       = this.stats.dailyActivity[dateStr] || { attempted: 0, xpEarned: 0 };
      return { name: day, questions: d.attempted, xp: d.xpEarned };
    });
  }

  getAllStats() {
    return {
      basic: {
        totalAttempted:    this.stats.totalAttempted,
        totalCorrect:      this.stats.totalCorrect,
        totalXP:           this.stats.totalXP,
        accuracy:          this.getOverallAccuracy(),
        currentStreak:     this.stats.currentStreak,
        longestStreak:     this.stats.longestStreak,
        sessionsCompleted: this.stats.sessionsCompleted,
        totalTimeSpent:    this.stats.totalTimeSpent,
      },
      today:        this.getTodayStats(),
      subjects:     this.getSubjectPerformance(),
      weekly:       this.getWeeklyProgress(),
      featureUsage: this.stats.featureUsage,
      achievements: this.stats.achievements,
      joinDate:     this.stats.joinDate,
    };
  }

  resetStats() {
    this.initializeNewStats();
    this._saveToFirestore();
    return this.getAllStats();
  }
}

export default StatsService;