/**
 * background/background.js - Code Slayer Complete Controller
 * Version: 3.0.0 - With Bonus Problems System
 */

console.log('🥷 CODE SLAYER BACKGROUND v3.0.0 LOADED');
console.log('Timestamp:', new Date().toISOString());

import { storage } from '../utils/storage.js';
import { problemService } from '../services/problemService.js';
import { geminiService } from '../services/geminiService.js';

const BLOCKED_SITES = [
    "youtube.com",
    "www.youtube.com",
    "facebook.com",
    "www.facebook.com",
    "instagram.com",
    "www.instagram.com",
    "twitter.com",
    "www.twitter.com",
    "x.com",
    "www.x.com",
    "linkedin.com",
    "www.linkedin.com",
    "reddit.com",
    "www.reddit.com",
    "tiktok.com",
    "www.tiktok.com"
];

// Initialize on install
chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('Code Slayer installed!', details.reason);

    if (details.reason === 'install') {
        chrome.tabs.create({ url: chrome.runtime.getURL('pages/onboarding.html') });
    }

    await problemService.getProblems();
    chrome.alarms.create('daily-mission', { periodInMinutes: 1440 });

    setTimeout(() => initializeBlockers(), 1000);

    setTimeout(() => initializeReminderOnLoad(), 1500);
});

chrome.runtime.onStartup.addListener(async () => {
    console.log('Extension starting up...');
    setTimeout(() => initializeBlockers(), 1000);
    setTimeout(() => initializeReminderOnLoad(), 1500);
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'daily-mission') {
        console.log('📅 Daily alarm triggered');
        await resetDailyMission();
    }

    if (alarm.name === 'reminder-alarm') {
        console.log('🔔 Reminder alarm triggered');
        await sendReminderNotification();
    }
});

chrome.notifications.onClicked.addListener(async (notificationId) => {
    console.log('🔔 Notification clicked:', notificationId);

    if (notificationId === 'mission-complete' || notificationId.includes('reminder')) {
        // Open dashboard
        await chrome.tabs.create({ url: chrome.runtime.getURL('pages/dashboard.html') });
    }
});

async function sendReminderNotification() {
    const settings = await storage.get('settings') || {};
    const message = settings.reminderMessage || '⚔ Your demons are waiting. Complete today\'s mission!';

    const mission = await storage.getTodayMission();
    const incomplete = mission?.problems?.some(p => p.status !== 'COMPLETED');

    if (incomplete) {
        try {
            await chrome.notifications.create({
                type: 'basic',
                iconUrl: chrome.runtime.getURL('assets/icon128.png'),
                title: '⚔️ Daily Mission Awaiting!',
                message: message
            });
        } catch (error) {
            console.error('Failed to send reminder:', error);
        }
    }
}

// ✅ CRITICAL: Message handler for ALL message types
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📬 Message received:', request.type);

    handleMessage(request, sender, sendResponse);

    return true; // Keep channel open for async response
});

