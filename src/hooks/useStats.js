// src/hooks/useStats.js
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import StatsService from '../services/statsService';

export function useStats() {
  const { currentUser } = useAuth();
  const [statsService, setStatsService] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setStatsService(null);
      setStats(null);
      setLoading(false);
      return;
    }

    // FIX: await initialize() so Firestore data loads before UI renders
    const service = new StatsService(currentUser.uid);
    service.initialize().then(() => {
      setStatsService(service);
      setStats(service.getAllStats());
      setLoading(false);
    });
  }, [currentUser]);

  const refreshStats = () => {
    if (statsService) setStats(statsService.getAllStats());
  };

  const startSession = (mode) => {
    if (statsService) { statsService.startSession(mode); refreshStats(); }
  };

  const processAnswer = (question, wasCorrect, timeSpentSeconds, mode) => {
    if (statsService) {
      const result = statsService.processAnswer(question, wasCorrect, timeSpentSeconds, mode);
      refreshStats();
      return result;
    }
    return null;
  };

  const endSession = () => {
    if (statsService) {
      const result = statsService.endSession();
      refreshStats();
      return result;
    }
    return null;
  };

  return { stats, loading, startSession, processAnswer, endSession, refreshStats };
}