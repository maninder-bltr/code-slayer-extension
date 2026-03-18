/**
 * pages/problems.js - With Collapsible Filters
 */
import { storage } from '../utils/storage.js';

let problemsData = { sections: [] };
let completedProblemIds = [];
let problemNotes = {};
let currentFilter = 'all';
let currentDifficulty = 'all';
let currentSection = 'all';
let searchQuery = '';
let currentProblemId = null;
let viewMode = 'sections';
let activeFilters = [];

// Section icons mapping
const sectionIcons = {
    'School Level': '🌱',
    'Pattern Printing': '🔤',
    'Arrays': '📦',
    'String': '𓍯𓂃',
    'HashMap': '📍🗺️',
    'Prefix Sum': '📈 🧠',
    'Linked List': '🔗',
    'Stack': '📚',
    'Queue': '🚶‍♂️🚶‍♂️🚶‍♂️',
    'Tree': '🌲',
    'Graph': '🕸️',
    'Hashing': '🔐',
    'Dynamic Programming': '🧩',
    'Binary Search': '🔍',
    'Two Pointers': '👉👈',
    'Binary Search': '🔍 🔢 ➗',
    'Sorting': 'ᯤ',
    'Stack': '📚',
    'Queue': '🚶‍♂️🚶‍♂️🚶‍♂️',
    'Sliding Window': '🪟',
    'Backtracking': '🔄',
    'Greedy': '💰',
    'Recursion': '🔁',
    'Heap': '🏔️',
    'Trie': '🌲',
    'Bit Manipulation': '⚡',
    'Math': '📐',
    'Geometry': '📐📏',
    'Design': '🎨',
    'SQRT Decomposition': '√x',
    'Randomization': '𐦂𖨆𐀪𖠋',
    'Puzzles': '🧩🧩',
    'Default': '⚔️'
};

document.addEventListener('DOMContentLoaded', async () => {
    console.log('📚 Problems page loaded');
    await loadData();
    loadAndApplyTheme();
    setupFilterPanel();
    setupEventListeners();
    renderSectionsView();
    updateStats();
});

async function loadAndApplyTheme() {
    const settings = await storage.get('settings') || {};
    const theme = settings.theme || 'dark-ninja';
    applyTheme(theme);
    console.log('Theme applied:', theme);
}

async function loadData() {
    try {
        const response = await fetch(chrome.runtime.getURL('data/problems.json'));
        problemsData = await response.json();

        const profile = await storage.getUserProfile();
        completedProblemIds = profile.completedProblemIds || [];

        const notesData = await storage.get('problemNotes') || {};
        problemNotes = notesData;

    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('sectionsView').innerHTML = `
            <div class="empty-state">
                <h3>❌ Error Loading Problems</h3>
                <p>${error.message}</p>
                <button onclick="location.reload()" class="btn-primary" style="margin-top: 20px;">Retry</button>
            </div>
        `;
    }
}

// ============================================
// FILTER PANEL FUNCTIONS
// ============================================

function setupFilterPanel() {
    const btnToggle = document.getElementById('btnToggleFilters');
    const btnClose = document.getElementById('btnCloseFilters');
    const filterPanel = document.getElementById('filterPanel');
    const overlay = document.getElementById('filterOverlay');

    // Open filter panel
    btnToggle?.addEventListener('click', () => {
        filterPanel.classList.add('open');
        overlay.classList.add('active');
        btnToggle.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    // Close filter panel
    function closeFilterPanel() {
        filterPanel.classList.remove('open');
        overlay.classList.remove('active');
        btnToggle.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    btnClose?.addEventListener('click', closeFilterPanel);
    overlay?.addEventListener('click', closeFilterPanel);

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && filterPanel.classList.contains('open')) {
            closeFilterPanel();
        }
    });
}

