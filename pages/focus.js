/**
 * pages/focus.js - Focus Page Controller
 * Handles site blocking page functionality
 */

console.log('🚫 Focus page JavaScript loaded');

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready, initializing focus page...');
    initializeFocusPage();
});

// Also run immediately in case DOMContentLoaded already fired
if (document.readyState !== 'loading') {
    initializeFocusPage();
}

async function initializeFocusPage() {
    try {
        console.log('Initializing focus page...');

        // Load mission data
        await loadMissionData();

        // Setup button click handler
        setupBattleButton();

        // Load motivation
        await loadMotivation();

        console.log('Focus page initialized successfully');

    } catch (error) {
        console.error('Error initializing focus page:', error);
        showError('Failed to load mission data. Please refresh the page.');
    }
}

async function loadMissionData() {
    try {
        console.log('Loading mission data from storage...');

        const result = await chrome.storage.local.get(['todayMission']);
        const mission = result.todayMission;

        console.log('Mission data:', mission);

        const missionList = document.getElementById('missionList');
        const progressFill = document.getElementById('progressFill');
        const missionBox = document.getElementById('missionBox');

        if (!mission || !mission.problems || mission.problems.length === 0) {
            missionList.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #a0a0b0;">
                    <p>👹 No active mission found.</p>
                    <p style="margin-top: 10px; font-size: 0.9em;">Please open the dashboard to start your journey.</p>
                </div>
            `;
            progressFill.style.width = '0%';
            return;
        }

        // Calculate progress
        const total = mission.problems.length;
        const completed = mission.problems.filter(p => p.status === 'COMPLETED').length;
        const progressPercent = (completed / total) * 100;

        console.log(`Progress: ${completed}/${total} (${progressPercent}%)`);
        progressFill.style.width = `${progressPercent}%`;

        // Render mission items
        missionList.innerHTML = '';

        mission.problems.forEach((problem, index) => {
            const statusClass = problem.status.toLowerCase().replace('_', '-');
            const statusIcons = {
                'not-started': '👹',
                'attempted': '🎯',
                'completed': '✅'
            };

            const item = document.createElement('div');
            item.className = `mission-item ${statusClass}`;
            item.innerHTML = `
                <span class="mission-label">
                    ${statusIcons[problem.status] || '👹'} 
                    Problem ${index + 1}: ${problem.label || problem.title || 'Unknown'}
                </span>
                <span class="mission-status ${statusClass}">
                    ${problem.status.replace('_', ' ')}
                </span>
            `;
            missionList.appendChild(item);
        });

        // Show completed count
        if (completed > 0) {
            const summary = document.createElement('div');
            summary.style.cssText = 'text-align: center; margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); color: #a0a0b0;';
            summary.innerHTML = `
                <span style="color: #00b894; font-weight: bold;">${completed}/${total}</span> demons defeated
            `;
            missionList.appendChild(summary);
        }

    } catch (error) {
        console.error('Error loading mission:', error);
        showError('Failed to load mission. Please refresh.');
    }
}

function setupBattleButton() {
    const btn = document.getElementById('btnOpenBattle');

    if (!btn) {
        console.error('Battle button not found!');
        return;
    }

    console.log('Setting up battle button click handler...');

    btn.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log('Battle button clicked!');

        // Add loading state
        btn.classList.add('loading');
        btn.textContent = '⚔️ Opening...';

        try {
            // Get the dashboard URL
            const dashboardUrl = chrome.runtime.getURL('pages/dashboard.html');

            console.log('Opening dashboard:', dashboardUrl);

            // Get current tab
            const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (currentTab) {
                // Update current tab to dashboard
                console.log('Updating current tab:', currentTab.id);
                await chrome.tabs.update(currentTab.id, { url: dashboardUrl });
            } else {
                // Create new tab
                console.log('Creating new tab');
                await chrome.tabs.create({ url: dashboardUrl });
            }

        } catch (error) {
            console.error('Error opening dashboard:', error);
            showError('Failed to open dashboard. Please try again.');
            btn.classList.remove('loading');
            btn.textContent = '⚔️ Open Battle';
        }
    });

    console.log('Battle button listener attached successfully');
}

async function loadMotivation() {
    try {
        const quotes = [
            "A ninja does not fear the difficult path. They fear the path never taken.",
            "The expert in anything was once a beginner who refused to give up.",
            "Every demon defeated makes you stronger. On to the next!",
            "Consistency is the secret weapon of all masters.",
            "Your future self is watching. Make them proud.",
            "The only bad training is the training you skipped."
        ];

        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        document.getElementById('motivationText').textContent = `"${randomQuote}"`;

    } catch (error) {
        console.error('Error loading motivation:', error);
    }
}

function showError(message) {
    const errorEl = document.getElementById('errorMessage');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('show');
    }
}