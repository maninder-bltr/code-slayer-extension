/**
 * utils/storage.js - Unified storage wrapper
 */
export const storage = {
  get: async (key) => {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key]);
      });
    });
  },

  set: async (key, value) => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => {
        resolve();
      });
    });
  },

  getAll: async () => {
    return new Promise((resolve) => {
      chrome.storage.local.get(null, (result) => {
        resolve(result);
      });
    });
  },

  clear: async () => {
    return new Promise((resolve) => {
      chrome.storage.local.clear(() => {
        resolve();
      });
    });
  },

  async getUserProfile() {
    // ✅ Unified: Get all user data from single userProfile key
    const profile = await this.get('userProfile');
    return profile || this.getDefaultProfile();
  },

  getDefaultProfile() {
    return {
      rank: 'Trainee',
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      demonsDefeated: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastPracticeDate: null,
      learningMode: null, // 'NINJA_PATH' or 'CUSTOM_TOPIC'
      selectedTopics: [],
      difficulty: 'mixed',
      completedProblemIds: [], // ✅ Moved from 'progress' to userProfile
      attemptedProblemIds: [],
      currentProblemIndex: 0, // ✅ KEY FIX: Track position in sequence
      topicStats: {},
      onboardingComplete: false,
      hideBeginnerGuide: false
    };
  },

  async saveUserProfile(profile) {
    await this.set('userProfile', profile);
  },

  async getTodayMission() {
    return await this.get('todayMission');
  },

  async saveTodayMission(mission) {
    await this.set('todayMission', mission);
  },

  async getSettings() {
    return await this.get('settings') || { blockedSites: this.getDefaultBlockedSites() };
  },

  getDefaultBlockedSites() {
    return ["youtube.com", "linkedin.com", "x.com", "facebook.com", "instagram.com"];
  }
};