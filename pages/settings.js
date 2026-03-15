/**
 * pages/settings.js - Settings Page Controller
 */
import { storage } from '../utils/storage.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('⚙️ Settings page loaded');

    // Load current settings
    await loadSettings();
    await loadUserProfile();

    // Setup tab navigation
    setupTabs();

    // Setup event listeners
    setupEventListeners();
});

// ============================================
// TAB NAVIGATION
// ============================================

function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;

            // Remove active class from all
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));

            // Add active class to selected
            btn.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Back button
    document.getElementById('btn-back')?.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });

    // Reminder settings
    document.getElementById('btn-save-reminder')?.addEventListener('click', saveReminderSettings);
    document.getElementById('btn-test-reminder')?.addEventListener('click', testReminder);

    // Personalization
    document.getElementById('btn-save-personalization')?.addEventListener('click', savePersonalization);

    // Theme selection
    document.querySelectorAll('.theme-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.theme-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
        });
    });

    // Avatar selection
    document.querySelectorAll('.avatar-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
        });
    });

    // Mission actions
    document.getElementById('btn-reroll-problem')?.addEventListener('click', rerollProblem);
    document.getElementById('btn-skip-mission')?.addEventListener('click', skipMission);

    // API settings
    document.getElementById('btn-save-api')?.addEventListener('click', saveAPISettings);
    document.getElementById('btn-test-api')?.addEventListener('click', testAPIConnection);
}

// ============================================
// LOAD SETTINGS
// ============================================

async function loadSettings() {
    const settings = await storage.get('settings') || {};

    // Reminder settings
    document.getElementById('reminderEnabled').checked = settings.reminderEnabled ?? false;
    document.getElementById('reminderTime').value = settings.reminderTime ?? '20:00';
    document.getElementById('reminderMessage').value = settings.reminderMessage ?? '⚔ Your demons are waiting. Complete today\'s mission!';

    // Personalization
    const selectedTheme = settings.theme ?? 'dark-ninja';
    document.querySelector(`.theme-option[data-theme="${selectedTheme}"]`)?.classList.add('selected');

    const selectedAvatar = settings.avatar ?? 'shadow-ninja';
    document.querySelector(`.avatar-option[data-avatar="${selectedAvatar}"]`)?.classList.add('selected');

    // API settings
    document.getElementById('geminiApiKey').value = settings.geminiKey ?? '';

    // Update schedule preview
    updateSchedulePreview(settings.reminderTime ?? '20:00', settings.reminderEnabled ?? false);
}

async function loadUserProfile() {
    const profile = await storage.getUserProfile();

    document.getElementById('currentXP').textContent = profile.xp || 0;

    // Calculate available rerolls and skips (max 3 rerolls, 2 skips per week)
    const weeklyUsage = profile.weeklyUsage || { rerolls: 0, skips: 0 };
    const rerollsAvailable = Math.max(0, 3 - weeklyUsage.rerolls);
    const skipsAvailable = Math.max(0, 2 - weeklyUsage.skips);

    document.getElementById('rerollsAvailable').textContent = rerollsAvailable;
    document.getElementById('skipsAvailable').textContent = skipsAvailable;
}

// ============================================
// REMINDER SETTINGS
// ============================================

async function saveReminderSettings() {
    const enabled = document.getElementById('reminderEnabled').checked;
    const time = document.getElementById('reminderTime').value;
    const message = document.getElementById('reminderMessage').value;

    const settings = await storage.get('settings') || {};
    settings.reminderEnabled = enabled;
    settings.reminderTime = time;
    settings.reminderMessage = message;

    await storage.set('settings', settings);

    // Update alarm in background script
    await chrome.runtime.sendMessage({
        type: 'UPDATE_REMINDER',
        enabled: enabled,
        time: time
    });

    showStatus('reminder-status', '✅ Reminder settings saved successfully!', 'success');
    updateSchedulePreview(time, enabled);
}

async function testReminder() {
    const message = document.getElementById('reminderMessage').value || '⚔ Your demons are waiting!';

    await chrome.runtime.sendMessage({
        type: 'TEST_NOTIFICATION',
        title: '🧪 Test Reminder',
        message: message
    });

    showStatus('reminder-status', '🔔 Test notification sent! Check your system notifications.', 'info');
}

