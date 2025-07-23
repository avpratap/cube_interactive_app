// // Global variables
// let scene, camera, renderer, cube;
// let orientationActive = false;
// let faceDetectionActive = false;
// let handDetectionActive = false;
// let handModel = null;
// let video;

// // For smooth animation
// let targetRotationX = 0;
// let targetRotationY = 0;
// const rotationSmoothing = 0.10; // Smoothness factor for real-time feel

// // For manual rotation
// let isDragging = false;
// let lastMouseX = 0, lastMouseY = 0;
// let manualX = 0, manualY = 0;
// let usingManual = false;

// // --- 1. THREE.JS CUBE ---------------
// function initThreeJS() {
//     // Scene and Camera
//     scene = new THREE.Scene();
//     camera = new THREE.PerspectiveCamera(75, 600/480, 0.1, 1000);
//     camera.position.z = 5;

//     // Renderer
//     renderer = new THREE.WebGLRenderer({canvas: document.getElementById("cube-canvas"), antialias: true});
//     renderer.setClearColor(0x333333);

//     // Cube
//     const cubeGeo = new THREE.BoxGeometry(2,2,2);
//     const materials = [
//         new THREE.MeshLambertMaterial({color: 0xff5555}),
//         new THREE.MeshLambertMaterial({color: 0x55ff55}),
//         new THREE.MeshLambertMaterial({color: 0x5555ff}),
//         new THREE.MeshLambertMaterial({color: 0xffff55}),
//         new THREE.MeshLambertMaterial({color: 0xff55ff}),
//         new THREE.MeshLambertMaterial({color: 0x55ffff}),
//     ];
//     cube = new THREE.Mesh(cubeGeo, materials);
//     scene.add(cube);

//     // Lighting
//     scene.add(new THREE.AmbientLight(0xffffff, .5));
//     let dLight = new THREE.DirectionalLight(0xffffff,.5);
//     dLight.position.set(5,10,7);
//     scene.add(dLight);

//     // Manual rotation events
//     const canvas = renderer.domElement;
    
//     // Mouse events
//     canvas.addEventListener("mousedown", e => {
//         isDragging = true;
//         usingManual = true;
//         lastMouseX = e.clientX;
//         lastMouseY = e.clientY;
//     });
    
//     window.addEventListener("mousemove", e => {
//         if (!isDragging) return;
//         const deltaX = e.clientX - lastMouseX;
//         const deltaY = e.clientY - lastMouseY;
//         manualY += deltaX * 0.01;
//         manualX += deltaY * 0.01;
//         lastMouseX = e.clientX;
//         lastMouseY = e.clientY;
//     });
    
//     window.addEventListener("mouseup", () => {
//         isDragging = false;
//         // Resume auto detection after 1 second of no manual input
//         setTimeout(() => { usingManual = false; }, 1000);
//     });

//     // Touch events for mobile
//     canvas.addEventListener("touchstart", e => {
//         if (e.touches.length !== 1) return;
//         isDragging = true;
//         usingManual = true;
//         lastMouseX = e.touches[0].clientX;
//         lastMouseY = e.touches[0].clientY;
//         e.preventDefault();
//     }, { passive: false });
    
//     canvas.addEventListener("touchmove", e => {
//         if (!isDragging || e.touches.length !== 1) return;
//         const deltaX = e.touches[0].clientX - lastMouseX;
//         const deltaY = e.touches[0].clientY - lastMouseY;
//         manualY += deltaX * 0.01;
//         manualX += deltaY * 0.01;
//         lastMouseX = e.touches[0].clientX;
//         lastMouseY = e.touches[0].clientY;
//         e.preventDefault();
//     }, { passive: false });
    
//     window.addEventListener("touchend", () => {
//         isDragging = false;
//         setTimeout(() => { usingManual = false; }, 1000);
//     });