function updateActiveFiltersDisplay() {
    const activeFiltersList = document.getElementById('activeFiltersList');
    const activeFiltersCount = document.getElementById('activeFiltersCount');

    activeFilters = [];

    if (currentFilter !== 'all') {
        activeFilters.push({ type: 'status', value: currentFilter, label: currentFilter === 'completed' ? '✅ Slayed' : '👹 Pending' });
    }

    if (currentDifficulty !== 'all') {
        activeFilters.push({ type: 'difficulty', value: currentDifficulty, label: `⚡ ${currentDifficulty}` });
    }

    if (currentSection !== 'all') {
        activeFilters.push({ type: 'section', value: currentSection, label: `📁 ${currentSection}` });
    }

    if (searchQuery) {
        activeFilters.push({ type: 'search', value: searchQuery, label: `🔍 "${searchQuery}"` });
    }

    // Update count badge
    activeFiltersCount.textContent = activeFilters.length;
    if (activeFilters.length > 0) {
        activeFiltersCount.classList.add('active');
    } else {
        activeFiltersCount.classList.remove('active');
    }

    // Render active filters list
    if (activeFilters.length === 0) {
        activeFiltersList.innerHTML = '<span class="no-filters">No active filters</span>';
    } else {
        activeFiltersList.innerHTML = activeFilters.map(filter => `
            <span class="active-filter-tag">
                ${filter.label}
                <button onclick="removeFilter('${filter.type}', '${filter.value}')">&times;</button>
            </span>
        `).join('');
    }
}

function removeFilter(type, value) {
    switch (type) {
        case 'status':
            currentFilter = 'all';
            document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.filter === 'all');
            });
            break;
        case 'difficulty':
            currentDifficulty = 'all';
            document.querySelectorAll('.filter-btn[data-difficulty]').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.difficulty === 'all');
            });
            break;
        case 'section':
            currentSection = 'all';
            document.querySelectorAll('.filter-btn[data-section]').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.section === 'all');
            });
            break;
        case 'search':
            searchQuery = '';
            document.getElementById('searchInput').value = '';
            break;
    }

    updateActiveFiltersDisplay();
    renderSectionsView();
}

// Make removeFilter globally accessible
window.removeFilter = removeFilter;

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    document.getElementById('btn-back')?.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });

    document.getElementById('searchInput')?.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        updateActiveFiltersDisplay();
        renderSectionsView();
    });

    document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn[data-filter]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            updateActiveFiltersDisplay();
            renderSectionsView();
        });
    });

    document.querySelectorAll('.filter-btn[data-difficulty]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn[data-difficulty]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentDifficulty = btn.dataset.difficulty;
            updateActiveFiltersDisplay();
            renderSectionsView();
        });
    });

    document.getElementById('closeModal')?.addEventListener('click', () => {
        document.getElementById('noteModal').style.display = 'none';
    });

    document.getElementById('btnSaveNote')?.addEventListener('click', saveNote);
    document.getElementById('btnDeleteNote')?.addEventListener('click', deleteNote);

    document.getElementById('noteText')?.addEventListener('input', (e) => {
        document.getElementById('charCount').textContent = e.target.value.length;
    });

    document.getElementById('noteModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'noteModal') {
            document.getElementById('noteModal').style.display = 'none';
        }
    });

    // View toggle
    document.getElementById('btnViewAll')?.addEventListener('click', () => {
        viewMode = 'flat';
        document.getElementById('btnViewAll').classList.add('active');
        document.getElementById('btnViewSections').classList.remove('active');
        document.getElementById('sectionsView').style.display = 'none';
        document.getElementById('flatView').style.display = 'flex';
        renderFlatView();
    });

    document.getElementById('btnViewSections')?.addEventListener('click', () => {
        viewMode = 'sections';
        document.getElementById('btnViewSections').classList.add('active');
        document.getElementById('btnViewAll').classList.remove('active');
        document.getElementById('flatView').style.display = 'none';
        document.getElementById('sectionsView').style.display = 'flex';
        renderSectionsView();
    });

    // Clear all filters
    document.getElementById('btnClearFilters')?.addEventListener('click', () => {
        currentFilter = 'all';
        currentDifficulty = 'all';
        currentSection = 'all';
        searchQuery = '';
        document.getElementById('searchInput').value = '';

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active',
                btn.dataset.filter === 'all' ||
                btn.dataset.difficulty === 'all' ||
                btn.dataset.section === 'all'
            );
        });

        updateActiveFiltersDisplay();
        renderSectionsView();
    });
}