async function handleMessage(request, sender, sendResponse) {
    try {
        let result;

        switch (request.type) {
            // ✅ DAILY MISSION HANDLERS
            case 'GET_MISSION':
                console.log('✅ Handling GET_MISSION');
                result = await getTodayMission();
                break;

            case 'CHECK_MISSION_STATUS':
                console.log('✅ Handling CHECK_MISSION_STATUS');
                result = await checkAndCreateDailyMission(request.force);
                break;

            // ✅ PROBLEM COMPLETION HANDLERS
            case 'PROBLEM_COMPLETED':
                console.log('✅ Handling PROBLEM_COMPLETED:', request.problemId);
                result = await handleProblemCompleted(request.problemId);
                break;

            case 'PROBLEM_ATTEMPTED':
                console.log('✅ Handling PROBLEM_ATTEMPTED:', request.problemId);
                result = await handleProblemAttempted(request.problemId);
                break;

            // ✅ BONUS PROBLEM HANDLERS - NEW!
            case 'GET_BONUS_PROBLEMS':
                console.log('✅ Handling GET_BONUS_PROBLEMS');
                result = await getBonusProblems(request.topic, request.count || 3);
                break;

            case 'COMPLETE_BONUS_PROBLEM':
                console.log('✅ Handling COMPLETE_BONUS_PROBLEM:', request.problemId);
                result = await completeBonusProblem(request.problemId);
                break;

            // ✅ DASHBOARD DATA HANDLERS
            case 'GET_DASHBOARD_DATA':
                console.log('✅ Handling GET_DASHBOARD_DATA');
                result = await getDashboardData();
                break;

            case 'DEBUG_GET_SEQUENCE':
                const profile = await storage.getUserProfile();
                result = {
                    currentIndex: profile.currentProblemIndex,
                    completedCount: profile.completedProblemIds?.length || 0
                };
                break;

            case 'PROBLEM_PAGE_VISITED':
                console.log('Problem page visited:', request.slug);
                result = { success: true };
                break;

            case 'UPDATE_REMINDER':
                console.log('✅ Handling UPDATE_REMINDER');
                result = await updateReminder(request.enabled, request.time);
                break;

            case 'TEST_NOTIFICATION':
                console.log('✅ Handling TEST_NOTIFICATION');
                result = await sendTestNotification(request.title, request.message);
                break;

            case 'REROLL_PROBLEMS':
                console.log('✅ Handling REROLL_PROBLEMS');
                result = await rerollProblems();
                break;

            case 'SKIP_MISSION':
                console.log('✅ Handling SKIP_MISSION');
                result = await skipMission();
                break;

            case 'TEST_GEMINI_API':
                console.log('✅ Handling TEST_GEMINI_API');
                result = await testGeminiAPI(request.apiKey);
                break;

            case 'UPDATE_BLOCKERS':
                console.log('✅ Handling UPDATE_BLOCKERS');
                const mission = await storage.getTodayMission();
                await updateSiteBlockers(mission);
                result = { success: true };
                break;

            default:
                console.error('❌ Unknown message type:', request.type);
                result = { error: 'Unknown message type: ' + request.type };
        }

        sendResponse(result);
    } catch (error) {
        console.error('❌ Message handler error:', error);
        sendResponse({ error: error.message });
    }
}

// ============================================
// DAILY MISSION FUNCTIONS
// ============================================

async function getTodayMission() {
    console.log('Getting today mission...');

    let mission = await storage.getTodayMission();
    const today = new Date().toISOString().split('T')[0];

    if (!mission || !mission.problems || mission.problems.length === 0 || mission.date !== today) {
        console.log('Creating new mission...');
        const profile = await storage.getUserProfile();
        mission = await problemService.assignDailyProblems(profile);
        await updateSiteBlockers(mission);
    }

    console.log('Returning mission:', mission);
    return mission;
}

async function checkAndCreateDailyMission(force = false) {
    console.log('Checking mission status, force:', force);

    const profile = await storage.getUserProfile();
    const today = new Date().toISOString().split('T')[0];

    let mission = await storage.getTodayMission();

    if (force || !mission || !mission.date || mission.date !== today) {
        console.log('Creating new daily mission...');

        if (mission && mission.problems && mission.problems.every(p => p.status === 'COMPLETED')) {
            await updateStreak(profile);
        } else if (mission && mission.date && mission.date !== today) {
            profile.currentStreak = 0;
            await storage.saveUserProfile(profile);
        }

        mission = await problemService.assignDailyProblems(profile);
        console.log('New mission created:', mission);
    }

    await updateSiteBlockers(mission);
    return mission;
}

// ============================================
// PROBLEM COMPLETION FUNCTIONS
// ============================================

async function handleProblemCompleted(problemId) {
    console.log('Problem completed:', problemId);

    const profile = await storage.getUserProfile();
    const result = await problemService.markProblemCompleted(problemId, profile);

    if (result.success) {
        const mission = await storage.getTodayMission();
        if (mission?.problems) {
            const problem = mission.problems.find(p => parseInt(p.id) === parseInt(problemId));
            if (problem) {
                problem.status = 'COMPLETED';
                await storage.saveTodayMission(mission);
            }
        }

        const updatedMission = await storage.getTodayMission();
        await updateSiteBlockers(updatedMission);

        // Check if all daily problems are complete - suggest bonus
        const allDailyComplete = updatedMission?.problems?.every(p => p.status === 'COMPLETED');
        if (allDailyComplete) {
            const completedTopics = [...new Set(updatedMission.problems.map(p => p.topic))];
            return {
                ...result,
                dailyComplete: true,
                suggestedTopics: completedTopics
            };
        }
    }

    return result;
}

async function handleProblemAttempted(problemId) {
    console.log('Problem attempted:', problemId);

    const profile = await storage.getUserProfile();
    if (!profile.attemptedProblemIds.includes(parseInt(problemId))) {
        profile.attemptedProblemIds.push(parseInt(problemId));
        await storage.saveUserProfile(profile);
    }

    const mission = await storage.getTodayMission();
    if (mission?.problems) {
        const problem = mission.problems.find(p => parseInt(p.id) === parseInt(problemId));
        if (problem && problem.status === 'NOT_STARTED') {
            problem.status = 'ATTEMPTED';
            await storage.saveTodayMission(mission);
        }
    }

    return { success: true };
}