//     // Smooth animation loop
//     function animate() {
//         if (usingManual) {
//             // Use manual rotation when user is dragging
//             cube.rotation.x += (manualX - cube.rotation.x) * 0.2;
//             cube.rotation.y += (manualY - cube.rotation.y) * 0.2;
//         } else {
//             // Use detection targets with smooth interpolation
//             cube.rotation.x += (targetRotationX - cube.rotation.x) * rotationSmoothing;
//             cube.rotation.y += (targetRotationY - cube.rotation.y) * rotationSmoothing;
//         }
//         renderer.render(scene, camera);
//         requestAnimationFrame(animate);
//     }
//     animate();
// }

// // --- Webcam video on page load ---------------
// async function startWebcam() {
//     try {
//         video = document.getElementById('video');
//         const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//         video.srcObject = stream;
//         await video.play();
//     } catch (err) {
//         alert('Cannot access webcam: ' + err);
//     }
// }

// // --- 2. DEVICE ORIENTATION ON MOBILE ---------------
// function initDeviceOrientation() {
//     if (window.DeviceOrientationEvent) {
//         window.addEventListener('deviceorientation', (event) => {
//             if (!orientationActive) return;
//             const {alpha, beta, gamma} = event;
//             if (beta !== null && gamma !== null && alpha !== null) {
//                 targetRotationX = beta * Math.PI / 180;
//                 targetRotationY = gamma * Math.PI / 180;
//                 cube.rotation.z = alpha * Math.PI / 180;
//                 updateStatus('orientation-status', `x:${beta.toFixed(1)}, y:${gamma.toFixed(1)}, z:${alpha.toFixed(1)}`);
//             }
//         });
//         orientationActive = true;
//         updateStatus('orientation-status', "Active");
//     } else {
//         updateStatus('orientation-status', "Not supported");
//     }
// }

// // --- 3. FACE DETECTION -------------------
// async function enableFaceDetection() {
//     const button = document.getElementById('enable-face');
//     button.disabled = true;
//     button.innerText = "Loading...";

//     try {
//         // Load models from local /models folder
//         await Promise.all([
//             faceapi.nets.tinyFaceDetector.loadFromUri('models'),
//             faceapi.nets.faceLandmark68Net.loadFromUri('models'),
//             faceapi.nets.faceExpressionNet.loadFromUri('models')
//         ]);
//         video = document.getElementById('video');
//         // If webcam is not already started, start it
//         if (!video.srcObject) {
//             const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//             video.srcObject = stream;
//             await video.play();
//         }
//         video.addEventListener('playing', onFaceVideoPlaying, { once: true });
//         // If already playing, start detection immediately
//         if (video.readyState >= 3) onFaceVideoPlaying();
//     } catch(err) {
//         updateStatus('face-status', "Setup Failed");
//         button.innerText = "Enable Face Detection";
//         button.disabled = false;
//         alert("Face detection model or camera load failed!\n" + err);
//     }
// }

// function onFaceVideoPlaying() {
//     faceDetectionActive = true;
//     detectFaces();
//     updateStatus('face-status', "Active");
//     const button = document.getElementById('enable-face');
//     button.innerText = "Disable Face Detection";
//     button.onclick = disableFaceDetection;
// }

// async function detectFaces() {
//     if (!faceDetectionActive) return;
//     try {
//         const result = await faceapi
//             .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
//             .withFaceLandmarks()
//             .withFaceExpressions();

//         if (result) {
//             const { landmarks } = result;
//             const [nx, ny] = [landmarks.getNose()[3].x, landmarks.getNose()[3].y];
//             // Map nose position to target rotation (not direct cube rotation)
//             targetRotationY = ((nx / video.videoWidth) - 0.5) * 2;
//             targetRotationX = ((ny / video.videoHeight) - 0.5) * 2;
//             updateStatus('face-status', `X:${nx.toFixed(0)} Y:${ny.toFixed(0)}`);
//         } else {
//             updateStatus('face-status', "No face");
//         }
//     } catch (e) {
//         updateStatus('face-status', "Detection error");
//     }
//     if (faceDetectionActive) setTimeout(detectFaces, 80); // ~12 fps for smooth performance
// }