function getSectionIcon(sectionName) {
    for (const [key, icon] of Object.entries(sectionIcons)) {
        if (sectionName.toLowerCase().includes(key.toLowerCase())) {
            return icon;
        }
    }
    return sectionIcons['Default'];
}

function isProblemCompleted(problemId) {
    return completedProblemIds.includes(parseInt(problemId));
}

function filterProblem(problem) {
    if (searchQuery) {
        const searchText = `${problem.label} ${problem.title} ${problem.topic}`.toLowerCase();
        if (!searchText.includes(searchQuery)) return false;
    }

    const isCompleted = isProblemCompleted(problem.id);
    if (currentFilter === 'completed' && !isCompleted) return false;
    if (currentFilter === 'pending' && isCompleted) return false;

    if (currentDifficulty !== 'all' && problem.difficulty?.toLowerCase() !== currentDifficulty) {
        return false;
    }

    if (currentSection !== 'all' && problem.topic !== currentSection) {
        return false;
    }

    return true;
}

function renderSectionsView() {
    const sectionsView = document.getElementById('sectionsView');

    if (!problemsData.sections || problemsData.sections.length === 0) {
        sectionsView.innerHTML = '<div class="empty-state"><h3>No problems available</h3></div>';
        return;
    }

    // Generate section filters dynamically
    const sectionFiltersContainer = document.getElementById('sectionFilters');
    if (sectionFiltersContainer) {
        const sections = problemsData.sections.map(s => s.title);
        sectionFiltersContainer.innerHTML = `
            <button class="filter-btn ${currentSection === 'all' ? 'active' : ''}" data-section="all">All Sections</button>
            ${sections.map(section => `
                <button class="filter-btn ${currentSection === section ? 'active' : ''}" data-section="${section}">
                    ${getSectionIcon(section)} ${section}
                </button>
            `).join('')}
        `;

        sectionFiltersContainer.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn[data-section]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentSection = btn.dataset.section;
                updateActiveFiltersDisplay();
                renderSectionsView();
            });
        });
    }

    sectionsView.innerHTML = '';

    problemsData.sections.forEach((section, sectionIndex) => {
        const sectionProblems = [];

        if (section.problems) {
            section.problems.forEach(p => {
                sectionProblems.push({ ...p, topic: section.title });
            });
        }

        const subsections = [];
        if (section.subsections) {
            section.subsections.forEach(sub => {
                if (sub.problems) {
                    const subProblems = sub.problems.map(p => ({ ...p, topic: sub.title }));
                    subsections.push({ title: sub.title, problems: subProblems });
                    sectionProblems.push(...subProblems);
                }
            });
        }

        const filteredProblems = sectionProblems.filter(filterProblem);
        const completedCount = sectionProblems.filter(p => isProblemCompleted(p.id)).length;
        const totalCount = sectionProblems.length;
        const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

        if (searchQuery || currentFilter !== 'all' || currentDifficulty !== 'all') {
            if (filteredProblems.length === 0) return;
        }

        const sectionGroup = document.createElement('div');
        sectionGroup.className = 'section-group';
        sectionGroup.innerHTML = `
            <div class="section-header" data-section-index="${sectionIndex}">
                <div class="section-title">
                    <span class="section-icon">${getSectionIcon(section.title)}</span>
                    <span class="section-name">${section.title}</span>
                </div>
                <div class="section-stats">
                    <div class="section-progress">
                        <span>${completedCount}/${totalCount} Slayed</span>
                        <div class="progress-bar-mini">
                            <div class="progress-fill-mini" style="width: ${progressPercent}%"></div>
                        </div>
                    </div>
                    <span class="toggle-icon">▼</span>
                </div>
            </div>
            <div class="section-content" id="section-content-${sectionIndex}">
                ${subsections.length > 0 ?
                subsections.map(sub => `
                        <div class="subsection-group">
                            <h4 class="subsection-title">📁 ${sub.title}</h4>
                            ${renderProblemsList(sub.problems)}
                        </div>
                    `).join('') :
                renderProblemsList(section.problems || [], section.title)
            }
            </div>
        `;

        const header = sectionGroup.querySelector('.section-header');
        const content = sectionGroup.querySelector('.section-content');
        const toggleIcon = sectionGroup.querySelector('.toggle-icon');

        header.addEventListener('click', () => {
            content.classList.toggle('collapsed');
            toggleIcon.classList.toggle('collapsed');
        });

        sectionsView.appendChild(sectionGroup);
    });

    document.querySelectorAll('.btn-note').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const problemId = e.target.dataset.id;
            const problemTitle = e.target.dataset.title;
            const problemTopic = e.target.dataset.topic;
            const problemDifficulty = e.target.dataset.difficulty;
            openNoteModal(problemId, problemTitle, problemTopic, problemDifficulty);
        });
    });

    updateStats();
    updateActiveFiltersDisplay();
}

