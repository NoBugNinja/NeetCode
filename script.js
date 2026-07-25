const DATA_URL = 'https://raw.githubusercontent.com/krmanik/Anki-NeetCode/main/neetcode-150-list.json';
const STORAGE_KEY = 'neetcode150_solved';

let neetcodeData = {};
let solvedProblems = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
let totalProblems = 0;
let currentTopic = null;

// DOM Elements
const topicListEl = document.getElementById('topic-list');
const problemsGridEl = document.getElementById('problems-grid');
const currentTopicTitleEl = document.getElementById('current-topic-title');
const topicStatsEl = document.getElementById('topic-stats');
const overallProgressTextEl = document.getElementById('overall-progress-text');
const overallProgressBarEl = document.getElementById('overall-progress-bar');

async function init() {
    try {
        const response = await fetch(DATA_URL);
        neetcodeData = await response.json();
        
        // Count total problems
        totalProblems = 0;
        for (const topic in neetcodeData) {
            totalProblems += Object.keys(neetcodeData[topic]).length;
        }

        updateOverallProgress();
        renderTopics();
        
        // Select first topic by default
        const firstTopic = Object.keys(neetcodeData)[0];
        if (firstTopic) {
            selectTopic(firstTopic);
        }
    } catch (error) {
        console.error('Failed to load NeetCode data:', error);
        problemsGridEl.innerHTML = `
            <div class="empty-state">
                <i class="ph ph-warning text-red-500"></i>
                <p>Failed to load problem list. Please check your connection.</p>
            </div>
        `;
    }
}

function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...solvedProblems]));
    updateOverallProgress();
    renderTopics(); // Re-render sidebar to update badges
}

function updateOverallProgress() {
    const solvedCount = solvedProblems.size;
    overallProgressTextEl.textContent = `${solvedCount} / ${totalProblems}`;
    const percentage = totalProblems === 0 ? 0 : Math.round((solvedCount / totalProblems) * 100);
    overallProgressBarEl.style.width = `${percentage}%`;
}

function getProblemSlug(url) {
    if (!url) return null;
    const parts = url.split('/');
    return parts[parts.length - 2] || parts[parts.length - 1];
}

function getTopicProgress(topicName) {
    const problems = neetcodeData[topicName];
    const total = Object.keys(problems).length;
    let solved = 0;
    
    for (const pName in problems) {
        const slug = getProblemSlug(problems[pName].url);
        if (solvedProblems.has(slug)) {
            solved++;
        }
    }
    return { solved, total };
}

function renderTopics() {
    topicListEl.innerHTML = '';
    
    Object.keys(neetcodeData).forEach(topicName => {
        const { solved, total } = getTopicProgress(topicName);
        
        const el = document.createElement('div');
        el.className = `topic-item ${currentTopic === topicName ? 'active' : ''}`;
        el.onclick = () => selectTopic(topicName);
        
        el.innerHTML = `
            <span>${topicName}</span>
            <span class="topic-stats-badge">${solved}/${total}</span>
        `;
        
        topicListEl.appendChild(el);
    });
}

function selectTopic(topicName) {
    currentTopic = topicName;
    renderTopics(); // Update active state
    renderProblems(topicName);
}

function toggleProblem(e, slug) {
    e.preventDefault(); // Prevent following the link
    e.stopPropagation();
    
    if (solvedProblems.has(slug)) {
        solvedProblems.delete(slug);
    } else {
        solvedProblems.add(slug);
    }
    
    saveProgress();
    
    // Re-render current topic problems to reflect changes
    renderProblems(currentTopic);
}

function renderProblems(topicName) {
    currentTopicTitleEl.textContent = topicName;
    const { solved, total } = getTopicProgress(topicName);
    topicStatsEl.textContent = `${solved} of ${total} problems solved`;
    
    problemsGridEl.innerHTML = '';
    
    const problems = neetcodeData[topicName];
    let delay = 0;
    
    for (const [pName, details] of Object.entries(problems)) {
        const slug = getProblemSlug(details.url);
        const isSolved = solvedProblems.has(slug);
        
        // Clean up difficulty for CSS class
        const diffLower = details.difficulty.toLowerCase();
        
        const card = document.createElement('a');
        card.href = details.url;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
        card.className = `problem-card animate-fade-in ${isSolved ? 'solved' : ''}`;
        card.style.animationDelay = `${delay}ms`;
        
        card.innerHTML = `
            <div class="checkbox-wrapper" onclick="toggleProblem(event, '${slug}')">
                <i class="ph-bold ph-check"></i>
            </div>
            <div class="problem-info">
                <div class="problem-title">
                    ${pName}
                    <i class="ph ph-arrow-up-right text-muted" style="font-size: 14px; opacity: 0.5;"></i>
                </div>
                <div class="problem-difficulty diff-${diffLower}">
                    ${details.difficulty}
                </div>
            </div>
            <i class="ph-fill ph-code text-muted" style="font-size: 24px; opacity: 0.2; position: absolute; right: 20px; top: 50%; transform: translateY(-50%);"></i>
        `;
        
        problemsGridEl.appendChild(card);
        delay += 30; // Stagger animation
    }
}

// Start app
init();
