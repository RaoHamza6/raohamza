// Global variables
let originalImageData = null;
let removedBgImageData = null;
let currentBackgroundColor = 'transparent';

// DOM elements
const uploadBox = document.getElementById('uploadBox');
const imageInput = document.getElementById('imageInput');
const previewSection = document.getElementById('previewSection');
const controlsSection = document.getElementById('controlsSection');
const originalImage = document.getElementById('originalImage');
const processedCanvas = document.getElementById('processedCanvas');
const loadingSpinner = document.getElementById('loadingSpinner');
const bgOptions = document.querySelectorAll('.bg-option');
const resetBtn = document.getElementById('resetBtn');
const downloadBtn = document.getElementById('downloadBtn');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');

// Event listeners
uploadBox.addEventListener('click', () => imageInput.click());
imageInput.addEventListener('change', handleImageUpload);
uploadBox.addEventListener('dragover', handleDragOver);
uploadBox.addEventListener('dragleave', handleDragLeave);
uploadBox.addEventListener('drop', handleDrop);

bgOptions.forEach(option => {
    option.addEventListener('click', () => {
        bgOptions.forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
        currentBackgroundColor = option.dataset.color;
        applyBackground();
    });
});

resetBtn.addEventListener('click', resetApp);
downloadBtn.addEventListener('click', downloadImage);

// Functions
function handleDragOver(e) {
    e.preventDefault();
    uploadBox.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadBox.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadBox.classList.remove('dragover');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
            processImage(file);
        } else {
            showError('Please upload a valid image file (JPG, PNG, WEBP)');
        }
    }
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        processImage(file);
    }
}

function processImage(file) {
    hideError();

    // Show preview section and controls
    previewSection.style.display = 'grid';
    controlsSection.style.display = 'block';

    // Display original image
    const reader = new FileReader();
    reader.onload = (e) => {
        originalImage.src = e.target.result;
        originalImageData = e.target.result;
    };
    reader.readAsDataURL(file);

    // Show loading spinner
    loadingSpinner.style.display = 'block';
    processedCanvas.style.display = 'none';

    // Remove background using Flask API
    removeBackground(file);
}

async function removeBackground(file) {
    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch('http://127.0.0.1:5000/remove-bg', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            // Try to parse error message from JSON response
            let errorMsg = 'Failed to remove background';
            try {
                const errorData = await response.json();
                if (errorData.error) {
                    errorMsg = errorData.error;
                }
            } catch (e) {
                // If JSON parsing fails, use default message
                errorMsg = `Server error (${response.status})`;
            }
            throw new Error(errorMsg);
        }

        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);

        // Load the image to get its data
        const img = new Image();
        img.onload = () => {
            removedBgImageData = img;
            loadingSpinner.style.display = 'none';
            processedCanvas.style.display = 'block';
            applyBackground();
        };
        img.src = imageUrl;

    } catch (error) {
        console.error('Error:', error);
        loadingSpinner.style.display = 'none';
        showError(error.message);
    }
}

function applyBackground() {
    if (!removedBgImageData) return;

    const ctx = processedCanvas.getContext('2d');

    // Set canvas size to match image
    processedCanvas.width = removedBgImageData.width;
    processedCanvas.height = removedBgImageData.height;

    // Fill background with selected color
    if (currentBackgroundColor !== 'transparent') {
        const colors = {
            'white': '#FFFFFF',
            'red': '#ef4444',
            'blue': '#3b82f6'
        };

        ctx.fillStyle = colors[currentBackgroundColor];
        ctx.fillRect(0, 0, processedCanvas.width, processedCanvas.height);
    }

    // Draw the image with removed background
    ctx.drawImage(removedBgImageData, 0, 0);
}

function downloadImage() {
    if (!processedCanvas) return;

    const link = document.createElement('a');
    link.download = `background-removed-${Date.now()}.png`;
    link.href = processedCanvas.toDataURL('image/png');
    link.click();
}

function resetApp() {
    // Reset variables
    originalImageData = null;
    removedBgImageData = null;
    currentBackgroundColor = 'transparent';

    // Reset UI
    imageInput.value = '';
    previewSection.style.display = 'none';
    controlsSection.style.display = 'none';

    // Reset active background option
    bgOptions.forEach(opt => opt.classList.remove('active'));
    bgOptions[0].classList.add('active');

    hideError();
}

function showError(message) {
    errorText.textContent = message;
    errorText.style.whiteSpace = 'pre-line'; // Preserve line breaks
    errorMessage.style.display = 'flex';
}

function hideError() {
    errorMessage.style.display = 'none';
}