function updateSchedulePreview(time, enabled) {
    const nextReminder = document.getElementById('nextReminderTime');

    if (enabled) {
        const [hours, minutes] = time.split(':');
        const now = new Date();
        const reminderTime = new Date();
        reminderTime.setHours(parseInt(hours), parseInt(minutes), 0);

        if (now > reminderTime) {
            reminderTime.setDate(reminderTime.getDate() + 1);
        }

        const formatted = reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        nextReminder.textContent = formatted;
    } else {
        nextReminder.textContent = 'Disabled';
    }
}

// ============================================
// PERSONALIZATION SETTINGS
// ============================================

async function savePersonalization() {
    const selectedTheme = document.querySelector('.theme-option.selected')?.dataset.theme || 'dark-ninja';
    const selectedAvatar = document.querySelector('.avatar-option.selected')?.dataset.avatar || 'shadow-ninja';

    const settings = await storage.get('settings') || {};
    settings.theme = selectedTheme;
    settings.avatar = selectedAvatar;

    await storage.set('settings', settings);

    // ✅ Apply theme immediately to current page
    applyTheme(selectedTheme);

    // ✅ Show confirmation with avatar preview
    const avatarIcons = {
        'dragon-slayer': '🐉',
        'shadow-ninja': '⚔️',
        'demon-hunter': '🔥',
        'code-samurai': '🥷'
    };

    showStatus('personalization-status',
        `✅ Personalization saved! Theme: ${selectedTheme} | Avatar: ${avatarIcons[selectedAvatar]} ${selectedAvatar.replace('-', ' ').toUpperCase()}`,
        'success');
}

// function applyTheme(theme) {
//     const root = document.documentElement;

//     switch (theme) {
//         case 'dark-ninja':
//             root.style.setProperty('--bg-primary', '#0a0a0a');
//             root.style.setProperty('--accent-primary', '#ff4757');
//             root.style.setProperty('--accent-secondary', '#ffa502');
//             break;
//         case 'cyberpunk':
//             root.style.setProperty('--bg-primary', '#0f0c29');
//             root.style.setProperty('--accent-primary', '#ff00ff');
//             root.style.setProperty('--accent-secondary', '#00ffff');
//             break;
//         case 'minimal':
//             root.style.setProperty('--bg-primary', '#ffffff');
//             root.style.setProperty('--bg-secondary', '#f5f5f5');
//             root.style.setProperty('--bg-card', '#eeeeee');
//             root.style.setProperty('--text-primary', '#000000');
//             root.style.setProperty('--text-secondary', '#666666');
//             root.style.setProperty('--accent-primary', '#0066cc');
//             root.style.setProperty('--accent-secondary', '#00aa66');
//             break;
//     }
// }

// ============================================
// MISSION ACTIONS
// ============================================

async function rerollProblem() {
    const profile = await storage.getUserProfile();
    const currentXP = profile.xp || 0;
    const rerollCost = 50;

    if (currentXP < rerollCost) {
        showStatus('mission-actions-status', `❌ Insufficient XP! Need ${rerollCost} XP, you have ${currentXP} XP.`, 'error');
        return;
    }

    // Check weekly limit
    const weeklyUsage = profile.weeklyUsage || { rerolls: 0, skips: 0 };
    if (weeklyUsage.rerolls >= 3) {
        showStatus('mission-actions-status', '❌ Weekly reroll limit reached (3/3). Try again next week!', 'error');
        return;
    }

    const confirmed = confirm(`🔄 Reroll Today's Problems?\n\nCost: ${rerollCost} XP\n\nYou'll get 2 new problems from the same topic.`);

    if (confirmed) {
        const result = await chrome.runtime.sendMessage({
            type: 'REROLL_PROBLEMS',
            cost: rerollCost
        });

        if (result.success) {
            // Update weekly usage
            profile.xp -= rerollCost;
            profile.weeklyUsage = profile.weeklyUsage || { rerolls: 0, skips: 0 };
            profile.weeklyUsage.rerolls += 1;
            await storage.saveUserProfile(profile);

            showStatus('mission-actions-status', '✅ Problems rerolled! Check your dashboard for new demons.', 'success');

            // Update stats display
            document.getElementById('currentXP').textContent = profile.xp;
            document.getElementById('rerollsAvailable').textContent = 3 - profile.weeklyUsage.rerolls;
        } else {
            showStatus('mission-actions-status', `❌ Failed to reroll: ${result.error}`, 'error');
        }
    }
}

