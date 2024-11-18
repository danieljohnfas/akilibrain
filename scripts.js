const imageFolder = './newimages/';
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

    const img = document.createElement('img');
    img.src = `${imageFolder}${imageList[imageIndex]}`;
    img.className = 'zoomed-image';

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.className = 'close-button';
    closeButton.onclick = () => document.body.removeChild(overlay);

    // Add navigation buttons
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

    overlay.appendChild(img);
    overlay.appendChild(closeButton);
    overlay.appendChild(prevButton);
    overlay.appendChild(nextButton);
    document.body.appendChild(overlay);
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

// Download the first image in the set
function downloadImage() {
    const firstImage = document.querySelector('.gallery-image');
    if (firstImage) {
        const link = document.createElement('a');
        link.href = firstImage.src;
        link.download = 'downloaded-image.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Share the first image in the set
function shareImage() {
    const firstImage = document.querySelector('.gallery-image');
    if (firstImage) {
        const imgSrc = firstImage.src;
        if (navigator.share) {
            navigator.share({
                title: 'Image Share',
                url: imgSrc,
            }).catch(console.error);
        } else {
            alert('Share not supported in this browser.');
        }
    }
}

// Initial load
loadImagesForSet();