function renderProblemsList(problems, defaultTopic = '') {
    if (!problems || problems.length === 0) {
        return '<p class="empty-state">No problems in this section</p>';
    }

    const filtered = problems.filter(filterProblem);

    if (filtered.length === 0) {
        return '<p class="empty-state">No problems match your filters</p>';
    }

    return filtered.map(p => {
        const isCompleted = isProblemCompleted(p.id);
        const hasNote = problemNotes[p.id] && problemNotes[p.id].trim().length > 0;
        const topic = p.topic || defaultTopic;

        return `
            <div class="problem-card ${isCompleted ? 'completed' : 'pending'}">
                <div class="problem-info">
                    <div class="problem-title">
                        ${isCompleted ? '✅' : '👹'} ${p.label || p.title}
                        ${hasNote ? '📝' : ''}
                    </div>
                    <div class="problem-meta">
                        <span class="problem-topic">${topic}</span>
                        <span class="problem-difficulty ${p.difficulty?.toLowerCase()}">${p.difficulty || 'Easy'}</span>
                    </div>
                </div>
                <div class="problem-actions">
                    <button class="btn-note ${hasNote ? 'has-note' : ''}" 
                            data-id="${p.id}"
                            data-title="${p.label || p.title}"
                            data-topic="${topic}"
                            data-difficulty="${p.difficulty || 'Easy'}">
                        ${hasNote ? '📝 View Note' : '➕ Add Note'}
                    </button>
                    <a href="${p.question || p.url || '#'}" target="_blank" class="btn-solve ${isCompleted ? 'btn-solved' : ''}">
                        ${isCompleted ? '✅ Slayed' : '⚔️ Solve'}
                    </a>
                </div>
            </div>
        `;
    }).join('');
}

