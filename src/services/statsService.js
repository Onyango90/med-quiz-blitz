// src/services/statsService.js
// Stats are stored in BOTH localStorage (fast reads) and Firestore (persistent cross-device)

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  increment,
} from "firebase/firestore";

// XP Rules
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

    this.sessionStartTime      = null;
    this.sessionQuestions      = [];
    this._syncedFromFirestore   = false;

    // Load from localStorage immediately (fast, for UI)
    this.loadFromLocal();
    // Then sync from Firestore in background (authoritative)
    this.syncFromFirestore();
  }

  // ── Local storage (fast, used for immediate UI reads) ─────────────────────
  loadFromLocal() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        this.stats = JSON.parse(saved);
      } else {
        this.initializeNewStats();
      }
    } catch {
      this.initializeNewStats();
    }
    return this.stats;
  }

  saveToLocal() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.stats));
    } catch {}
  }

  // ── Firestore sync (authoritative, cross-device) ──────────────────────────
  async syncFromFirestore() {
    try {
      const snap = await getDoc(this.fsDocRef);
      if (snap.exists()) {
        const fsData = snap.data();
        // Merge: take the higher value for numeric fields so no data is lost
        this.stats = this._mergeStats(this.stats, fsData);
        this.saveToLocal();
        this._syncedFromFirestore = true;
      } else {
        // First time — write local stats to Firestore
        await this._writeFullStatsToFirestore();
        this._syncedFromFirestore = true;
      }
    } catch (e) {
      console.warn("Could not sync stats from Firestore:", e);
    }
  }

  // Merge two stat objects, keeping the larger/more complete values
  _mergeStats(local, remote) {
    return {
      totalAttempted:          Math.max(local.totalAttempted   || 0, remote.totalAttempted   || 0),
      totalCorrect:            Math.max(local.totalCorrect     || 0, remote.totalCorrect     || 0),
      totalXP:                 Math.max(local.totalXP          || 0, remote.totalXP          || 0),
      currentStreak:           Math.max(local.currentStreak    || 0, remote.currentStreak    || 0),
      longestStreak:           Math.max(local.longestStreak    || 0, remote.longestStreak    || 0),
      lastCorrectDate:         remote.lastCorrectDate          || local.lastCorrectDate      || null,
      sessionsCompleted:       Math.max(local.sessionsCompleted|| 0, remote.sessionsCompleted|| 0),
      totalTimeSpent:          Math.max(local.totalTimeSpent   || 0, remote.totalTimeSpent   || 0),
      currentSessionQuestions: local.currentSessionQuestions   || 0,
      currentSessionCorrect:   local.currentSessionCorrect     || 0,
      subjectStats:            this._mergeSubjects(local.subjectStats || {}, remote.subjectStats || {}),
      dailyActivity:           this._mergeDailyActivity(local.dailyActivity || {}, remote.dailyActivity || {}),
      featureUsage:            this._mergeFeatureUsage(local.featureUsage || {}, remote.featureUsage || {}),
      achievements:            [...new Set([...(local.achievements || []), ...(remote.achievements || [])])],
      joinDate:                remote.joinDate || local.joinDate || new Date().toISOString().split("T")[0],
    };
  }

  _mergeSubjects(local, remote) {
    const merged = { ...local };
    for (const [subject, data] of Object.entries(remote)) {
      if (!merged[subject]) {
        merged[subject] = data;
      } else {
        merged[subject] = {
          correct:  Math.max(merged[subject].correct  || 0, data.correct  || 0),
          total:    Math.max(merged[subject].total    || 0, data.total    || 0),
          xpEarned: Math.max(merged[subject].xpEarned || 0, data.xpEarned || 0),
        };
      }
    }
    return merged;
  }

  _mergeDailyActivity(local, remote) {
    const merged = { ...local };
    for (const [date, data] of Object.entries(remote)) {
      if (!merged[date]) {
        merged[date] = data;
      } else {
        merged[date] = {
          attempted: Math.max(merged[date].attempted || 0, data.attempted || 0),
          correct:   Math.max(merged[date].correct   || 0, data.correct   || 0),
          xpEarned:  Math.max(merged[date].xpEarned  || 0, data.xpEarned  || 0),
          timeSpent: Math.max(merged[date].timeSpent  || 0, data.timeSpent  || 0),
          sessions:  Math.max(merged[date].sessions   || 0, data.sessions   || 0),
        };
      }
    }
    return merged;
  }

  _mergeFeatureUsage(local, remote) {
    const merged = { ...local };
    for (const [feature, data] of Object.entries(remote)) {
      if (!merged[feature]) {
        merged[feature] = data;
      } else {
        merged[feature] = {
          count:    Math.max(merged[feature].count || 0, data.count || 0),
          lastUsed: data.lastUsed || merged[feature].lastUsed,
        };
      }
    }
    return merged;
  }

  // Write complete stats object to Firestore
  async _writeFullStatsToFirestore() {
    try {
      await setDoc(this.fsDocRef, {
        ...this.stats,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (e) {
      console.warn("Could not write stats to Firestore:", e);
    }
  }

  // Incremental Firestore update (fast — only changed fields)
  async _incrementFirestore(fields) {
    try {
      const updates = { updatedAt: serverTimestamp() };
      for (const [key, val] of Object.entries(fields)) {
        updates[key] = increment(val);
      }
      await updateDoc(this.fsDocRef, updates);
    } catch {
      // If doc doesn't exist yet, write full stats
      await this._writeFullStatsToFirestore();
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
    this.saveToLocal();
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
    this.saveToLocal();
    // Fire-and-forget Firestore update
    this._writeFullStatsToFirestore();
  }

  // ── Answer processing ─────────────────────────────────────────────────────
  processAnswer(question, wasCorrect, timeSpentSeconds, mode) {
    const today   = new Date().toISOString().split("T")[0];
    const subject = question.subject || "General";

    // Update basic stats
    this.stats.totalAttempted++;
    if (wasCorrect) {
      this.stats.totalCorrect++;
      this.stats.currentSessionCorrect++;
    }

    // Calculate XP
    const xpEarned = this.calculateXP(wasCorrect, timeSpentSeconds);
    this.stats.totalXP += xpEarned;

    // Update streak
    this.updateStreak(wasCorrect, today);

    // Subject stats
    if (!this.stats.subjectStats[subject]) {
      this.stats.subjectStats[subject] = { correct: 0, total: 0, xpEarned: 0 };
    }
    this.stats.subjectStats[subject].total++;
    if (wasCorrect) this.stats.subjectStats[subject].correct++;
    this.stats.subjectStats[subject].xpEarned += xpEarned;

    // Daily activity
    if (!this.stats.dailyActivity[today]) {
      this.stats.dailyActivity[today] = { attempted: 0, correct: 0, xpEarned: 0, timeSpent: 0, sessions: 0 };
    }
    this.stats.dailyActivity[today].attempted++;
    if (wasCorrect) this.stats.dailyActivity[today].correct++;
    this.stats.dailyActivity[today].xpEarned  += xpEarned;
    this.stats.dailyActivity[today].timeSpent += timeSpentSeconds;

    // Session tracking
    this.stats.currentSessionQuestions++;
    this.sessionQuestions.push({ correct: wasCorrect, subject, timeSpent: timeSpentSeconds, xpEarned });

    // Achievements
    this.checkAchievements();

    // Save locally immediately
    this.saveToLocal();

    // Sync to Firestore (incremental, non-blocking)
    this._writeFullStatsToFirestore();

    return {
      xpEarned,
      newStreak: this.stats.currentStreak,
      totalXP:   this.stats.totalXP,
      accuracy:  this.getOverallAccuracy(),
    };
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

    this.saveToLocal();
    this._writeFullStatsToFirestore();

    return { sessionDuration, sessionTotal, sessionAccuracy, bonusXP, bonuses, totalXP: this.stats.totalXP };
  }

  updateStreak(wasCorrect, today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (wasCorrect && this.stats.lastCorrectDate !== today) {
      if (this.stats.lastCorrectDate === yesterdayStr) {
        this.stats.currentStreak++;
      } else {
        this.stats.currentStreak = 1;
      }
      this.stats.lastCorrectDate = today;
      if (this.stats.currentStreak > this.stats.longestStreak) {
        this.stats.longestStreak = this.stats.currentStreak;
      }
    }
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

    if (newOnes.length > 0) this.saveToLocal();
    return newOnes;
  }

  // ── Getters ────────────────────────────────────────────────────────────────
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
    const today    = new Date().toISOString().split("T")[0];
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
    this._writeFullStatsToFirestore();
    return this.getAllStats();
  }
}

export default StatsService;