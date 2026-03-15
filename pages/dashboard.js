/**
 * pages/dashboard.js - Code Slayer Dashboard
 * Version: 3.0.0 - With Bonus Problems & Button Validation
 */
import { storage } from '../utils/storage.js';
import { geminiService } from '../services/geminiService.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🥷 Dashboard loading...');
    await loadAndApplyTheme();

    // Check if onboarding is complete
    const profile = await storage.getUserProfile();
    console.log('Profile:', profile);

    if (!profile.onboardingComplete) {
        console.log('Onboarding not complete, redirecting...');
        window.location.href = 'onboarding.html';
        return;
    }

    // ✅ Auto-load all dashboard sections
    await checkAndUpdateBlockers();
    await loadProfile();
    await loadMission();
    await loadPerformance();
    await loadStory();

    // Event listeners
    document.getElementById('btn-hide-guide')?.addEventListener('click', async () => {
        document.getElementById('beginnerGuide').style.display = 'none';
        await storage.set('hideBeginnerGuide', true);
    });

    document.getElementById('btn-reset')?.addEventListener('click', async () => {
        if (confirm("This will erase your entire journey! Are you sure, Master?")) {
            await storage.clear();
            window.location.href = 'onboarding.html';
        }
    });

    document.getElementById('btn-settings')?.addEventListener('click', () => {
        window.location.href = 'settings.html';
    });

    // ✅ Add event listeners for new buttons
    document.getElementById('btn-reroll-problem')?.addEventListener('click', async () => {
        if (confirm('Reroll today\'s problems? This uses 1 reroll charge.')) {
            const result = await chrome.runtime.sendMessage({ type: 'REROLL_PROBLEMS' });
            if (result.success) {
                alert(result.message);
                loadMission(); // Reload mission
                loadProfile(); // Update XP/stats
            } else {
                alert('Error: ' + result.error);
            }
        }
    });

    document.getElementById('btn-skip-mission')?.addEventListener('click', async () => {
        if (confirm('Skip today\'s mission? This uses 1 skip charge.')) {
            const result = await chrome.runtime.sendMessage({ type: 'SKIP_MISSION' });
            if (result.success) {
                alert(result.message);
                loadMission(); // Reload mission
                loadProfile(); // Update XP/stats
            } else {
                alert('Error: ' + result.error);
            }
        }
    });
});

async function updateBlockingIndicator() {
    const indicator = document.getElementById('blockingIndicator');
    if (!indicator) return;

    const mission = await chrome.runtime.sendMessage({ type: 'GET_MISSION' });
    const allCompleted = mission?.problems?.every(p => p.status === 'COMPLETED');

    if (allCompleted) {
        indicator.style.display = 'none';
        // Or show unblocked message:
        // indicator.className = 'blocking-indicator unblocked';
        // indicator.innerHTML = '<span class="indicator-icon">✅</span><span class="indicator-text">All sites unlocked!</span>';
    } else {
        indicator.style.display = 'flex';
    }
}

async function loadAndApplyTheme() {
    const settings = await storage.get('settings') || {};
    const theme = settings.theme || 'dark-ninja';
    applyTheme(theme);
    console.log('Theme applied:', theme);
}

async function checkAndUpdateBlockers() {
    const mission = await chrome.runtime.sendMessage({ type: 'GET_MISSION' });
    const allCompleted = mission?.problems?.every(p => p.status === 'COMPLETED');

    console.log('Dashboard checking blockers. All completed:', allCompleted);

    // Notify background to update blockers
    await chrome.runtime.sendMessage({
        type: 'UPDATE_BLOCKERS',
        allCompleted: allCompleted
    });
}

