let users = [];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "USER_MEETS_CRITERIA") {
        console.log('[TikTok Users Search - 10k Following] Background: Received user:', message);
        if (!users.some(u => u.username === message.username)) {
            users.push({
                username: message.username,
                following: Math.round(message.following),
                followers: Math.round(message.followers)
            });
            // Limit to 100 users to avoid storage issues
            if (users.length > 100) users.shift();
            chrome.storage.sync.set({ users }, () => {
                console.log('[TikTok Users Search - 10k Following] Background: Stored users:', users);
            });
        }
    } else if (message.type === "CHECK_PROFILE") {
        const username = message.username;
        const url = `https://www.tiktok.com/@${username}`;
        chrome.scripting.executeScript({
            target: { tabId: sender.tab.id },
            func: (profileUrl) => {
                return fetch(profileUrl)
                    .then(response => response.text())
                    .then(html => {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');
                        const followingElement = doc.querySelector('strong[data-e2e="following-count"]') || doc.querySelector('[title="Following"]');
                        const followersElement = doc.querySelector('strong[data-e2e="followers-count"]') || doc.querySelector('[title="Followers"]');
                        const parseCount = (text) => {
                            if (!text) return 0;
                            const cleaned = text.trim().toUpperCase();
                            const num = parseFloat(cleaned.replace(/[^0-9.]/g, ''));
                            return cleaned.includes('K') ? num * 1000 : cleaned.includes('M') ? num * 1000000 : num || 0;
                        };
                        const following = followingElement ? parseCount(followingElement.textContent) : 0;
                        const followers = followersElement ? parseCount(followersElement.textContent) : 0;
                        return { username: profileUrl.split('/@')[1], following, followers };
                    })
                    .catch(error => {
                        console.error('Profile fetch failed:', error);
                        return null;
                    });
            },
            args: [url]
        }, (results) => {
            if (results && results[0] && results[0].result) {
                sendResponse(results[0].result);
            } else {
                sendResponse(null);
            }
        });
        return true; // Keep channel open for async response
    }
});

chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "popup") {
        port.onMessage.addListener((msg) => {
            if (msg.type === "REQUEST_USERS") {
                chrome.storage.sync.get(['users'], (result) => {
                    const storedUsers = result.users || [];
                    console.log('[TikTok Users Search - 10k Following] Background: Sent users to popup:', storedUsers);
                    port.postMessage({ type: "USER_LIST", users: storedUsers });
                });
            }
        });
    }
});