async function skipMission() {
    const profile = await storage.getUserProfile();
    const currentXP = profile.xp || 0;
    const skipCost = 100;

    if (currentXP < skipCost) {
        showStatus('mission-actions-status', `❌ Insufficient XP! Need ${skipCost} XP, you have ${currentXP} XP.`, 'error');
        return;
    }

    // Check weekly limit
    const weeklyUsage = profile.weeklyUsage || { rerolls: 0, skips: 0 };
    if (weeklyUsage.skips >= 2) {
        showStatus('mission-actions-status', '❌ Weekly skip limit reached (2/2). Try again next week!', 'error');
        return;
    }

    const confirmed = confirm(`⏭️ Skip Today's Mission?\n\nCost: ${skipCost} XP\n\nYour streak will be preserved, but you won't earn XP for today.`);

    if (confirmed) {
        const result = await chrome.runtime.sendMessage({
            type: 'SKIP_MISSION',
            cost: skipCost
        });

        if (result.success) {
            // Update weekly usage
            profile.xp -= skipCost;
            profile.weeklyUsage = profile.weeklyUsage || { rerolls: 0, skips: 0 };
            profile.weeklyUsage.skips += 1;
            profile.lastPracticeDate = new Date().toISOString().split('T')[0]; // Mark as practiced
            await storage.saveUserProfile(profile);

            showStatus('mission-actions-status', '✅ Mission skipped! Streak preserved. Return tomorrow!', 'success');

            // Update stats display
            document.getElementById('currentXP').textContent = profile.xp;
            document.getElementById('skipsAvailable').textContent = 2 - profile.weeklyUsage.skips;
        } else {
            showStatus('mission-actions-status', `❌ Failed to skip: ${result.error}`, 'error');
        }
    }
}

// ============================================
// API SETTINGS
// ============================================

async function saveAPISettings() {
    const apiKey = document.getElementById('geminiApiKey').value.trim();

    if (!apiKey) {
        showStatus('api-status', '❌ Please enter a valid API key.', 'error');
        return;
    }

    const settings = await storage.get('settings') || {};
    settings.geminiKey = apiKey;

    await storage.set('settings', settings);

    showStatus('api-status', '✅ API key saved successfully!', 'success');
}

async function testAPIConnection() {
    const apiKey = document.getElementById('geminiApiKey').value.trim();

    if (!apiKey) {
        showStatus('api-status', '❌ Please enter an API key first.', 'error');
        return;
    }

    showStatus('api-status', '🔄 Testing connection...', 'info');

    const result = await chrome.runtime.sendMessage({
        type: 'TEST_GEMINI_API',
        apiKey: apiKey
    });

    if (result.success) {
        showStatus('api-status', '✅ API connection successful! AI features enabled.', 'success');
    } else {
        showStatus('api-status', `❌ API connection failed: ${result.error}`, 'error');
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showStatus(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.className = `status-message ${type}`;

        // Auto-hide after 5 seconds
        setTimeout(() => {
            element.className = 'status-message';
        }, 5000);
    }
}

function applyTheme(theme) {
    const root = document.documentElement;

    switch (theme) {
        case 'dark-ninja':
            root.style.setProperty('--bg-primary', '#0a0a0a');
            root.style.setProperty('--bg-secondary', '#121212');
            root.style.setProperty('--bg-card', '#1a1a1a');
            root.style.setProperty('--text-primary', '#ffffff');
            root.style.setProperty('--text-secondary', '#a0a0a0');
            root.style.setProperty('--accent-primary', '#ff4757');
            root.style.setProperty('--accent-secondary', '#ffa502');
            break;
        case 'cyberpunk':
            root.style.setProperty('--bg-primary', '#0f0c29');
            root.style.setProperty('--bg-secondary', '#302b63');
            root.style.setProperty('--bg-card', '#24243e');
            root.style.setProperty('--text-primary', '#ffffff');
            root.style.setProperty('--text-secondary', '#b0b0b0');
            root.style.setProperty('--accent-primary', '#ff00ff');
            root.style.setProperty('--accent-secondary', '#00ffff');
            break;
        case 'minimal':
            root.style.setProperty('--bg-primary', '#ffffff');
            root.style.setProperty('--bg-secondary', '#f5f5f5');
            root.style.setProperty('--bg-card', '#eeeeee');
            root.style.setProperty('--text-primary', '#000000');
            root.style.setProperty('--text-secondary', '#666666');
            root.style.setProperty('--accent-primary', '#0066cc');
            root.style.setProperty('--accent-secondary', '#00aa66');
            break;
    }
}