// ============================================
// BONUS PROBLEM FUNCTIONS - NEW!
// ============================================

async function getBonusProblems(topic = null, count = 3) {
    console.log('Getting bonus problems, topic:', topic, 'count:', count);

    const profile = await storage.getUserProfile();
    const data = await problemService.getProblems();
    const allProblems = problemService.getAllProblemsFlat(data);

    const completedIds = (profile.completedProblemIds || []).map(id => parseInt(id));
    let pool = allProblems.filter(p => !completedIds.includes(parseInt(p.id)));

    // Filter by topic if specified
    if (topic) {
        pool = pool.filter(p => {
            const pTopic = (p.topic || '').toLowerCase();
            return pTopic.includes(topic.toLowerCase());
        });
    }

    // If not enough problems in topic, fill with random from same difficulty
    if (pool.length < count && topic) {
        const mission = await storage.getTodayMission();
        const lastDifficulty = mission?.problems?.[0]?.difficulty || 'Easy';

        const difficultyPool = allProblems.filter(p =>
            !completedIds.includes(parseInt(p.id)) &&
            p.difficulty?.toLowerCase() === lastDifficulty.toLowerCase()
        );

        pool = [...pool, ...difficultyPool].slice(0, count);
    }

    // Select random problems
    const selected = [];
    const shuffled = pool.sort(() => 0.5 - Math.random());

    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
        selected.push(shuffled[i]);
    }

    console.log('Bonus problems selected:', selected.length);

    return {
        problems: selected.map(p => ({
            ...p,
            status: 'NOT_STARTED',
            isBonus: true
        })),
        message: getMotivationalMessage(selected.length)
    };
}

async function completeBonusProblem(problemId) {
    console.log('Bonus problem completed:', problemId);

    const profile = await storage.getUserProfile();
    const problem = await problemService.getProblemById(problemId);

    if (!problem) {
        return { success: false, error: 'Problem not found' };
    }

    // Add to completed problems
    const problemIdNum = parseInt(problemId);
    if (!profile.completedProblemIds.includes(problemIdNum)) {
        profile.completedProblemIds.push(problemIdNum);
    }

    // Calculate bonus XP (1.5x multiplier)
    const baseXP = problemService.getXPForDifficulty(problem.difficulty);
    const bonusXP = Math.floor(baseXP * 1.5);

    profile.xp = (profile.xp || 0) + bonusXP;
    profile.demonsDefeated = (profile.demonsDefeated || 0) + 1;

    // Level up check
    if (profile.xp >= profile.xpToNextLevel) {
        profile.level += 1;
        profile.xp = profile.xp - profile.xpToNextLevel;
        profile.xpToNextLevel = Math.floor(profile.xpToNextLevel * 1.5);
    }

    // Update topic stats
    if (problem.topic) {
        if (!profile.topicStats[problem.topic]) {
            profile.topicStats[problem.topic] = { completed: 0, attempts: 0 };
        }
        profile.topicStats[problem.topic].completed += 1;
    }

    await storage.saveUserProfile(profile);

    console.log('Bonus XP awarded:', bonusXP);

    return {
        success: true,
        xpGain: bonusXP,
        message: `🎯 Bonus Victory! +${bonusXP} XP (1.5x multiplier!)`
    };
}

function getMotivationalMessage(count) {
    const messages = [
        `🔥 ${count} bonus demons await! Extra XP for the dedicated!`,
        `⚡ True warriors never stop! ${count} more challenges ready!`,
        `💪 Push your limits! ${count} bonus problems for extra glory!`,
        `🌟 Legendary developers practice extra! ${count} problems available!`,
        `🎯 Mastery requires repetition! ${count} more problems to conquer!`
    ];
    return messages[Math.floor(Math.random() * messages.length)];
}

// ============================================
// SITE BLOCKING FUNCTIONS
// ============================================
async function initializeBlockers() {
    console.log('🔒 Initializing blockers on extension load...');

    const mission = await storage.getTodayMission();
    const today = new Date().toISOString().split('T')[0];

    // Check if mission is from today
    if (mission && mission.date === today) {
        await updateSiteBlockers(mission);
    } else {
        // No valid mission - block sites until mission is created
        await updateSiteBlockers({ problems: [{ status: 'NOT_STARTED' }] });
    }
}

/**
 * Helper: Toggle the static ruleset (rules.json) on or off.
 * This is required because static rules are independent of dynamic rules
 * and will keep blocking even if all dynamic rules are removed.
 */
