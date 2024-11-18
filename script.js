const imageFolder = 'newimages/';
const totalImages = 200;
const imagesPerSet = 10;
const totalSets = Math.ceil(totalImages / imagesPerSet);
const imageList = Array.from({ length: totalImages }, (_, i) => `newphoto${i + 1}.jpg`);
let currentSet = 0;
let zoomedIn = false;

// Load images for the current set
function loadImagesForSet() {
    const startIndex = currentSet * imagesPerSet;
    const img = document.getElementById('current-image');

    if (startIndex < imageList.length) {
        img.src = `${imageFolder}${imageList[startIndex]}`;
        img.onload = () => console.log("Loaded image:", img.src);
    }

    updatePagination();
}

// Create pagination buttons
function updatePagination() {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = ''; // Clear existing buttons

    for (let i = 0; i < totalSets; i++) {
        const button = document.createElement('button');
        button.textContent = i + 1;
        button.className = 'page-button';
        button.onclick = () => goToSet(i);

        if (i === currentSet) {
            button.classList.add('active');
        }

        paginationContainer.appendChild(button);
    }
}

// Navigate to a specific set by index
function goToSet(setIndex) {
    if (setIndex >= 0 && setIndex < totalSets) {
        currentSet = setIndex;
        loadImagesForSet();
    }
}

// Initial load of the first set
loadImagesForSet();

// Download functionality
function downloadImage() {
    const link = document.createElement('a');
    link.href = document.getElementById('current-image').src;
    link.download = `downloaded-image.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Share functionality
function shareImage() {
    const imgSrc = document.getElementById('current-image').src;
    if (navigator.share) {
        navigator.share({
            title: "Here's my favorite image - check out more at https://bitch.asia",
            url: imgSrc
        }).catch(console.error);
    } else {
        alert("Share functionality is not supported in this browser.");
    }
}

// Zoom and navigate functionality
document.getElementById('image-container').addEventListener('click', function() {
    const img = document.getElementById('current-image');
    if (!zoomedIn) {
        img.style.transform = 'scale(2)';
        img.style.cursor = 'zoom-out';
        zoomedIn = true;
    } else {
        img.style.transform = 'scale(1)';
        img.style.cursor = 'zoom-in';
        loadImagesForSet();
        zoomedIn = false;
    }
});
