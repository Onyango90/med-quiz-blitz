// src/hooks/useStats.js
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import StatsService from '../services/statsService';

export function useStats() {
  const { currentUser } = useAuth();
  const [statsService, setStatsService] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize stats service when user changes
  useEffect(() => {
    if (currentUser) {
      const service = new StatsService(currentUser.uid);
      setStatsService(service);
      setStats(service.getAllStats());
      setLoading(false);
    } else {
      setStatsService(null);
      setStats(null);
      setLoading(false);
    }
  }, [currentUser]);

  // Refresh stats
  const refreshStats = () => {
    if (statsService) {
      setStats(statsService.getAllStats());
    }
  };

  // Start a session
  const startSession = (mode) => {
    if (statsService) {
      statsService.startSession(mode);
      refreshStats();
    }
  };

  // Process an answer
  const processAnswer = (question, wasCorrect, timeSpentSeconds, mode) => {
    if (statsService) {
      const result = statsService.processAnswer(question, wasCorrect, timeSpentSeconds, mode);
      refreshStats();
      return result;
    }
    return null;
  };

  // End session
  const endSession = () => {
    if (statsService) {
      const result = statsService.endSession();
      refreshStats();
      return result;
    }
    return null;
  };

  return {
    stats,
    loading,
    startSession,
    processAnswer,
    endSession,
    refreshStats
  };
}