// function disableFaceDetection() {
//     faceDetectionActive = false;
//     if (video && video.srcObject) {
//         video.srcObject.getTracks().forEach(track=>track.stop());
//         video.srcObject = null;
//     }
//     updateStatus('face-status', "Disabled");
//     const button = document.getElementById('enable-face');
//     button.innerText = "Enable Face Detection";
//     button.onclick = enableFaceDetection;
// }

// // --- 4. HAND DETECTION -------------------
// async function enableHandDetection() {
//     const button = document.getElementById('enable-hand');
//     button.disabled = true;
//     button.innerText = "Loading...";
    
//     try {
//         // Better error handling and model loading
//         const modelParams = {
//             flipHorizontal: true,
//             maxNumBoxes: 1,
//             iouThreshold: 0.5,
//             scoreThreshold: 0.6
//         };
        
//         if (!handModel) {
//             // Check if handTrack is available
//             if (typeof handTrack === 'undefined') {
//                 throw new Error('handTrack library not loaded. Make sure to include handtrack.min.js');
//             }
//             handModel = await handTrack.load(modelParams);
//         }
        
//         // Use the same video element as face detection
//         video = document.getElementById('video');
//         if (!video.srcObject) {
//             const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//             video.srcObject = stream;
//             await video.play();
//         }
//         video.addEventListener('playing', onHandVideoPlaying, { once:true });
//         // If already playing, start detection immediately
//         if (video.readyState >= 3) onHandVideoPlaying();
        
//     } catch(e) {
//         console.error('Hand detection error:', e);
//         updateStatus('hand-status','Setup failed');
//         button.innerText = "Enable Hand Detection";
//         button.disabled = false;
//         alert("Hand detection load failed!\n" + e.message);
//     }
// }

// function onHandVideoPlaying() {
//     handDetectionActive = true;
//     detectHand();
//     updateStatus('hand-status', "Active");
//     const button = document.getElementById('enable-hand');
//     button.innerText = "Disable Hand Detection";
//     button.onclick = disableHandDetection;
// }

// async function detectHand() {
//     if (!handDetectionActive) return;
//     try {
//         const predictions = await handModel.detect(video);
//         if (predictions && predictions.length > 0) {
//             const hand = predictions[0];
//             const centerX = hand.bbox[0] + hand.bbox[2] / 2;
//             const centerY = hand.bbox[1] + hand.bbox[3] / 2;
//             // Map hand position to target rotation (not direct cube rotation)
//             targetRotationY = ((centerX / video.videoWidth) - 0.5) * 3;
//             targetRotationX = ((centerY / video.videoHeight) - 0.5) * 3;
//             updateStatus('hand-status', `X:${centerX.toFixed(0)} Y:${centerY.toFixed(0)}`);
//         } else {
//             updateStatus('hand-status', "No hand");
//         }
//     } catch (e) {
//         console.error('Hand detection error:', e);
//         updateStatus('hand-status', "Detection error");
//     }
//     if (handDetectionActive) setTimeout(detectHand, 80); // ~12 fps for smooth performance
// }

// function disableHandDetection() {
//     handDetectionActive = false;
//     if (video && video.srcObject) {
//         video.srcObject.getTracks().forEach(track=>track.stop());
//         video.srcObject = null;
//     }
//     updateStatus('hand-status', "Disabled");
//     const button = document.getElementById('enable-hand');
//     button.innerText = "Enable Hand Detection";
//     button.onclick = enableHandDetection;
// }

// // --- 5. UTILITIES -------------------
// function updateStatus(id, text) {
//     const elem = document.getElementById(id);
//     if (elem) elem.innerText = text;
// }

// function resetCube() {
//     cube.rotation.set(0,0,0);
//     targetRotationX = 0;
//     targetRotationY = 0;
//     manualX = 0;
//     manualY = 0;
//     usingManual = false;
// }

// // --- 6. INIT ------------------------
// window.onload = () => {
//     initThreeJS();
//     initDeviceOrientation();
//     updateStatus('face-status','Disabled');
//     updateStatus('hand-status','Disabled');
//     startWebcam(); // Start webcam and show video on page load
// };