async function setStaticRulesetEnabled(enabled) {
    try {
        if (enabled) {
            await chrome.declarativeNetRequest.updateEnabledRulesets({
                enableRulesetIds: ['ruleset_1']
            });
            console.log('✅ Static ruleset ENABLED');
        } else {
            await chrome.declarativeNetRequest.updateEnabledRulesets({
                disableRulesetIds: ['ruleset_1']
            });
            console.log('✅ Static ruleset DISABLED');
        }
    } catch (error) {
        console.error('❌ Error toggling static ruleset:', error);
    }
}


async function updateSiteBlockers(mission) {
    console.log('🔒 Updating site blockers...');

    // ✅ FIX: Only consider DAILY problems for blocking (not bonus problems)
    const dailyProblems = (mission?.problems || []).filter(p => !p.isBonus);
    const allCompleted = dailyProblems.length > 0 && dailyProblems.every(p => p.status === 'COMPLETED');
    const noMission = !mission || !mission.problems || mission.problems.length === 0;

    console.log('Daily problems count:', dailyProblems.length);
    console.log('All daily completed:', allCompleted);
    console.log('No mission:', noMission);

    if (allCompleted || noMission) {
        // UNBLOCK - Remove all dynamic rules AND disable static ruleset
        console.log('✅ Unblocking all sites');

        try {
            // ✅ FIX: Disable the static ruleset from rules.json
            await setStaticRulesetEnabled(false);

            // Remove dynamic rules
            const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
            const ruleIds = currentRules.map(rule => rule.id);

            if (ruleIds.length > 0) {
                await chrome.declarativeNetRequest.updateDynamicRules({
                    removeRuleIds: ruleIds,
                    addRules: []
                });
                console.log('✅ Removed', ruleIds.length, 'dynamic blocking rules');
            }

            // Store blocking state
            await storage.set('sitesBlocked', false);

        } catch (error) {
            console.error('❌ Error unblocking sites:', error);
        }
    } else {
        // BLOCK - Add dynamic rules AND enable static ruleset
        console.log('🚫 Blocking social sites');

        try {
            // ✅ FIX: Enable the static ruleset from rules.json
            await setStaticRulesetEnabled(true);

            // Add dynamic rules
            const rules = BLOCKED_SITES.map((site, index) => ({
                id: index + 100, // Start from 100 to avoid conflict with static rules
                priority: 1,
                action: {
                    type: 'redirect',
                    redirect: {
                        extensionPath: '/pages/focus.html'
                    }
                },
                condition: {
                    urlFilter: `*://${site}/*`,
                    resourceTypes: ['main_frame']
                }
            }));

            // Remove existing dynamic rules first
            const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
            const ruleIds = currentRules.map(rule => rule.id);

            await chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: ruleIds,
                addRules: rules
            });

            console.log('✅ Added', rules.length, 'dynamic blocking rules');

            // Store blocking state
            await storage.set('sitesBlocked', true);

        } catch (error) {
            console.error('❌ Error blocking sites:', error);
        }
    }
}

// ============================================
// STREAK & RANK FUNCTIONS
// ============================================

async function updateStreak(profile) {
    const today = new Date().toISOString().split('T')[0];

    if (profile.lastPracticeDate === today) {
        return profile.currentStreak;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (profile.lastPracticeDate === yesterdayStr) {
        profile.currentStreak = (profile.currentStreak || 0) + 1;
    } else {
        profile.currentStreak = 1;
    }

    profile.longestStreak = Math.max(profile.longestStreak || 0, profile.currentStreak);
    profile.lastPracticeDate = today;
    profile.rank = calculateRank(profile.currentStreak);

    await storage.saveUserProfile(profile);
    console.log('Streak updated:', profile.currentStreak);
    return profile.currentStreak;
}

function calculateRank(streak) {
    const RANKS = [
        { name: 'Trainee', minDays: 0 },
        { name: 'Ninja Initiate', minDays: 7 },
        { name: 'Shadow Ninja', minDays: 14 },
        { name: 'Demon Hunter', minDays: 30 },
        { name: 'Elite Slayer', minDays: 60 },
        { name: 'Master Ninja', minDays: 100 },
        { name: 'Hashira Developer', minDays: 180 },
        { name: 'Legendary Developer', minDays: 365 }
    ];

    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (streak >= RANKS[i].minDays) {
            return RANKS[i].name;
        }
    }
    return RANKS[0].name;
}

