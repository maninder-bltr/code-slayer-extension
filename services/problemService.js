/**
 * services/problemService.js - Load and assign problems
 */
import { storage } from '../utils/storage.js';

export const problemService = {
    problemsCache: null,

    getProblems: async () => {
        if (problemService.problemsCache) {
            return problemService.problemsCache;
        }

        try {
            const response = await fetch(chrome.runtime.getURL('data/problems.json'));
            const data = await response.json();
            console.log('✅ Problems loaded:', data);
            problemService.problemsCache = data;
            return data;
        } catch (error) {
            console.error('❌ Error loading problems:', error);
            return { sections: [] };
        }
    },

    getAllProblemsFlat: (data) => {
        let allProblems = [];
        if (!data || !data.sections) {
            console.warn('No problem sections found');
            return allProblems;
        }

        data.sections.forEach(section => {
            const sectionTitle = section.title;
            if (section.problems) {
                section.problems.forEach(p => {
                    allProblems.push({ ...p, topic: sectionTitle, sectionTitle });
                });
            }
            if (section.subsections) {
                section.subsections.forEach(sub => {
                    if (sub.problems) {
                        sub.problems.forEach(p => {
                            allProblems.push({ ...p, topic: sub.title, sectionTitle });
                        });
                    }
                });
            }
        });

        console.log('Flattened problems count:', allProblems.length);
        return allProblems;
    },

    assignDailyProblems: async (profile) => {
        console.log('Assigning daily problems. Mode:', profile.learningMode);

        const data = await problemService.getProblems();
        const allProblems = problemService.getAllProblemsFlat(data);

        if (allProblems.length === 0) {
            console.error('❌ No problems available in data file!');
            return null;
        }

        const completedIds = (profile.completedProblemIds || []).map(id => parseInt(id));
        let pool = allProblems.filter(p => !completedIds.includes(parseInt(p.id)));

        console.log('Problem pool after filtering completed:', pool.length);

        // Filter by custom topics if applicable
        if (profile.learningMode === 'CUSTOM_TOPIC' && profile.selectedTopics?.length > 0) {
            const selectedNormalized = profile.selectedTopics.map(t => t.trim().toLowerCase());
            pool = pool.filter(p => {
                const pTopic = (p.topic || '').trim().toLowerCase();
                const pSection = (p.sectionTitle || '').trim().toLowerCase();
                return selectedNormalized.includes(pTopic) || selectedNormalized.includes(pSection);
            });
            console.log('Pool after topic filter:', pool.length);
        }

        // Filter by difficulty if not mixed
        if (profile.difficulty && profile.difficulty !== 'mixed') {
            const targetDiff = profile.difficulty.toLowerCase();
            const diffFiltered = pool.filter(p => p.difficulty?.toLowerCase() === targetDiff);
            if (diffFiltered.length > 0) {
                pool = diffFiltered;
            }
        }

        if (pool.length === 0) {
            console.log('No problems in filtered pool, using all uncompleted problems');
            pool = allProblems.filter(p => !completedIds.includes(parseInt(p.id)));
        }

        if (pool.length === 0) {
            console.log('All problems completed!');
            return null;
        }

        // Sequential selection using currentProblemIndex
        let startIndex = profile.currentProblemIndex || 0;
        if (startIndex >= pool.length) {
            startIndex = 0;
        }

        const selected = [];
        for (let i = 0; i < 2 && (startIndex + i) < pool.length; i++) {
            selected.push(pool[startIndex + i]);
        }

        console.log('Selected problems:', selected.map(s => s.label || s.title));

        const today = new Date().toISOString().split('T')[0];
        const todayMission = {
            date: today,
            problems: selected.map(p => ({
                ...p,
                status: 'NOT_STARTED'
            }))
        };

        await storage.saveTodayMission(todayMission);

        profile.currentProblemIndex = startIndex + selected.length;
        await storage.saveUserProfile(profile);

        return todayMission;
    },

    markProblemCompleted: async (problemId, profile) => {
        const problemIdNum = parseInt(problemId);

        if (!profile.completedProblemIds.includes(problemIdNum)) {
            profile.completedProblemIds.push(problemIdNum);
            profile.demonsDefeated = (profile.demonsDefeated || 0) + 1;

            const problem = await problemService.getProblemById(problemIdNum);
            const xpGain = problemService.getXPForDifficulty(problem?.difficulty);
            profile.xp = (profile.xp || 0) + xpGain;

            if (profile.xp >= profile.xpToNextLevel) {
                profile.level += 1;
                profile.xp = profile.xp - profile.xpToNextLevel;
                profile.xpToNextLevel = Math.floor(profile.xpToNextLevel * 1.5);
            }

            if (problem?.topic) {
                if (!profile.topicStats[problem.topic]) {
                    profile.topicStats[problem.topic] = { completed: 0, attempts: 0 };
                }
                profile.topicStats[problem.topic].completed += 1;
            }

            await storage.saveUserProfile(profile);
            return { success: true, xpGain, profile };
        }
        return { success: false };
    },

    getProblemById: async (id) => {
        const data = await problemService.getProblems();
        const allProblems = problemService.getAllProblemsFlat(data);
        return allProblems.find(p => parseInt(p.id) === parseInt(id));
    },

    getXPForDifficulty: (difficulty) => {
        const d = difficulty?.toLowerCase();
        if (d === 'easy') return 10;
        if (d === 'medium') return 25;
        if (d === 'hard') return 50;
        return 10;
    }
};