document.getElementById("check-followers").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || tabs.length === 0) {
            console.error("No active tab found.");
            return;
        }

        const activeTabId = tabs[0].id;
        console.log("Executing script on Tab ID:", activeTabId);

        chrome.scripting.executeScript({
            target: { tabId: activeTabId },
            files: ["content.js"]
        }, (results) => {
            if (chrome.runtime.lastError) {
                console.error("Error executing script:", chrome.runtime.lastError);
            } else {
                console.log("Script executed successfully:", results);
            }
        });
    });
});