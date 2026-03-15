/**
 * content/problemTracker.js - Tracks when user visits problem pages
 */
console.log('🥷 Code Slayer: Problem tracker active');

// Track LeetCode problem pages
if (window.location.href.includes('leetcode.com/problems/')) {
    trackProblemVisit('leetcode');
}
// Track GeeksForGeeks problem pages
else if (window.location.href.includes('geeksforgeeks.org/problems/')) {
    trackProblemVisit('geeksforgeeks');
}

async function trackProblemVisit(platform) {
    const url = window.location.href;
    let problemSlug = null;

    if (platform === 'leetcode') {
        const parts = url.split('/');
        const problemsIndex = parts.indexOf('problems');
        if (problemsIndex !== -1 && parts[problemsIndex + 1]) {
            problemSlug = parts[problemsIndex + 1].replace(/\/$/, '');
        }
    } else if (platform === 'geeksforgeeks') {
        const parts = url.split('/');
        problemSlug = parts[parts.length - 2] || parts[parts.length - 1];
    }

    if (problemSlug) {
        console.log('🎯 Problem page detected:', problemSlug);

        // Send message to background script
        try {
            await chrome.runtime.sendMessage({
                type: 'PROBLEM_PAGE_VISITED',
                platform: platform,
                slug: problemSlug,
                url: url
            });
        } catch (error) {
            console.log('Message send failed (extension may be reloading):', error);
        }
    }
}

// Listen for URL changes (Single Page App navigation)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;

        if (url.includes('leetcode.com/problems/')) {
            trackProblemVisit('leetcode');
        } else if (url.includes('geeksforgeeks.org/problems/')) {
            trackProblemVisit('geeksforgeeks');
        }
    }
}).observe(document, { subtree: true, childList: true });