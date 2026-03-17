/**
 * Developer Info Injection Utility
 * Adds a developer badge and info card to the page.
 */

const developerInfo = {
    name: "Maninder Singh",
    linkedin: "https://www.linkedin.com/in/maninder-singh-uk/",
    github: "https://github.com/maninder-bltr"
};

function injectDeveloperSection() {
    // Create container
    const container = document.createElement('div');
    container.className = 'dev-badge-container';

    // SVG Icons
    const userIcon = `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>`;
    const linkedinIcon = `<svg viewBox="0 0 24 24" fill="white"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>`;
    const githubIcon = `<svg viewBox="0 0 24 24" fill="white"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>`;

    // HTML Content
    container.innerHTML = `
        <button class="dev-badge" id="devBadge">
            ${userIcon}
            <span>Dev</span>
        </button>
        <div class="dev-card" id="devCard">
            <div class="dev-profile">
                <div class="dev-info-icon">
                    ${userIcon}
                </div>
                <div class="dev-info">
                    <h3 class="dev-name">${developerInfo.name}</h3>
                </div>
            </div>
            <div class="dev-social-links">
                <a href="${developerInfo.linkedin}" target="_blank" class="social-btn linkedin">
                    ${linkedinIcon}
                    LinkedIn
                </a>
                <a href="${developerInfo.github}" target="_blank" class="social-btn github">
                    ${githubIcon}
                    GitHub
                </a>
            </div>
        </div>
    `;

    document.body.appendChild(container);

    // Note: Hover behavior is handled by CSS (.dev-badge-container:hover .dev-card)
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectDeveloperSection);
} else {
    injectDeveloperSection();
}
