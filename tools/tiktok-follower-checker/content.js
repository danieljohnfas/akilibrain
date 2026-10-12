if (typeof CONFIG === 'undefined') {
    console.log("TikTok Follower Checker with Unfollow is running...");

    const CONFIG = {
        MODAL_CONTAINER: '.css-wq5jjc-DivUserListContainer',
        USER_ITEM: '.css-1q2pvy0-DivUserItem',
        FOLLOWING_COUNT: '[data-e2e="following-count"]',
    };

    function updateProgressUI(userCount, totalTarget) {
        let container = document.getElementById('progressContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'progressContainer';
            container.style.cssText = 'position:fixed;top:10px;left:10px;background:rgba(0,0,0,0.8);color:white;padding:10px;z-index:9999;border-radius:5px;';
            document.body.appendChild(container);
        }
        container.innerHTML = `Users Loaded: ${userCount}/${totalTarget} (${((userCount / totalTarget) * 100).toFixed(1)}%)`;
    }

    function updateNonFollowerUI(nonFollowers) {
        let container = document.getElementById('nonFollowerContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'nonFollowerContainer';
            container.style.cssText = 'position:fixed;top:10px;right:10px;background:rgba(0,0,0,0.9);color:white;padding:15px;z-index:9999;max-height:80vh;overflow-y:auto;border-radius:5px;';
            document.body.appendChild(container);
        }
        container.innerHTML = `<h3>Non-Followers (${nonFollowers.length})</h3><button id="unfollowAllBtn" style="background:#fe2c55;color:white;border:none;padding:5px 10px;cursor:pointer;margin-bottom:10px;">Unfollow All</button><ul id="nonFollowersList"></ul>`;
        const list = container.querySelector('#nonFollowersList');
        nonFollowers.forEach(({ username, element }) => {
            const li = document.createElement('li');
            li.innerHTML = `${username} <button style="margin-left:10px;background:#fe2c55;color:white;border:none;padding:5px;cursor:pointer;">Unfollow</button>`;
            li.querySelector('button').onclick = async () => {
                if (await unfollowUser(element)) li.remove();
            };
            list.appendChild(li);
        });

        const unfollowAllBtn = container.querySelector('#unfollowAllBtn');
        unfollowAllBtn.onclick = async () => {
            unfollowAllBtn.disabled = true;
            let unfollowedCount = 0;
            const total = nonFollowers.length;
            unfollowAllBtn.textContent = `Unfollowed ${unfollowedCount}/${total}`;

            for (const { element } of nonFollowers) {
                const success = await unfollowUser(element);
                if (success) {
                    unfollowedCount++;
                    unfollowAllBtn.textContent = `Unfollowed ${unfollowedCount}/${total}`;
                }
                await new Promise(r => setTimeout(r, 500));
            }

            console.log(`Unfollowed all ${unfollowedCount} non-followers`);
            alert(`Unfollowed ${unfollowedCount} non-followers. Refreshing page...`);
            location.reload();
        };
    }

    function getFollowingCount() {
        const countElement = document.querySelector(CONFIG.FOLLOWING_COUNT);
        const count = countElement ? parseInt(countElement.innerText.replace(/[^0-9]/g, '')) || 0 : 0;
        console.log(`Detected following count: ${count}`);
        return count > 10000 ? 10000 : count; // Cap at 10,000 as per TikTok's limit
    }

    async function quickScroll(selector = CONFIG.MODAL_CONTAINER) {
        const container = document.querySelector(selector);
        if (!container) {
            console.error(`No container found for ${selector}. Ensure the Following modal is open.`);
            return new Map();
        }

        const users = new Map();
        const totalTarget = getFollowingCount();
        const maxUsers = 10000; // Target up to 10,000 users
        const startTime = Date.now();
        let lastUserCount = 0;
        let noNewUsersCount = 0;
        const maxNoNewUsers = 120; // Extended to 24 seconds (120 * 200ms) for thoroughness
        let scrollPosition = 0;
        const uniqueButtonTexts = new Set();

        const observer = new MutationObserver(() => {
            try {
                document.querySelectorAll(CONFIG.USER_ITEM).forEach(item => {
                    const link = item.querySelector('a[href*="/@"]');
                    const button = item.querySelector('button');
                    if (link && button) {
                        const username = link.href.split('/@')[1].toLowerCase();
                        if (!users.has(username)) {
                            users.set(username, { element: item, button });
                            console.log(`Added ${username}, button text: "${button.innerText}"`);
                            uniqueButtonTexts.add(button.innerText);
                        }
                    }
                });
                updateProgressUI(users.size, totalTarget);
                if (users.size > lastUserCount) {
                    lastUserCount = users.size;
                    noNewUsersCount = 0;
                    const nonFollowers = getNonFollowers(users);
                    if (nonFollowers.length > 0) updateNonFollowerUI(nonFollowers);
                } else {
                    noNewUsersCount++;
                }
            } catch (error) {
                console.error("Mutation observer error:", error);
            }
        });
        observer.observe(container, { childList: true, subtree: true });

        console.log("Starting fast scroll to load up to 10,000 users...");
        while (users.size < maxUsers && noNewUsersCount < maxNoNewUsers) {
            try {
                scrollPosition += 1000; // Increased scroll step for faster coverage
                container.scrollTo({ top: scrollPosition, behavior: 'auto' });
                container.dispatchEvent(new Event('scroll', { bubbles: true }));
                container.dispatchEvent(new WheelEvent('wheel', { deltaY: 1000, bubbles: true, cancelable: true }));
                container.scrollTop += 1000;
                console.log(`Scroll attempt at ${Math.round((Date.now() - startTime) / 1000)}s, users: ${users.size}, position: ${scrollPosition}`);

                await new Promise(r => setTimeout(r, 200));

                if (users.size === lastUserCount && users.size > 0 && noNewUsersCount % 5 === 0) {
                    console.log("No new users loaded recently; aggressively jiggling scroll...");
                    container.scrollBy({ top: -500, behavior: 'auto' });
                    container.dispatchEvent(new WheelEvent('wheel', { deltaY: -500, bubbles: true }));
                    container.scrollTop -= 500;
                    await new Promise(r => setTimeout(r, 150));
                    container.scrollTo({ top: container.scrollHeight, behavior: 'auto' });
                    container.dispatchEvent(new WheelEvent('wheel', { deltaY: 1000, bubbles: true }));
                    container.scrollTop = container.scrollHeight;
                    await new Promise(r => setTimeout(r, 150));
                }
            } catch (error) {
                console.error("Scroll loop error:", error);
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        observer.disconnect();
        console.log(`Finished: Loaded ${users.size} users in ${Math.round((Date.now() - startTime) / 1000)} seconds`);
        console.log(`Unique button texts encountered: ${Array.from(uniqueButtonTexts).join(', ')}`);
        console.log(`Loop exited due to: ${users.size >= maxUsers ? 'reached 10,000 users' : 'no new users for ' + maxNoNewUsers + ' cycles'}`);
        return users;
    }

    function getNonFollowers(users) {
        const nonFollowers = [];
        users.forEach(({ element, button }, username) => {
            const btnText = button.innerText.toLowerCase();
            if (btnText.includes('following') && !btnText.includes('friends')) {
                console.log(`Checking ${username}: "${btnText}" (non-follower)`);
                nonFollowers.push({ username, element });
            }
        });
        console.log(`Found ${nonFollowers.length} non-followers`);
        return nonFollowers;
    }

    async function unfollowUser(element) {
        try {
            const button = element.querySelector('button');
            if (button && /following/i.test(button.innerText)) {
                button.click();
                await new Promise(r => setTimeout(r, 1000));
                console.log(`Unfollowed ${element.querySelector('a').href.split('/@')[1]}`);
                return true;
            }
            console.warn("No 'Following' button found");
            return false;
        } catch (error) {
            console.error("Unfollow error:", error);
            return false;
        }
    }

    (async () => {
        alert("Click the 'Following' count to open the modal. The script will load up to 10,000 users to find non-followers.");
        const container = await new Promise(resolve => {
            const check = setInterval(() => {
                const el = document.querySelector(CONFIG.MODAL_CONTAINER);
                if (el) {
                    clearInterval(check);
                    resolve(el);
                    console.log("Modal detected");
                }
            }, 500);
        });

        if (!container) {
            alert(`Following modal not found. Ensure you're on TikTok and the modal is open.`);
            return;
        }

        console.log("Loading initial users...");
        const users = await quickScroll(CONFIG.MODAL_CONTAINER);
        const nonFollowers = getNonFollowers(users);

        if (nonFollowers.length > 0) {
            updateNonFollowerUI(nonFollowers);
            alert(`Found ${nonFollowers.length} non-followers in ${users.size} loaded users. Check the list on the right.`);
        } else {
            alert(`No non-followers found in ${users.size} loaded users (out of ${getFollowingCount()}). If fewer than 10,000 loaded, TikTok may limit rendering; try 'Load More' or scroll manually to check all users.`);
        }

        const loadMoreBtn = document.createElement('button');
        loadMoreBtn.textContent = 'Load More';
        loadMoreBtn.style.cssText = 'position:fixed;bottom:10px;right:10px;background:#fe2c55;color:white;border:none;padding:10px;cursor:pointer;';
        loadMoreBtn.onclick = async () => {
            console.log("Loading more users...");
            const moreUsers = await quickScroll(CONFIG_MODAL_CONTAINER);
            if (moreUsers.size === 0) {
                alert("No more users loaded. Ensure the modal is still open.");
                return;
            }
            const moreNonFollowers = getNonFollowers(moreUsers);
            updateNonFollowerUI(moreNonFollowers);
        };
        document.body.appendChild(loadMoreBtn);
    })();
} else {
    console.log("Script already loaded. Refresh the page to run again.");
}