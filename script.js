const DATA_URL = 'https://raw.githubusercontent.com/krmanik/Anki-NeetCode/main/neetcode-150-list.json';
const STORAGE_KEY = 'neetcode150_solved';

let neetcodeData = {};
let filteredData = {};
let solvedProblems = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
let totalProblems = 0;
let currentTopic = null;
let currentMode = 'neetcode_150';

const BLIND_75_SLUGS = new Set([
      "two-sum", "longest-substring-without-repeating-characters", "longest-palindromic-substring", "container-with-most-water",
      "3sum", "remove-nth-node-from-end-of-list", "valid-parentheses", "merge-two-sorted-lists", "merge-k-sorted-lists",
      "search-in-rotated-sorted-array", "combination-sum", "rotate-image", "group-anagrams", "maximum-subarray",
      "spiral-matrix", "jump-game", "merge-intervals", "insert-interval", "unique-paths", "climbing-stairs",
      "set-matrix-zeroes", "minimum-window-substring", "word-search", "decode-ways", "validate-binary-search-tree",
      "same-tree", "binary-tree-level-order-traversal", "maximum-depth-of-binary-tree", "construct-binary-tree-from-preorder-and-inorder-traversal",
      "best-time-to-buy-and-sell-stock", "binary-tree-maximum-path-sum", "valid-palindrome", "longest-consecutive-sequence",
      "clone-graph", "word-break", "linked-list-cycle", "reorder-list", "maximum-product-subarray",
      "find-minimum-in-rotated-sorted-array", "reverse-bits", "number-of-1-bits", "house-robber", "number-of-islands",
      "reverse-linked-list", "course-schedule", "implement-trie-prefix-tree", "design-add-and-search-words-data-structure",
      "word-search-ii", "house-robber-ii", "contains-duplicate", "invert-binary-tree", "kth-smallest-element-in-a-bst",
      "lowest-common-ancestor-of-a-binary-search-tree", "lowest-common-ancestor-of-a-binary-tree", "product-of-array-except-self",
      "valid-anagram", "meeting-rooms", "meeting-rooms-ii", "graph-valid-tree", "missing-number", "alien-dictionary",
      "encode-and-decode-strings", "find-median-from-data-stream", "longest-increasing-subsequence", "coin-change",
      "number-of-connected-components-in-an-undirected-graph", "counting-bits", "top-k-frequent-elements", "sum-of-two-integers",
      "pacific-atlantic-water-flow", "longest-repeating-character-replacement", "non-overlapping-intervals",
      "serialize-and-deserialize-bst", "subtree-of-another-tree", "palindromic-substrings"
]);

// DOM Elements
const topicListEl = document.getElementById('topic-list');
const problemsGridEl = document.getElementById('problems-grid');
const currentTopicTitleEl = document.getElementById('current-topic-title');
const topicStatsEl = document.getElementById('topic-stats');
const overallProgressTextEl = document.getElementById('overall-progress-text');
const overallProgressBarEl = document.getElementById('overall-progress-bar');
const roadmapSelectorEl = document.getElementById('roadmap-selector');

roadmapSelectorEl.addEventListener('change', (e) => {
    currentMode = e.target.value;
    applyRoadmapFilter();
});

async function init() {
    try {
        const response = await fetch(DATA_URL);
        neetcodeData = await response.json();
        
        applyRoadmapFilter();
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

function applyRoadmapFilter() {
    if (currentMode === 'neetcode_150') {
        filteredData = neetcodeData;
    } else if (currentMode === 'blind_75') {
        filteredData = {};
        for (const topic in neetcodeData) {
            const problems = neetcodeData[topic];
            const filteredProblems = {};
            for (const pName in problems) {
                const slug = getProblemSlug(problems[pName].url);
                if (BLIND_75_SLUGS.has(slug)) {
                    filteredProblems[pName] = problems[pName];
                }
            }
            if (Object.keys(filteredProblems).length > 0) {
                filteredData[topic] = filteredProblems;
            }
        }
    }
    
    totalProblems = 0;
    for (const topic in filteredData) {
        totalProblems += Object.keys(filteredData[topic]).length;
    }

    updateOverallProgress();
    renderTopics();
    
    const firstTopic = Object.keys(filteredData)[0];
    if (firstTopic) {
        selectTopic(firstTopic);
    } else {
        problemsGridEl.innerHTML = '';
        currentTopicTitleEl.textContent = 'No topics found';
        topicStatsEl.textContent = '';
    }
}

function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...solvedProblems]));
    updateOverallProgress();
    renderTopics(); // Re-render sidebar to update badges
}

function updateOverallProgress() {
    let solvedCount = 0;
    for (const topic in filteredData) {
        for (const pName in filteredData[topic]) {
            const slug = getProblemSlug(filteredData[topic][pName].url);
            if (solvedProblems.has(slug)) {
                solvedCount++;
            }
        }
    }
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
    const problems = filteredData[topicName];
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
    
    Object.keys(filteredData).forEach(topicName => {
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
    
    const problems = filteredData[topicName];
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