// Global variables for simple approach
let scene, camera, renderer, cube;
let orientationActive = false;
let faceDetectionActive = false;
let handDetectionActive = false;
let handModel = null;
let video;

// For smooth animation
let targetRotationX = 0;
let targetRotationY = 0;
const rotationSmoothing = 0.10;

// For manual rotation
let isDragging = false;
let lastMouseX = 0, lastMouseY = 0;
let manualX = 0, manualY = 0;
let usingManual = false;

// Performance monitoring
let frameCount = 0;
let lastTime = Date.now();
let fps = 60;

// --- Initialize Three.js ---
function initThreeJS() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, 600/480, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById("cube-canvas"),
        antialias: true
    });
    renderer.setClearColor(0x1e293b);

    // Create cube
    const cubeGeo = new THREE.BoxGeometry(2,2,2);
    const materials = [
        new THREE.MeshLambertMaterial({color: 0xff5555}),
        new THREE.MeshLambertMaterial({color: 0x55ff55}),
        new THREE.MeshLambertMaterial({color: 0x5555ff}),
        new THREE.MeshLambertMaterial({color: 0xffff55}),
        new THREE.MeshLambertMaterial({color: 0xff55ff}),
        new THREE.MeshLambertMaterial({color: 0x55ffff}),
    ];
    cube = new THREE.Mesh(cubeGeo, materials);
    scene.add(cube);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, .5));
    let dLight = new THREE.DirectionalLight(0xffffff,.5);
    dLight.position.set(5,10,7);
    scene.add(dLight);

    // Manual controls
    setupManualControls();
    
    // Start animation
    animate();
}

function setupManualControls() {
    const canvas = renderer.domElement;
    
    canvas.addEventListener("mousedown", e => {
        isDragging = true;
        usingManual = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    });
    
    window.addEventListener("mousemove", e => {
        if (!isDragging) return;
        const deltaX = e.clientX - lastMouseX;
        const deltaY = e.clientY - lastMouseY;
        manualY += deltaX * 0.01;
        manualX += deltaY * 0.01;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    });
    
    window.addEventListener("mouseup", () => {
        isDragging = false;
        setTimeout(() => { usingManual = false; }, 1000);
    });

    // Touch events
    canvas.addEventListener("touchstart", e => {
        if (e.touches.length !== 1) return;
        isDragging = true;
        usingManual = true;
        lastMouseX = e.touches[0].clientX;
        lastMouseY = e.touches[0].clientY;
        e.preventDefault();
    }, { passive: false });
    
    canvas.addEventListener("touchmove", e => {
        if (!isDragging || e.touches.length !== 1) return;
        const deltaX = e.touches[0].clientX - lastMouseX;
        const deltaY = e.touches[0].clientY - lastMouseY;
        manualY += deltaX * 0.01;
        manualX += deltaY * 0.01;
        lastMouseX = e.touches[0].clientX;
        lastMouseY = e.touches[0].clientY;
        e.preventDefault();
    }, { passive: false });
    
    window.addEventListener("touchend", () => {
        isDragging = false;
        setTimeout(() => { usingManual = false; }, 1000);
    });
}