function renderFlatView() {
    const flatView = document.getElementById('flatView');
    const allProblems = [];

    problemsData.sections?.forEach(section => {
        if (section.problems) {
            section.problems.forEach(p => {
                allProblems.push({ ...p, topic: section.title });
            });
        }
        if (section.subsections) {
            section.subsections.forEach(sub => {
                if (sub.problems) {
                    allProblems.push({ ...p, topic: sub.title });
                }
            });
        }
    });

    const filtered = allProblems.filter(filterProblem);

    if (filtered.length === 0) {
        flatView.innerHTML = '<div class="empty-state"><h3>No problems match your filters</h3></div>';
        return;
    }

    flatView.innerHTML = filtered.map(p => {
        const isCompleted = isProblemCompleted(p.id);
        const hasNote = problemNotes[p.id] && problemNotes[p.id].trim().length > 0;

        return `
            <div class="problem-card ${isCompleted ? 'completed' : 'pending'}">
                <div class="problem-info">
                    <div class="problem-title">
                        ${isCompleted ? '✅' : '👹'} ${p.label || p.title}
                        ${hasNote ? '📝' : ''}
                    </div>
                    <div class="problem-meta">
                        <span class="problem-topic">${p.topic || 'General'}</span>
                        <span class="problem-difficulty ${p.difficulty?.toLowerCase()}">${p.difficulty || 'Easy'}</span>
                    </div>
                </div>
                <div class="problem-actions">
                    <button class="btn-note ${hasNote ? 'has-note' : ''}" 
                            data-id="${p.id}"
                            data-title="${p.label || p.title}"
                            data-topic="${p.topic || 'General'}"
                            data-difficulty="${p.difficulty || 'Easy'}">
                        ${hasNote ? '📝 View Note' : '➕ Add Note'}
                    </button>
                    <a href="${p.question || p.url || '#'}" target="_blank" class="btn-solve ${isCompleted ? 'btn-solved' : ''}">
                        ${isCompleted ? '✅ Slayed' : '⚔️ Solve'}
                    </a>
                </div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.btn-note').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const problemId = e.target.dataset.id;
            const problemTitle = e.target.dataset.title;
            const problemTopic = e.target.dataset.topic;
            const problemDifficulty = e.target.dataset.difficulty;
            openNoteModal(problemId, problemTitle, problemTopic, problemDifficulty);
        });
    });

    updateStats();
    updateActiveFiltersDisplay();
}

function updateStats() {
    let total = 0;
    let slayed = 0;

    problemsData.sections?.forEach(section => {
        if (section.problems) {
            total += section.problems.length;
            slayed += section.problems.filter(p => isProblemCompleted(p.id)).length;
        }
        if (section.subsections) {
            section.subsections.forEach(sub => {
                if (sub.problems) {
                    total += sub.problems.length;
                    slayed += sub.problems.filter(p => isProblemCompleted(p.id)).length;
                }
            });
        }
    });

    document.getElementById('slayedCount').textContent = slayed;
    document.getElementById('remainingCount').textContent = total - slayed;
    document.getElementById('totalCount').textContent = total;
}

async function openNoteModal(problemId, problemTitle, problemTopic, problemDifficulty) {
    currentProblemId = problemId;

    document.getElementById('modalProblemTitle').textContent = problemTitle;
    document.getElementById('modalProblemMeta').textContent =
        `Topic: ${problemTopic} | Difficulty: ${problemDifficulty}`;

    const existingNote = problemNotes[problemId] || '';
    document.getElementById('noteText').value = existingNote;
    document.getElementById('charCount').textContent = existingNote.length;

    document.getElementById('noteStatus').className = 'status-message';
    document.getElementById('noteModal').style.display = 'flex';
}

async function saveNote() {
    if (!currentProblemId) return;

    const noteText = document.getElementById('noteText').value.trim();
    const statusEl = document.getElementById('noteStatus');

    try {
        problemNotes[currentProblemId] = noteText;
        await storage.set('problemNotes', problemNotes);

        statusEl.textContent = '✅ Note saved successfully!';
        statusEl.className = 'status-message success';

        setTimeout(() => {
            document.getElementById('noteModal').style.display = 'none';
            if (viewMode === 'sections') {
                renderSectionsView();
            } else {
                renderFlatView();
            }
        }, 1000);

    } catch (error) {
        statusEl.textContent = '❌ Failed to save note: ' + error.message;
        statusEl.className = 'status-message error';
    }
}

async function deleteNote() {
    if (!currentProblemId) return;

    const confirmed = confirm('🗑️ Delete this note? This action cannot be undone.');
    if (!confirmed) return;

    try {
        delete problemNotes[currentProblemId];
        await storage.set('problemNotes', problemNotes);

        const statusEl = document.getElementById('noteStatus');
        statusEl.textContent = '✅ Note deleted!';
        statusEl.className = 'status-message success';

        setTimeout(() => {
            document.getElementById('noteModal').style.display = 'none';
            if (viewMode === 'sections') {
                renderSectionsView();
            } else {
                renderFlatView();
            }
        }, 1000);

    } catch (error) {
        const statusEl = document.getElementById('noteStatus');
        statusEl.textContent = '❌ Failed to delete note: ' + error.message;
        statusEl.className = 'status-message error';
    }
}