function applyTheme(theme) {
    const root = document.documentElement;
    document.body.setAttribute('data-theme', theme);

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

// ============================================
// PROFILE SECTION
// ============================================

async function loadProfile() {
    const profile = await storage.getUserProfile();
    const settings = await storage.get('settings') || {};

    // ✅ LOAD AVATAR
    const avatar = settings.avatar || 'shadow-ninja';
    const avatarIcons = {
        'dragon-slayer': '🐉',
        'shadow-ninja': '⚔️',
        'demon-hunter': '🔥',
        'code-samurai': '🥷'
    };
    const avatarIcon = avatarIcons[avatar] || '⚔️';

    // Set avatar in both locations
    document.getElementById('userAvatar').textContent = avatarIcon;
    document.getElementById('rankAvatar').textContent = avatarIcon;

    // Set avatar title
    const avatarTitles = {
        'dragon-slayer': 'Dragon Slayer',
        'shadow-ninja': 'Shadow Ninja',
        'demon-hunter': 'Demon Hunter',
        'code-samurai': 'Code Samurai'
    };
    const avatarTitle = avatarTitles[avatar] || 'Shadow Ninja';

    document.querySelectorAll('.avatar-label').forEach(el => {
        el.textContent = avatarTitle;
    });

    // Rest of profile loading
    document.getElementById('rankName').textContent = profile.rank || 'Trainee';
    document.getElementById('levelNum').textContent = `Level ${profile.level || 1}`;
    document.getElementById('streakVal').textContent = profile.currentStreak || 0;
    document.getElementById('defeatedVal').textContent = profile.demonsDefeated || 0;
    document.getElementById('xpVal').textContent = profile.xp || 0;

    const nextLevelXP = profile.xpToNextLevel || 100;
    document.getElementById('xpTarget').textContent = `Target: ${nextLevelXP} XP`;

    const progressPercent = Math.min(100, ((profile.xp || 0) / nextLevelXP) * 100);
    document.getElementById('xpProgress').style.width = `${progressPercent}%`;

    const hideGuide = await storage.get('hideBeginnerGuide');
    if ((profile.rank || 'Trainee') === 'Trainee' && !hideGuide) {
        document.getElementById('beginnerGuide').style.display = 'block';
    }
}

// ============================================
// MISSION SECTION (DAILY PROBLEMS)
// ============================================

async function loadMission() {
    const missionList = document.getElementById('missionList');
    missionList.innerHTML = '<div class="loading">⚔️ Summoning demons...</div>';

    try {
        await updateBlockingIndicator();
        const mission = await chrome.runtime.sendMessage({ type: 'GET_MISSION' });

        console.log('📜 Mission loaded:', mission);

        if (!mission || !mission.problems || mission.problems.length === 0) {
            missionList.innerHTML = `
                <div class="empty-mission">
                    <p>👹 All demons defeated! New missions arrive at midnight.</p>
                </div>
            `;
            // Still check for bonus problems (in case they were working on bonus before)
            await loadBonusProblems();
            return;
        }

        missionList.innerHTML = '';

        mission.problems.forEach(p => {
            const item = document.createElement('div');
            item.className = `mission-item ${p.status.toLowerCase()}`;
            item.dataset.problemId = p.id;

            const statusIcon = p.status === 'COMPLETED' ? '✅' : (p.status === 'ATTEMPTED' ? '🎯' : '👹');

            // Determine button states based on status
            const isAttempted = p.status === 'ATTEMPTED';
            const isCompleted = p.status === 'COMPLETED';

            item.innerHTML = `
                <div class="mission-header">
                    <div class="mission-title">${statusIcon} ${p.label || p.title || 'Unknown Problem'}</div>
                    <span class="difficulty-badge ${p.difficulty?.toLowerCase() || 'easy'}">${p.difficulty || 'Easy'}</span>
                    <span class="status-badge ${p.status.toLowerCase()}">${p.status.replace('_', ' ')}</span>
                </div>
                <div class="mission-description">
                    <p>Topic: ${p.topic || 'General'}</p>
                </div>
                <div class="mission-actions">
                    <a href="${p.question || p.url || '#'}" 
                       target="_blank" 
                       class="btn-open ${isCompleted ? 'disabled' : ''}" 
                       data-id="${p.id}"
                       ${isCompleted ? 'style="pointer-events: none; opacity: 0.5;"' : ''}>
                        ⚔️ ${isCompleted ? 'BATTLE WON' : 'FIGHT DEMON'}
                    </a>
                    ${!isCompleted ? `
                        <button class="btn-complete ${isAttempted ? '' : 'disabled'}" 
                                data-id="${p.id}"
                                ${!isAttempted ? 'disabled title="You must fight the demon first!"' : ''}>
                            ${isAttempted ? '🏆 CLAIM VICTORY' : '🔒 FIGHT FIRST'}
                        </button>
                    ` : '<span class="victory-text">🎉 DEMON SLAIN!</span>'}
                </div>
            `;
            missionList.appendChild(item);
        });

        // Add click listeners for problem links (track attempts)
        document.querySelectorAll('.btn-open').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault(); // Prevent default until we track

                const problemId = e.target.dataset.id;
                const url = e.target.href;

                console.log('🎯 Problem link clicked:', problemId);

                // Record attempt first
                const resp = await chrome.runtime.sendMessage({
                    type: 'PROBLEM_ATTEMPTED',
                    problemId: problemId
                });
                console.log('Attempt recorded response:', resp);

                // Update button state immediately
                await updateButtonState(problemId, 'ATTEMPTED');

                // Then open the problem page
                window.open(url, '_blank');
            });
        });

        // Add completion listeners
        document.querySelectorAll('.btn-complete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const probId = e.target.dataset.id;

                // Double-check status before allowing completion
                const mission = await chrome.runtime.sendMessage({ type: 'GET_MISSION' });
                const problem = mission?.problems?.find(p => parseInt(p.id) === parseInt(probId));

                if (problem?.status !== 'ATTEMPTED') {
                    alert('⚠️ You must click "FIGHT DEMON" first!\n\nVisit the problem page before claiming victory.');
                    return;
                }

                const confirmed = confirm(
                    '⚔️ Have you truly defeated this demon?\n\n' +
                    'Only mark complete if you solved it yourself!\n\n' +
                    'Victory = XP + Streak Progress\n' +
                    'False claim = Honor lost'
                );

                if (confirmed) {
                    console.log('Marking as completed:', probId);

                    const result = await chrome.runtime.sendMessage({
                        type: 'PROBLEM_COMPLETED',
                        problemId: probId
                    });
                    console.log('Victory recorded response:', result);

                    if (result.success) {
                        const allComplete = await checkAllComplete();
                        if (allComplete) {
                            // Show bonus section after daily complete
                            await loadBonusProblems();

                            alert('🎉 ALL DEMONS DEFEATED!\n\nSites are now unblocked.\nBonus problems available for extra XP!');
                        }
                        location.reload();
                    } else {
                        alert('❌ Failed to record victory. Try again.');
                    }
                }
            });
        });

        // Load bonus problems if daily mission is complete
        await loadBonusProblems();

    } catch (error) {
        console.error('Error loading mission:', error);
        missionList.innerHTML = `
            <div class="empty-mission">
                <p>❌ Error loading mission: ${error.message}</p>
                <button id="btn-retry-mission" class="btn-primary">Retry</button>
            </div>
        `;

        document.getElementById('btn-retry-mission')?.addEventListener('click', () => {
            location.reload();
        });
    }
}