function animate() {
    // FPS monitoring
    frameCount++;
    const currentTime = Date.now();
    if (currentTime - lastTime >= 1000) {
        fps = frameCount;
        frameCount = 0;
        lastTime = currentTime;
        updateElement('fps-counter', fps);
    }

    // Smooth rotation
    if (usingManual) {
        cube.rotation.x += (manualX - cube.rotation.x) * 0.2;
        cube.rotation.y += (manualY - cube.rotation.y) * 0.2;
    } else {
        cube.rotation.x += (targetRotationX - cube.rotation.x) * rotationSmoothing;
        cube.rotation.y += (targetRotationY - cube.rotation.y) * rotationSmoothing;
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

// --- Webcam ---
async function startWebcam() {
    try {
        video = document.getElementById('video');
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        await video.play();
        
        const recordingDot = document.getElementById('recording-dot');
        if (recordingDot) {
            recordingDot.style.display = 'block';
        }
        
        updateConnectionStatus(true);
    } catch (err) {
        console.error('Webcam error:', err);
        alert('Cannot access webcam: ' + err.message);
    }
}

// --- Device Orientation ---
function initDeviceOrientation() {
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', handleDeviceOrientation);
        orientationActive = true;
        updateStatus('orientation-status', 'Active', 'active');
        updateButton('enable-orientation', true);
    } else {
        updateStatus('orientation-status', 'Not supported', 'disabled');
    }
}

function handleDeviceOrientation(event) {
    if (!orientationActive) return;
    
    const {alpha, beta, gamma} = event;
    if (beta !== null && gamma !== null && alpha !== null) {
        targetRotationX = beta * Math.PI / 180;
        targetRotationY = gamma * Math.PI / 180;
        cube.rotation.z = alpha * Math.PI / 180;
        updateStatus('orientation-status', `α:${alpha.toFixed(1)}° β:${beta.toFixed(1)}° γ:${gamma.toFixed(1)}°`, 'active');
    }
}

// --- Face Detection ---
async function enableFaceDetection() {
    const button = document.getElementById('enable-face');
    button.disabled = true;
    updateButtonText(button, 'Loading...');
    showLoading('Loading face detection models...');

    try {
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('models'),
            faceapi.nets.faceLandmark68Net.loadFromUri('models'),
            faceapi.nets.faceExpressionNet.loadFromUri('models')
        ]);

        if (!video.srcObject) {
            await startWebcam();
        }

        faceDetectionActive = true;
        detectFaces();
        updateStatus('face-status', 'Active', 'active');
        updateButton('enable-face', true);
        button.disabled = false;
        hideLoading();
        
    } catch(err) {
        console.error('Face detection error:', err);
        updateStatus('face-status', 'Setup Failed', 'error');
        updateButton('enable-face', false);
        button.disabled = false;
        hideLoading();
        alert("Face detection failed: " + err.message);
    }
}

async function detectFaces() {
    if (!faceDetectionActive) return;
    
    try {
        const result = await faceapi
            .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions();

        if (result) {
            const { landmarks } = result;
            const nose = landmarks.getNose()[3];
            targetRotationY = ((nose.x / video.videoWidth) - 0.5) * 2;
            targetRotationX = ((nose.y / video.videoHeight) - 0.5) * 2;
            updateStatus('face-status', `Tracking: ${nose.x.toFixed(0)}, ${nose.y.toFixed(0)}`, 'active');
            updateElement('detection-rate', '12 FPS');
        } else {
            updateStatus('face-status', 'No face detected', 'active');
        }
    } catch (e) {
        updateStatus('face-status', 'Detection error', 'error');
    }
    
    if (faceDetectionActive) {
        setTimeout(detectFaces, 80);
    }
}

function disableFaceDetection() {
    faceDetectionActive = false;
    updateStatus('face-status', 'Disabled', 'disabled');
    updateButton('enable-face', false);
}

// --- Hand Detection ---
async function enableHandDetection() {
    const button = document.getElementById('enable-hand');
    button.disabled = true;
    updateButtonText(button, 'Loading...');
    showLoading('Loading hand detection model...');
    
    try {
        if (!handModel) {
            if (typeof handTrack === 'undefined') {
                throw new Error('HandTrack library not loaded');
            }
            
            const modelParams = {
                flipHorizontal: true,
                maxNumBoxes: 1,
                iouThreshold: 0.5,
                scoreThreshold: 0.6
            };
            
            handModel = await handTrack.load(modelParams);
        }

        if (!video.srcObject) {
            await startWebcam();
        }

        handDetectionActive = true;
        detectHands();
        updateStatus('hand-status', 'Active', 'active');
        updateButton('enable-hand', true);
        button.disabled = false;
        hideLoading();
        
    } catch(e) {
        console.error('Hand detection error:', e);
        updateStatus('hand-status', 'Setup failed', 'error');
        updateButton('enable-hand', false);
        button.disabled = false;
        hideLoading();
        alert("Hand detection failed: " + e.message);
    }
}

