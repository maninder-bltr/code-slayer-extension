/**
 * Logic for XP, Leveling, Streak, and Rank calculation.
 */
import { storage } from '../utils/storage.js';
import { problemService } from './problemService.js';

export const progressService = {
    BOSS_MILESTONES: [7, 30, 100],
    RANKS: [
        { name: 'Trainee', minDays: 0 },
        { name: 'Ninja Initiate', minDays: 7 },
        { name: 'Shadow Ninja', minDays: 14 },
        { name: 'Demon Hunter', minDays: 30 },
        { name: 'Elite Slayer', minDays: 60 },
        { name: 'Master Ninja', minDays: 100 },
        { name: 'Hashira Developer', minDays: 180 },
        { name: 'Legendary Developer', minDays: 365 }
    ],

    calculateRank: (streak) => {
        for (let i = progressService.RANKS.length - 1; i >= 0; i--) {
            if (streak >= progressService.RANKS[i].minDays) {
                return progressService.RANKS[i].name;
            }
        }
        return progressService.RANKS[0].name;
    },

    getXPForDifficulty: (difficulty) => {
        const d = difficulty.toLowerCase();
        if (d === 'easy') return 10;
        if (d === 'medium') return 25;
        if (d === 'hard') return 50;
        return 10;
    },

    addXP: async (xp) => {
        const data = await storage.get('userStats') || { xp: 0, level: 1 };
        data.xp += xp;

        // Level Up Logic: Level 2 = 100XP, Level 3 = 250XP, Level 4 = 500XP (custom progression)
        // Formula: nextLevelXP = currentLevel * 100 + (currentLevel-1) * 50
        let nextLevelXP = data.level * 100 + (data.level - 1) * 50;
        while (data.xp >= nextLevelXP) {
            data.level++;
            nextLevelXP = data.level * 100 + (data.level - 1) * 50;
        }

        await storage.set('userStats', data);
        return data;
    },

    updateStreak: async (completedTodaysTasks) => {
        const data = await storage.get('userStats') || { streak: 0, lastActivityDate: null };
        const today = new Date().toISOString().split('T')[0];

        if (completedTodaysTasks) {
            if (data.lastActivityDate === today) return data.streak;

            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (data.lastActivityDate === yesterdayStr) {
                data.streak++;
            } else {
                data.streak = 1;
            }
            data.lastActivityDate = today;
            await storage.set('userStats', data);

            // Check for Boss Battle
            if (progressService.BOSS_MILESTONES.includes(data.streak)) {
                await progressService.activateBossBattle(data.streak);
            }
        }
        return data.streak;
    },

    activateBossBattle: async (milestone) => {
        const data = await problemService.getProblems();
        const allProblems = problemService.getAllProblemsFlat(data);
        const hardProblems = allProblems.filter(p => p.difficulty === 'hard');

        // Pick 3 random hard problems for the boss
        const bossMission = [];
        for (let i = 0; i < 3; i++) {
            if (hardProblems.length > 0) {
                const rand = Math.floor(Math.random() * hardProblems.length);
                bossMission.push({ ...hardProblems[rand], status: 'NOT_STARTED' });
            }
        }

        await storage.set('bossMission', {
            milestone,
            active: true,
            problems: bossMission,
            name: milestone === 100 ? 'Legendary Ancient One' : (milestone === 30 ? 'Algorithm Overlord' : 'Mini Boss')
        });
    }
};
