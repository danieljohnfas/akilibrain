const imageFolder = '/newimages/';
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
    } else {
        img.src = ''; // Clear image if no more available
    }

    updatePagination();
}

// Create pagination buttons
function updatePagination() {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';

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
        loadIma
