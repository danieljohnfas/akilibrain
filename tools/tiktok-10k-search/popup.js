console.log('[TikTok Users Search - 10k Following] Popup initialized)';

const port = chrome.runtime.connect({
  name: "popup"
});

function fetchUsers() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('userList').style.display = 'none';
    document.getElementById('message').style.display = 'none';
    document.getElementById('refresh').style.display = 'block';

    const response = await chrome.runtime.sendMessage({
        type: "REQUEST_USERS",
        username: '',
        following: 0,
        followers: 0
    });

    if (response.status === 200) {
        const users = JSON.parse(response.text);
        processUsers(users);
    }
}

port.onmessage.addListener(function(message) {
    const data = JSON.parse(message.data);
    
    if (data.type === "REQUEST_USERS") {
        fetchUsers(data.users);
    } else if (data.message !== null && data.message.type === 'TEXT') {
        document.getElementById('message').textContent = data.message.text;
        return true;
    }
});
