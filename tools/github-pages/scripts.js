const imageFolder = '/newimages/'; // Ensure this matches the GitHub Pages folder
const totalImages = 200;
const imagesPerSet = 20; // Display 20 images per page
const totalSets = Math.ceil(totalImages / imagesPerSet);
const imageList = Array.from({ length: totalImages }, (_, i) => `newphoto${i + 1}.jpg`);
let currentSet = 0;

// Load 20 images for the current set
function loadImagesForSet() {
    const startIndex = currentSet * imagesPerSet;
    const endIndex = Math.min(startIndex + imagesPerSet, imageList.length);
    const imageContainer = document.getElementById('image-container');

    // Clear previous images
    imageContainer.innerHTML = `<div id="watermark">https://bitch.asia</div>`;

    // Add images dynamically
    for (let i = startIndex; i < endIndex; i++) {
        const img = document.createElement('img');
        img.src = `${imageFolder}${imageList[i]}`;
        img.alt = `Image ${i + 1}`;
        img.className = 'gallery-image';
        img.onclick = () => zoomImage(i); // Add zoom functionality
        imageContainer.appendChild(img);
    }

    updatePagination();
}

// Zoom functionality
function zoomImage(imageIndex) {
    const overlay = document.createElement('div');
    overlay.id = 'zoom-overlay';

    const imgContainer = document.createElement('div');
    imgContainer.id = 'zoom-image-container';

    const img = document.createElement('img');
    img.src = `${imageFolder}${imageList[imageIndex]}`;
    img.className = 'zoomed-image';

    // Add buttons
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.className = 'close-button';
    closeButton.onclick = () => document.body.removeChild(overlay);

    const prevButton = document.createElement('button');
    prevButton.textContent = 'Previous';
    prevButton.className = 'nav-button prev-button';
    prevButton.onclick = () => {
        const newIndex = (imageIndex - 1 + imageList.length) % imageList.length;
        img.src = `${imageFolder}${imageList[newIndex]}`;
        imageIndex = newIndex;
    };

    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.className = 'nav-button next-button';
    nextButton.onclick = () => {
        const newIndex = (imageIndex + 1) % imageList.length;
        img.src = `${imageFolder}${imageList[newIndex]}`;
        imageIndex = newIndex;
    };

    const actionContainer = document.createElement('div');
    actionContainer.className = 'action-buttons-container';

    const downloadButton = document.createElement('button');
    downloadButton.textContent = 'Download';
    downloadButton.className = 'action-button';
    downloadButton.onclick = () => downloadImage(img.src);

    const shareButton = document.createElement('button');
    shareButton.textContent = 'Share';
    shareButton.className = 'action-button';
    shareButton.onclick = () => shareImage(img.src);

    // Append buttons to action container
    actionContainer.appendChild(downloadButton);
    actionContainer.appendChild(shareButton);

    // Append buttons and image
    imgContainer.appendChild(prevButton);
    imgContainer.appendChild(img);
    imgContainer.appendChild(nextButton);

    overlay.appendChild(closeButton);
    overlay.appendChild(imgContainer);
    overlay.appendChild(actionContainer);

    document.body.appendChild(overlay);
}

// Download functionality
function downloadImage(imageSrc) {
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = 'downloaded-image.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Share functionality
function shareImage(imageSrc) {
    if (navigator.share) {
        navigator.share({
            title: 'Image Share',
            url: imageSrc,
        }).catch(console.error);
    } else {
        alert('Share not supported in this browser.');
    }
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

// Navigate to a specific set
function goToSet(setIndex) {
    if (setIndex >= 0 && setIndex < totalSets) {
        currentSet = setIndex;
        loadImagesForSet();
    }
}

// Initial load
loadImagesForSet();
