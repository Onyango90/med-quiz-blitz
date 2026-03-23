// src/services/statsService.js

// XP Rules
const XP_RULES = {
  CORRECT_ANSWER: 10,
  WRONG_ANSWER: 2,
  STREAK_BONUS: 5,      // Bonus for 5+ correct streak
  SESSION_BONUS: 15,    // Bonus for 10+ questions in a session
  PERFECT_BONUS: 30,    // Bonus for 100% accuracy in session
  DAILY_COMPLETION: 20  // Bonus for completing daily challenge
};

class StatsService {
  constructor(userId) {
    this.userId = userId;
    this.storageKey = `medblitz_stats_${userId}`;
    this.sessionStartTime = null;
    this.sessionQuestions = [];
    this.loadStats();
  }

  // Load stats from localStorage
  loadStats() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      this.stats = JSON.parse(saved);
    } else {
      this.initializeNewStats();
    }
    return this.stats;
  }

  // Initialize new user stats
  initializeNewStats() {
    this.stats = {
      // Basic stats
      totalAttempted: 0,
      totalCorrect: 0,
      totalXP: 0,
      
      // Streak tracking
      currentStreak: 0,
      longestStreak: 0,
      lastCorrectDate: null,
      
      // Session tracking
      sessionsCompleted: 0,
      totalTimeSpent: 0,
      currentSessionQuestions: 0,
      currentSessionCorrect: 0,
      
      // Subject performance
      subjectStats: {},
      
      // Daily activity
      dailyActivity: {},
      
      // Feature usage
      featureUsage: {},
      
      // Milestones
      achievements: [],
      
      joinDate: new Date().toISOString().split('T')[0]
    };
    this.saveStats();
  }

  // Save stats to localStorage
  saveStats() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.stats));
  }

  // Start a new study session
  startSession(mode) {
    this.sessionStartTime = Date.now();
    this.sessionQuestions = [];
    this.stats.currentSessionQuestions = 0;
    this.stats.currentSessionCorrect = 0;
    
    // Track feature usage
    this.trackFeatureUsage(mode);
    
    return { sessionStarted: true };
  }

  // Track when a feature is used
  trackFeatureUsage(featureName) {
    if (!this.stats.featureUsage[featureName]) {
      this.stats.featureUsage[featureName] = { count: 0, lastUsed: null };
    }
    this.stats.featureUsage[featureName].count++;
    this.stats.featureUsage[featureName].lastUsed = new Date().toISOString();
    this.saveStats();
  }

  // Process an answered question
  processAnswer(question, wasCorrect, timeSpentSeconds, mode) {
    const today = new Date().toISOString().split('T')[0];
    const subject = question.subject || 'General';
    
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
    
    // Update subject stats
    if (!this.stats.subjectStats[subject]) {
      this.stats.subjectStats[subject] = { correct: 0, total: 0, xpEarned: 0 };
    }
    this.stats.subjectStats[subject].total++;
    if (wasCorrect) {
      this.stats.subjectStats[subject].correct++;
    }
    this.stats.subjectStats[subject].xpEarned += xpEarned;
    
    // Update daily activity
    if (!this.stats.dailyActivity[today]) {
      this.stats.dailyActivity[today] = {
        attempted: 0,
        correct: 0,
        xpEarned: 0,
        timeSpent: 0,
        sessions: 0
      };
    }
    this.stats.dailyActivity[today].attempted++;
    if (wasCorrect) this.stats.dailyActivity[today].correct++;
    this.stats.dailyActivity[today].xpEarned += xpEarned;
    this.stats.dailyActivity[today].timeSpent += timeSpentSeconds;
    
    // Track session questions
    this.stats.currentSessionQuestions++;
    this.sessionQuestions.push({
      correct: wasCorrect,
      subject,
      timeSpent: timeSpentSeconds,
      xpEarned
    });
    
    // Check for achievements
    this.checkAchievements();
    
    this.saveStats();
    
    return {
      xpEarned,
      newStreak: this.stats.currentStreak,
      totalXP: this.stats.totalXP,
      accuracy: this.getOverallAccuracy()
    };
  }

  // Calculate XP for an answer
  calculateXP(wasCorrect, timeSpentSeconds) {
    let xp = wasCorrect ? XP_RULES.CORRECT_ANSWER : XP_RULES.WRONG_ANSWER;
    
    // Time bonus (answered quickly within 5 seconds)
    if (wasCorrect && timeSpentSeconds <= 5) {
      xp += 3;
    }
    
    // Streak bonus (every 5 correct answers in a row)
    if (wasCorrect && this.stats.currentStreak > 0 && this.stats.currentStreak % 5 === 0) {
      xp += XP_RULES.STREAK_BONUS;
    }
    
    return xp;
  }

  // End current session and apply bonuses
  endSession() {
    if (!this.sessionStartTime) return;
    
    const sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    const sessionTotal = this.stats.currentSessionQuestions;
    const sessionCorrect = this.stats.currentSessionCorrect;
    const sessionAccuracy = sessionTotal > 0 ? (sessionCorrect / sessionTotal) * 100 : 0;
    
    let bonusXP = 0;
    let bonuses = [];
    
    // Session length bonus
    if (sessionTotal >= 10) {
      bonusXP += XP_RULES.SESSION_BONUS;
      bonuses.push(`📚 ${XP_RULES.SESSION_BONUS} XP for completing 10+ questions`);
    }
    
    // Perfect accuracy bonus
    if (sessionAccuracy === 100 && sessionTotal >= 5) {
      bonusXP += XP_RULES.PERFECT_BONUS;
      bonuses.push(`🎯 ${XP_RULES.PERFECT_BONUS} XP for perfect accuracy!`);
    }
    
    // Apply bonuses
    if (bonusXP > 0) {
      this.stats.totalXP += bonusXP;
      
      // Add to today's XP
      const today = new Date().toISOString().split('T')[0];
      if (this.stats.dailyActivity[today]) {
        this.stats.dailyActivity[today].xpEarned += bonusXP;
      }
    }
    
    // Update session stats
    this.stats.sessionsCompleted++;
    this.stats.totalTimeSpent += sessionDuration;
    this.stats.dailyActivity[today].sessions++;
    
    this.saveStats();
    
    return {
      sessionDuration,
      sessionTotal,
      sessionAccuracy,
      bonusXP,
      bonuses,
      totalXP: this.stats.totalXP
    };
  }

  // Update streak logic
  updateStreak(wasCorrect, today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (wasCorrect) {
      // Only update streak if this is a new day's first correct answer
      if (this.stats.lastCorrectDate !== today) {
        if (this.stats.lastCorrectDate === yesterdayStr) {
          this.stats.currentStreak++;
        } else if (this.stats.lastCorrectDate !== today) {
          this.stats.currentStreak = 1;
        }
        
        this.stats.lastCorrectDate = today;
        
        // Update longest streak
        if (this.stats.currentStreak > this.stats.longestStreak) {
          this.stats.longestStreak = this.stats.currentStreak;
        }
      }
    } else {
      // Wrong answer doesn't break streak (but doesn't advance it either)
      // Streak only breaks if a day passes without any correct answers
    }
  }

  // Check and unlock achievements
  checkAchievements() {
    const achievements = [...this.stats.achievements];
    let newAchievements = [];
    
    // First question
    if (this.stats.totalAttempted === 1 && !achievements.includes('first_question')) {
      newAchievements.push({ id: 'first_question', name: 'First Step', xp: 50, icon: '🎯' });
    }
    
    // 100 questions
    if (this.stats.totalAttempted >= 100 && !achievements.includes('100_questions')) {
      newAchievements.push({ id: '100_questions', name: 'Century Club', xp: 200, icon: '💯' });
    }
    
    // 7-day streak
    if (this.stats.currentStreak >= 7 && !achievements.includes('7_day_streak')) {
      newAchievements.push({ id: '7_day_streak', name: 'Weekly Warrior', xp: 150, icon: '🔥' });
    }
    
    // Perfect session
    if (this.stats.currentSessionCorrect === this.stats.currentSessionQuestions && 
        this.stats.currentSessionQuestions >= 5 && 
        !achievements.includes('perfect_session')) {
      newAchievements.push({ id: 'perfect_session', name: 'Perfectionist', xp: 100, icon: '✨' });
    }
    
    // Add achievements
    newAchievements.forEach(ach => {
      this.stats.achievements.push(ach.id);
      this.stats.totalXP += ach.xp;
      
      // Add to daily XP
      const today = new Date().toISOString().split('T')[0];
      if (this.stats.dailyActivity[today]) {
        this.stats.dailyActivity[today].xpEarned += ach.xp;
      }
    });
    
    if (newAchievements.length > 0) {
      this.saveStats();
      return newAchievements;
    }
    
    return [];
  }

  // Get overall accuracy
  getOverallAccuracy() {
    if (this.stats.totalAttempted === 0) return 0;
    return ((this.stats.totalCorrect / this.stats.totalAttempted) * 100).toFixed(1);
  }

  // Get subject performance
  getSubjectPerformance() {
    const subjects = [];
    for (const [name, data] of Object.entries(this.stats.subjectStats)) {
      subjects.push({
        name,
        correct: data.correct,
        total: data.total,
        accuracy: ((data.correct / data.total) * 100).toFixed(1),
        xpEarned: data.xpEarned
      });
    }
    return subjects.sort((a, b) => b.accuracy - a.accuracy);
  }

  // Get today's stats
  getTodayStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayData = this.stats.dailyActivity[today] || {
      attempted: 0,
      correct: 0,
      xpEarned: 0,
      timeSpent: 0
    };
    
    return {
      ...todayData,
      accuracy: todayData.attempted > 0 
        ? ((todayData.correct / todayData.attempted) * 100).toFixed(0)
        : 0
    };
  }

  // Get weekly progress
  getWeeklyProgress() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    
    return days.map((day, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = this.stats.dailyActivity[dateStr] || { attempted: 0, xpEarned: 0 };
      return {
        name: day,
        questions: dayData.attempted,
        xp: dayData.xpEarned
      };
    });
  }

  // Get all stats (for display)
  getAllStats() {
    return {
      basic: {
        totalAttempted: this.stats.totalAttempted,
        totalCorrect: this.stats.totalCorrect,
        totalXP: this.stats.totalXP,
        accuracy: this.getOverallAccuracy(),
        currentStreak: this.stats.currentStreak,
        longestStreak: this.stats.longestStreak,
        sessionsCompleted: this.stats.sessionsCompleted,
        totalTimeSpent: this.stats.totalTimeSpent
      },
      today: this.getTodayStats(),
      subjects: this.getSubjectPerformance(),
      weekly: this.getWeeklyProgress(),
      featureUsage: this.stats.featureUsage,
      achievements: this.stats.achievements,
      joinDate: this.stats.joinDate
    };
  }

  // Reset stats (for testing)
  resetStats() {
    this.initializeNewStats();
    return this.getAllStats();
  }
}

export default StatsService;