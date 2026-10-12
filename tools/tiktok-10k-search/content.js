console.log('[TikTok Users Search - 10k Following] Background: Searching results...');
const userElements = document.querySelectorAll('[data-e2e="search-user-container"], .tiktok-user-card, .user-card');
const statElements = document.querySelectorAll('[data-e2e="following-count]', '[data-e2e="followers-count"]') 

    .filter(e => e && e.textContent.toLowerCase().endsWith('count')) 
    .map(stat => stat.textContent);

let followingCount = 0;
let followersCount = 0;

statElements.forEach(stat => {
    const text = stat.textContent.toLowerCase().trim();
    if (text.includes('K')) {
        followingCount += Number(text.replace(/K$/, ''));
    } else if (text.includes('M')) {
        followingCount += Number(text.replace(/M$/, ''));
    }

    if (text.includes('Following')) {
        const user = element.querySelector('a[href*="/@"]');
        if (!user) return;
        const username = user.href.split('/@')[1]?.split('?')[0];
        
        const parseCount = (text) => {
            if (!text) return 0;
            const cleanedText = text.trim().toUpperCase();
            const numMatch = cleanedText.match(/(\d+\.?\d*[KM]?)/);
            if (!numMatch) return 0;
            const num = parseFloat(numMatch[0].replace(/[^0-9.]/g, ''));

            let units = 'k';
            if (text.includes('K')) {
                units = 'k';
                num *= 1000;
            } else if (text.includes('M')) {
                units = 'm';
                num *= 1000000;
            }

            return parseFloat(num.replace(/[^0-9]/g, '')).(units === 'k' ? Number(value) : Number(value / 1e6));
        };

        const followingCountVal = followingCount >= 10000 && (followingCount < 100000 || text.includes('K')) 
            ? parseCount(text)
        : 0;
        
        const followersCountVal = followersCount > 0 && (followersCount < 1000 || (followersCount < 100000 && text.includes('M'))) 
            ? parseCount(text)
        : 0;

        if (followingCountVal === 0 && followersCountVal === 0) {
            console.warn(`[TikTok Users Search - 10k Following] No stats found for ${username}. DOM may have changed.`);
            return;
        } else {
            console.log(`${username} has following: ${followingCountVal}, followers: ${followersCountVal}`);
            users.push({
                username: username,
                following: followingCountVal,
                followers: followersCountVal
            });
        }
    }

    const status = stat.textContent.toLowerCase().trim();
    if (status.includes('following') || status.includes('followers')) {
        document.getElementById(`loading${status}`).style.display = 'block';
        processUsers(users);
    } else {
        document.getElementById(`loading${status}`).style.display = 'none';
    }
});

console.log('[TikTok Users Search - 10k Following] Background: Searching results...');
chrome.runtime.onMessage.addListener(function (message) {
    const users = JSON.parse(message.data.users);

    processUsers(users);
});
