/**
 * Popup logic for Code Slayer
 */
import { storage } from '../utils/storage.js';
import { geminiService } from '../services/geminiService.js';
import { progressService } from '../services/progressService.js';

document.addEventListener('DOMContentLoaded', async () => {
    const profile = await storage.get('userProfile');
    if (!profile || !profile.onboardingComplete) {
        window.location.href = '../pages/onboarding.html';
        return;
    }

    await loadStats();
    await loadMission();
    await loadMotivation();

    document.getElementById('openDashboard').addEventListener('click', () => {
        chrome.tabs.create({ url: 'pages/dashboard.html' });
    });
});

async function loadStats() {
    const stats = await storage.get('userStats') || { streak: 0, demonsDefeated: 0 };
    document.getElementById('streakCount').textContent = stats.streak;
    document.getElementById('demonsDefeated').textContent = stats.demonsDefeated || 0;
    document.getElementById('userRank').textContent = progressService.calculateRank(stats.streak);
}

async function loadMission() {
    const mission = await storage.get('todayMission');
    const problemList = document.getElementById('problemList');

    if (!mission || !mission.problems || mission.problems.length === 0) {
        problemList.innerHTML = '<div class="loading">No mission assigned. Check again tomorrow!</div>';
        return;
    }

    problemList.innerHTML = '';
    mission.problems.forEach(p => {
        const item = document.createElement('div');
        item.className = 'mission-item';
        item.innerHTML = `
      <div class="problem-label">${p.label}</div>
      <div class="problem-meta">
        <span class="difficulty ${p.difficulty}">${p.difficulty}</span>
        <button class="btn-open" data-url="${p.question}">Fight Demon</button>
      </div>
      <div class="status-badge" style="margin-top: 8px;">${p.status.replace('_', ' ')}</div>
    `;

        item.querySelector('.btn-open').addEventListener('click', () => {
            chrome.tabs.create({ url: p.question });
            markAsAttempted(p.id);
        });

        problemList.appendChild(item);
    });
}

async function loadMotivation() {
    const motivation = await geminiService.getMotivation();
    document.getElementById('motivationText').textContent = `"${motivation}"`;
}

async function markAsAttempted(problemId) {
    const mission = await storage.get('todayMission');
    const pIdx = mission.problems.findIndex(p => p.id === problemId);
    if (pIdx !== -1 && mission.problems[pIdx].status === 'NOT_STARTED') {
        mission.problems[pIdx].status = 'ATTEMPTED';
        await storage.set('todayMission', mission);
        loadMission(); // Refresh UI
    }
}