// ============================================
// BONUS PROBLEMS SECTION
// ============================================

async function loadBonusProblems() {
    const bonusSection = document.getElementById('bonusProblemsSection');

    if (!bonusSection) {
        console.log('Bonus section not found in DOM');
        return;
    }

    // Check if daily mission is complete
    const mission = await chrome.runtime.sendMessage({ type: 'GET_MISSION' });
    const allDailyComplete = mission?.problems?.every(p => p.status === 'COMPLETED');

    if (!allDailyComplete) {
        bonusSection.style.display = 'none';
        return;
    }

    bonusSection.style.display = 'block';
    bonusSection.innerHTML = '<div class="loading">🔥 Summoning bonus demons...</div>';

    try {
        // Get bonus problems based on completed topics
        const completedTopics = [...new Set(mission.problems.map(p => p.topic))];
        const primaryTopic = completedTopics[0];

        console.log('Requesting bonus problems for topic:', primaryTopic);

        const bonusData = await chrome.runtime.sendMessage({
            type: 'GET_BONUS_PROBLEMS',
            topic: primaryTopic,
            count: 3
        });

        console.log('Bonus data received:', bonusData);

        if (bonusData && bonusData.error) {
            throw new Error(bonusData.error);
        }

        if (!bonusData || !bonusData.problems || bonusData.problems.length === 0) {
            bonusSection.innerHTML = `
                <div class="bonus-header">
                    <h3>🔥 Continue Training</h3>
                    <p>No bonus problems available right now. Come back tomorrow!</p>
                </div>
            `;
            return;
        }

        bonusSection.innerHTML = `
            <div class="bonus-header">
                <h3>🔥 Continue Training - Bonus Problems</h3>
                <p>${bonusData.message || 'Extra challenges for dedicated warriors!'}</p>
            </div>
            <div class="bonus-list" id="bonusList"></div>
        `;

        const bonusList = document.getElementById('bonusList');

        bonusData.problems.forEach(p => {
            const item = document.createElement('div');
            item.className = 'mission-item bonus-item';
            item.dataset.problemId = p.id;
            item.dataset.isBonus = 'true';

            const xpReward = p.difficulty === 'Hard' ? '75' : (p.difficulty === 'Medium' ? '38' : '15');

            item.innerHTML = `
                <div class="mission-header">
                    <div class="mission-title">👹 ${p.label || p.title}</div>
                    <span class="difficulty-badge ${p.difficulty?.toLowerCase() || 'easy'}">${p.difficulty}</span>
                    <span class="bonus-badge">+${xpReward} XP (1.5x)</span>
                </div>
                <div class="mission-description">
                    <p>Topic: ${p.topic || 'General'}</p>
                </div>
                <div class="mission-actions">
                    <a href="${p.question || p.url || '#'}" 
                       target="_blank" 
                       class="btn-open btn-bonus" 
                       data-id="${p.id}">
                        ⚔️ FIGHT BONUS DEMON
                    </a>
                    <button class="btn-complete btn-bonus-complete disabled" 
                            data-id="${p.id}"
                            disabled 
                            title="You must fight the demon first!">
                        🔒 FIGHT FIRST
                    </button>
                </div>
            `;

            bonusList.appendChild(item);
        });

        // Add listeners for bonus problem links
        document.querySelectorAll('.btn-bonus').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();

                const problemId = e.target.dataset.id;
                const url = e.target.href;

                console.log('🎯 Bonus problem link clicked:', problemId);

                await chrome.runtime.sendMessage({
                    type: 'PROBLEM_ATTEMPTED',
                    problemId: problemId
                });

                // Enable the complete button
                await updateBonusButtonState(problemId, 'ATTEMPTED');

                // Open problem page
                window.open(url, '_blank');
            });
        });

        // Add completion listeners for bonus problems
        document.querySelectorAll('.btn-bonus-complete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const probId = e.target.dataset.id;

                const confirmed = confirm(
                    '⚔️ Bonus Challenge Complete?\n\n' +
                    'Earn 1.5x XP for extra dedication!\n\n' +
                    'This counts toward your total demons slain!'
                );

                if (confirmed) {
                    console.log('Marking bonus problem as completed:', probId);

                    const result = await chrome.runtime.sendMessage({
                        type: 'COMPLETE_BONUS_PROBLEM',
                        problemId: probId
                    });

                    console.log('Bonus victory response:', result);

                    if (result.success) {
                        alert(`🎉 ${result.message}\n\nKeep the momentum going!`);
                        loadBonusProblems(); // Reload to show remaining
                        loadProfile(); // Update XP display
                    } else {
                        alert('❌ Failed to record victory. Try again.');
                    }
                }
            });
        });

    } catch (error) {
        console.error('Error loading bonus problems:', error);
        bonusSection.innerHTML = `
            <div class="bonus-header">
                <h3>🔥 Continue Training</h3>
                <p>Daily mission complete! Ready for more?</p>
                <button id="btn-load-bonus" class="btn-primary">Show Bonus Problems</button>
            </div>
        `;

        document.getElementById('btn-load-bonus')?.addEventListener('click', () => {
            loadBonusProblems();
        });
    }
}

