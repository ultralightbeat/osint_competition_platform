import { useState, useEffect, useCallback, useRef } from 'react';
import * as taskAttemptService from './taskAttemptService';

/**
 * Persistent timer hook that saves state to localStorage
 * Extends useTimer with persistence across page refreshes
 * @param {string} taskId - Task UUID to track
 * @returns {object} Timer controls and state
 */
export function usePersistentTimer(taskId) {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  // On mount, check if there's an existing attempt
  useEffect(() => {
    if (!taskId) return;

    const attempt = taskAttemptService.getAttempt(taskId);
    
    if (attempt && attempt.status === 'in_progress') {
      // Resume timer from saved state
      const elapsedSeconds = taskAttemptService.getElapsedTime(taskId);
      setTime(elapsedSeconds);
      setHasStarted(true);
      setIsRunning(true);
      startTimeRef.current = Date.now() - elapsedSeconds * 1000;
    }
  }, [taskId]);

  // Update timer every 100ms when running
  useEffect(() => {
    if (isRunning && startTimeRef.current) {
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setTime(elapsed);
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const start = useCallback(() => {
    if (!isRunning && taskId) {
      // Save attempt to localStorage
      taskAttemptService.startAttempt(taskId);
      
      startTimeRef.current = Date.now();
      setHasStarted(true);
      setIsRunning(true);
      setTime(0);
    }
  }, [isRunning, taskId]);

  const stop = useCallback(() => {
    setIsRunning(false);
    return time;
  }, [time]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTime(0);
    setHasStarted(false);
    startTimeRef.current = null;
    
    if (taskId) {
      taskAttemptService.clearAttempt(taskId);
    }
  }, [taskId]);

  const complete = useCallback(() => {
    const finalTime = stop();
    
    if (taskId) {
      taskAttemptService.completeAttempt(taskId);
      taskAttemptService.markSolved(taskId);
    }
    
    return finalTime;
  }, [taskId, stop]);

  const getElapsedTime = useCallback(() => {
    return time;
  }, [time]);

  const formatTime = useCallback((seconds = time) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [time]);

  return {
    time,
    isRunning,
    hasStarted,
    start,
    stop,
    reset,
    complete,
    formatTime,
    getElapsedTime
  };
}

export default usePersistentTimer;
