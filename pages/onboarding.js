/**
 * pages/onboarding.js - Enhanced with animations
 */
import { storage } from '../utils/storage.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('🥷 Onboarding loaded');

    // Create particle effects
    createParticles();

    // Animate realms on scroll
    animateRealms();

    const welcomeScreen = document.getElementById('screen-welcome');
    const ninjaScreen = document.getElementById('screen-ninja-info');
    const topicScreen = document.getElementById('screen-topic-selector');

    // Navigate to Ninja Path info
    document.getElementById('btn-ninja-path').addEventListener('click', () => {
        welcomeScreen.classList.remove('active');
        ninjaScreen.classList.add('active');
        animateRealms();
    });

    // Navigate to Custom Training
    document.getElementById('btn-custom-training').addEventListener('click', () => {
        welcomeScreen.classList.remove('active');
        topicScreen.classList.add('active');
    });

    // Back to welcome from Ninja
    document.getElementById('btn-back-to-welcome').addEventListener('click', () => {
        ninjaScreen.classList.remove('active');
        welcomeScreen.classList.add('active');
    });

    // Back to welcome from Topics
    document.getElementById('btn-back-to-welcome2').addEventListener('click', () => {
        topicScreen.classList.remove('active');
        welcomeScreen.classList.add('active');
    });

    // Begin Ninja Journey
    document.getElementById('btn-begin-ninja').addEventListener('click', async () => {
        const defaultProfile = storage.getDefaultProfile();

        await storage.set('userProfile', {
            ...defaultProfile,
            onboardingComplete: true,
            learningMode: 'NINJA_PATH',
            selectedTopics: [],
            difficulty: 'mixed'
        });

        // Show epic start message
        showEpicStartMessage();

        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    });

    // Start Custom Training
    document.getElementById('btn-start-training').addEventListener('click', async () => {
        const topics = [...document.querySelectorAll('#screen-topic-selector input[type="checkbox"]:checked')]
            .map(cb => cb.value);

        const difficulty = document.querySelector('input[name="difficulty"]:checked').value;

        if (topics.length === 0) {
            alert("⚠️ Select at least one topic, warrior!");
            return;
        }

        const defaultProfile = storage.getDefaultProfile();

        await storage.set('userProfile', {
            ...defaultProfile,
            onboardingComplete: true,
            learningMode: 'CUSTOM_TOPIC',
            selectedTopics: topics,
            difficulty: difficulty
        });

        showEpicStartMessage();

        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    });
});

// ============================================
// PARTICLE EFFECTS
// ============================================

function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 4 + 2}px;
            height: ${Math.random() * 4 + 2}px;
            background: rgba(255, 71, 87, ${Math.random() * 0.5 + 0.2});
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: particleFloat ${Math.random() * 10 + 10}s infinite;
            animation-delay: ${Math.random() * 5}s;
        `;
        container.appendChild(particle);
    }
}

// Add particle animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes particleFloat {
        0%, 100% { transform: translate(0, 0); opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px); opacity: 0; }
    }
`;
document.head.appendChild(style);

// ============================================
// REALM ANIMATIONS
// ============================================

function animateRealms() {
    const realms = document.querySelectorAll('.realm');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.animationDelay = `${index * 0.1}s`;
                    entry.target.classList.add('visible');
                }, index * 100);
            }
        });
    }, { threshold: 0.1 });

    realms.forEach(realm => {
        observer.observe(realm);
    });
}

// ============================================
// EPIC START MESSAGE
// ============================================

function showEpicStartMessage() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        animation: fadeIn 0.5s;
    `;

    overlay.innerHTML = `
        <div style="text-align: center; color: white;">
            <div style="font-size: 5em; margin-bottom: 20px; animation: pulse 1s infinite;">⚔️</div>
            <h1 style="font-size: 3em; background: linear-gradient(135deg, #ff4757, #ffa502); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 20px;">
                YOUR JOURNEY BEGINS!
            </h1>
            <p style="font-size: 1.5em; color: #a0a0b0;">May your blade stay sharp and your streak unbroken.</p>
        </div>
    `;

    document.body.appendChild(overlay);

    setTimeout(() => {
        overlay.style.animation = 'fadeOut 0.5s';
        setTimeout(() => overlay.remove(), 500);
    }, 1500);
}