async function resetDailyMission() {
    const profile = await storage.getUserProfile();
    const today = new Date().toISOString().split('T')[0];

    const mission = await storage.getTodayMission();
    if (mission && mission.date) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (mission.date === yesterdayStr) {
            if (!mission.problems.every(p => p.status === 'COMPLETED')) {
                profile.currentStreak = 0;
                await storage.saveUserProfile(profile);
                console.log('Streak broken!');
            }
        }
    }

    await problemService.assignDailyProblems(profile);
}

async function getDashboardData() {
    const profile = await storage.getUserProfile();
    const mission = await getTodayMission();
    const story = await geminiService.getDailyStory();

    return { profile, mission, story };
}

// ============================================
// REMINDER FUNCTIONS
// ============================================

async function initializeReminderOnLoad() {
    console.log('🔔 Initializing reminder on extension load...');

    const settings = await storage.get('settings') || {};

    if (settings.reminderEnabled && settings.reminderTime) {
        // Recreate alarm
        await updateReminder(true, settings.reminderTime);
        console.log('✅ Reminder alarm restored for', settings.reminderTime);
    } else {
        console.log('ℹ️ Reminder disabled or no time set');
    }
}

async function updateReminder(enabled, time) {
    if (enabled) {
        // Clear existing alarm
        await chrome.alarms.clear('reminder-alarm');

        // Create new alarm
        const [hours, minutes] = time.split(':');
        const now = new Date();
        const alarmTime = new Date();
        alarmTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // If time already passed today, schedule for tomorrow
        if (alarmTime < now) {
            alarmTime.setDate(alarmTime.getDate() + 1);
        }

        // Calculate delay in minutes
        const delayMinutes = (alarmTime - now) / 1000 / 60;

        // Create daily alarm at specified time
        chrome.alarms.create('reminder-alarm', {
            delayInMinutes: delayMinutes,
            periodInMinutes: 1440 // Daily
        });

        console.log('Reminder set for:', time);
        return { success: true, message: 'Reminder scheduled' };
    } else {
        await chrome.alarms.clear('reminder-alarm');
        console.log('Reminder disabled');
        return { success: true, message: 'Reminder disabled' };
    }
}

async function sendTestNotification(title, message) {
    try {
        await chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('assets/icon128.png'),
            title: title,
            message: message
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================
// MISSION ACTION FUNCTIONS
// ============================================

async function rerollProblems() {
    try {
        const profile = await storage.getUserProfile();
        const data = await problemService.getProblems();
        const allProblems = problemService.getAllProblemsFlat(data);

        // Get current mission topics
        const mission = await storage.getTodayMission();
        const currentTopics = mission?.problems?.map(p => p.topic) || [];

        // Filter problems by same topics, exclude completed
        const completedIds = (profile.completedProblemIds || []).map(id => parseInt(id));
        const pool = allProblems.filter(p =>
            currentTopics.includes(p.topic) &&
            !completedIds.includes(parseInt(p.id))
        );

        if (pool.length < 2) {
            return { success: false, error: 'Not enough problems available for reroll' };
        }

        // Select 2 random problems
        const shuffled = pool.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 2);

        // Update mission
        const today = new Date().toISOString().split('T')[0];
        const newMission = {
            date: today,
            problems: selected.map(p => ({
                ...p,
                status: 'NOT_STARTED'
            })),
            rerolled: true
        };

        await storage.saveTodayMission(newMission);

        // Reset problem index for this session
        profile.currentProblemIndex = 0;
        await storage.saveUserProfile(profile);

        return { success: true, message: 'Problems rerolled successfully' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function skipMission() {
    try {
        const profile = await storage.getUserProfile();
        const today = new Date().toISOString().split('T')[0];

        // Mark today as practiced (preserve streak)
        profile.lastPracticeDate = today;
        await storage.saveUserProfile(profile);

        // Clear today's mission
        await storage.saveTodayMission({
            date: today,
            problems: [],
            skipped: true
        });

        // Unblock sites
        await updateSiteBlockers({ problems: [] });

        return { success: true, message: 'Mission skipped successfully' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function testGeminiAPI(apiKey) {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: 'Say "API working" if you can read this' }] }]
                })
            }
        );

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (text) {
            return { success: true };
        } else {
            return { success: false, error: 'No response from API' };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

console.log('✅ All message handlers registered');
console.log('✅ Available message types: GET_MISSION, CHECK_MISSION_STATUS, PROBLEM_COMPLETED, PROBLEM_ATTEMPTED, GET_BONUS_PROBLEMS, COMPLETE_BONUS_PROBLEM, GET_DASHBOARD_DATA');