// ============================================
// BUTTON STATE MANAGEMENT
// ============================================

/**
 * Update daily problem button state when attempted
 */
async function updateButtonState(problemId, status) {
    const missionItem = document.querySelector(`.mission-item[data-problem-id="${problemId}"]`);
    if (!missionItem) {
        console.log('Mission item not found for problem:', problemId);
        return;
    }

    const completeBtn = missionItem.querySelector('.btn-complete');
    const fightBtn = missionItem.querySelector('.btn-open');
    const statusBadge = missionItem.querySelector('.status-badge');

    if (status === 'ATTEMPTED') {
        // Enable the complete button
        if (completeBtn) {
            completeBtn.disabled = false;
            completeBtn.classList.remove('disabled');
            completeBtn.textContent = '🏆 CLAIM VICTORY';
            completeBtn.removeAttribute('title');
        }

        // Update status badge
        if (statusBadge) {
            statusBadge.textContent = 'ATTEMPTED';
            statusBadge.className = 'status-badge attempted';
        }

        // Update item class
        missionItem.classList.remove('not_started');
        missionItem.classList.add('attempted');
    }
}

/**
 * Update bonus problem button state when attempted
 */
async function updateBonusButtonState(problemId, status) {
    const bonusItem = document.querySelector(`.bonus-item[data-problem-id="${problemId}"]`);
    if (!bonusItem) {
        console.log('Bonus item not found for problem:', problemId);
        return;
    }

    const completeBtn = bonusItem.querySelector('.btn-bonus-complete');
    const statusBadge = bonusItem.querySelector('.status-badge');

    if (status === 'ATTEMPTED') {
        if (completeBtn) {
            completeBtn.disabled = false;
            completeBtn.classList.remove('disabled');
            completeBtn.textContent = '🏆 CLAIM BONUS VICTORY';
            completeBtn.removeAttribute('title');
        }

        bonusItem.classList.add('attempted');
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

async function checkAllComplete() {
    console.log('📡 Checking if all missions are complete...');
    const mission = await chrome.runtime.sendMessage({ type: 'GET_MISSION' });

    if (mission && mission.error) {
        console.error('Error checking completion status:', mission.error);
        return false;
    }

    return mission?.problems?.every(p => p.status === 'COMPLETED');
}

async function loadPerformance() {
    const profile = await storage.getUserProfile();
    const topicList = document.getElementById('topicList');
    topicList.innerHTML = '';

    const topics = Object.keys(profile.topicStats || {});
    if (topics.length === 0) {
        topicList.innerHTML = '<p class="empty-message">Your history is unwritten. Defeat your first demon!</p>';
        return;
    }

    topics.forEach(topic => {
        const stats = profile.topicStats[topic];
        const rate = Math.round((stats.completed / (stats.attempts || stats.completed || 1)) * 100);

        const div = document.createElement('div');
        div.className = 'topic-item';
        div.innerHTML = `
            <div class="topic-header">
                <span>${topic}</span>
                <span>${rate}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${rate}%"></div>
            </div>
        `;
        topicList.appendChild(div);
    });
}

async function loadStory() {
    try {
        const story = await geminiService.getDailyStory();
        document.getElementById('storyText').textContent = `"${story}"`;
    } catch (e) {
        console.error('Story load failed:', e);
        document.getElementById('storyText').textContent = `"${geminiService.FALLBACK_STORIES[0]}"`;
    }
}