async function detectHands() {
    if (!handDetectionActive) return;
    
    try {
        const predictions = await handModel.detect(video);
        
        if (predictions && predictions.length > 0) {
            const hand = predictions[0];
            const centerX = hand.bbox[0] + hand.bbox[2] / 2;
            const centerY = hand.bbox[1] + hand.bbox[3] / 2;
            
            targetRotationY = ((centerX / video.videoWidth) - 0.5) * 3;
            targetRotationX = ((centerY / video.videoHeight) - 0.5) * 3;
            
            updateStatus('hand-status', `Tracking: ${centerX.toFixed(0)}, ${centerY.toFixed(0)}`, 'active');
            updateElement('detection-rate', '12 FPS');
        } else {
            updateStatus('hand-status', 'No hand detected', 'active');
        }
    } catch (e) {
        updateStatus('hand-status', 'Detection error', 'error');
    }
    
    if (handDetectionActive) {
        setTimeout(detectHands, 80);
    }
}

function disableHandDetection() {
    handDetectionActive = false;
    updateStatus('hand-status', 'Disabled', 'disabled');
    updateButton('enable-hand', false);
}

// --- Button Functions (Called by HTML onclick) ---
function toggleFaceDetection() {
    console.log('Face button clicked'); // Debug
    if (faceDetectionActive) {
        disableFaceDetection();
    } else {
        enableFaceDetection();
    }
}

function toggleHandDetection() {
    console.log('Hand button clicked'); // Debug
    if (handDetectionActive) {
        disableHandDetection();
    } else {
        enableHandDetection();
    }
}

function toggleOrientation() {
    console.log('Orientation button clicked'); // Debug
    orientationActive = !orientationActive;
    const status = orientationActive ? 'Active' : 'Disabled';
    const statusClass = orientationActive ? 'active' : 'disabled';
    updateStatus('orientation-status', status, statusClass);
    updateButton('enable-orientation', orientationActive);
}

function resetCube() {
    console.log('Reset button clicked'); // Debug
    cube.rotation.set(0,0,0);
    targetRotationX = 0;
    targetRotationY = 0;
    manualX = 0;
    manualY = 0;
    usingManual = false;
    
    // Visual feedback
    const resetBtn = document.getElementById('reset-cube');
    if (resetBtn) {
        resetBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            resetBtn.style.transform = 'scale(1)';
        }, 150);
    }
}

// --- Utility Functions ---
function updateStatus(elementId, text, statusClass = '') {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
        element.className = `status-value ${statusClass}`;
    }
}

function updateButton(buttonId, isActive) {
    const button = document.getElementById(buttonId);
    if (button) {
        const btnText = button.querySelector('.btn-text');
        const btnIcon = button.querySelector('.btn-icon');
        
        if (btnText && btnIcon) {
            if (isActive) {
                button.classList.add('active');
                btnText.textContent = 'Disable';
                btnIcon.className = 'fas fa-stop btn-icon';
            } else {
                button.classList.remove('active');
                btnText.textContent = 'Enable';
                btnIcon.className = 'fas fa-play btn-icon';
            }
        }
    }
}

function updateButtonText(button, text) {
    const btnText = button.querySelector('.btn-text');
    if (btnText) {
        btnText.textContent = text;
    }
}

function updateElement(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    }
}

function updateConnectionStatus(isConnected) {
    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
        statusElement.style.background = isConnected ? '#10b981' : '#ef4444';
    }
}

function showLoading(text = 'Loading...') {
    const overlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    if (overlay && loadingText) {
        loadingText.textContent = text;
        overlay.classList.add('show');
    }
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
}

// --- Initialize Application ---
window.onload = () => {
    console.log('Page loaded, initializing...'); // Debug
    
    // Initialize components
    initThreeJS();
    initDeviceOrientation();
    startWebcam();
    
    // Initialize status displays
    updateStatus('face-status', 'Disabled', 'disabled');
    updateStatus('hand-status', 'Disabled', 'disabled');
    
    console.log('Initialization complete'); // Debug
};
