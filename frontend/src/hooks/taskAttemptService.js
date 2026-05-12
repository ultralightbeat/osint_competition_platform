/**
 * Service for managing task attempts in localStorage
 * Tracks which tasks are being solved, completed, and their timer states
 */

const STORAGE_KEY = 'taskAttempts';
const SOLVED_KEY = 'solvedTasks';

/**
 * Get all task attempts from localStorage
 */
const getAttempts = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error reading task attempts:', error);
    return {};
  }
};

/**
 * Save task attempts to localStorage
 */
const saveAttempts = (attempts) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts));
  } catch (error) {
    console.error('Error saving task attempts:', error);
  }
};

/**
 * Get all solved tasks from localStorage
 */
const getSolvedTasks = () => {
  try {
    const data = localStorage.getItem(SOLVED_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading solved tasks:', error);
    return [];
  }
};

/**
 * Save solved tasks to localStorage
 */
const saveSolvedTasks = (solvedTasks) => {
  try {
    localStorage.setItem(SOLVED_KEY, JSON.stringify(solvedTasks));
  } catch (error) {
    console.error('Error saving solved tasks:', error);
  }
};

/**
 * Start a new task attempt
 * @param {string} taskId - Task UUID
 * @returns {object} Attempt object with startedAt timestamp
 */
export const startAttempt = (taskId) => {
  const attempts = getAttempts();
  const attempt = {
    startedAt: Date.now(),
    status: 'in_progress'
  };
  
  attempts[taskId] = attempt;
  saveAttempts(attempts);
  
  return attempt;
};

/**
 * Get a specific task attempt
 * @param {string} taskId - Task UUID
 * @returns {object|null} Attempt object or null if not found
 */
export const getAttempt = (taskId) => {
  const attempts = getAttempts();
  return attempts[taskId] || null;
};

/**
 * Complete a task attempt (when user solves it)
 * @param {string} taskId - Task UUID
 */
export const completeAttempt = (taskId) => {
  const attempts = getAttempts();
  
  if (attempts[taskId]) {
    attempts[taskId].status = 'completed';
    attempts[taskId].completedAt = Date.now();
    saveAttempts(attempts);
  }
};

/**
 * Clear a task attempt from storage
 * @param {string} taskId - Task UUID
 */
export const clearAttempt = (taskId) => {
  const attempts = getAttempts();
  delete attempts[taskId];
  saveAttempts(attempts);
};

/**
 * Check if a task has been solved
 * @param {string} taskId - Task UUID
 * @returns {boolean}
 */
export const isSolved = (taskId) => {
  const solvedTasks = getSolvedTasks();
  return solvedTasks.includes(taskId);
};

/**
 * Mark a task as solved
 * @param {string} taskId - Task UUID
 */
export const markSolved = (taskId) => {
  const solvedTasks = getSolvedTasks();
  
  if (!solvedTasks.includes(taskId)) {
    solvedTasks.push(taskId);
    saveSolvedTasks(solvedTasks);
  }
};

/**
 * Sync solved tasks from server (called after login)
 * @param {string[]} serverSolvedTasks - Array of task IDs from server
 */
export const syncSolvedTasks = (serverSolvedTasks) => {
  saveSolvedTasks(serverSolvedTasks);
  
  // Clean up attempts for solved tasks
  const attempts = getAttempts();
  serverSolvedTasks.forEach(taskId => {
    delete attempts[taskId];
  });
  saveAttempts(attempts);
};

/**
 * Get elapsed time for an in-progress attempt
 * @param {string} taskId - Task UUID
 * @returns {number} Elapsed seconds or 0
 */
export const getElapsedTime = (taskId) => {
  const attempt = getAttempt(taskId);
  
  if (!attempt || attempt.status !== 'in_progress') {
    return 0;
  }
  
  const elapsedMs = Date.now() - attempt.startedAt;
  return Math.floor(elapsedMs / 1000);
};

/**
 * Clear all task attempts (useful for logout)
 */
export const clearAllAttempts = () => {
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * Clear all solved tasks (useful for logout)
 */
export const clearAllSolved = () => {
  localStorage.removeItem(SOLVED_KEY);
};
