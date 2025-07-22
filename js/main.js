// Global variables
let scene, camera, renderer, cube;
let orientationActive = false;
let faceDetectionActive = false;
let handDetectionActive = false;
let handModel = null;
let video;

// --- 1. THREE.JS CUBE ---------------
function initThreeJS() {
    // Scene and Camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, 600/480, 0.1, 1000);
    camera.position.z = 5;

    // Renderer
    renderer = new THREE.WebGLRenderer({canvas: document.getElementById("cube-canvas"), antialias: true});
    renderer.setClearColor(0x333333);

    // Cube
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

    // Animation loop
    function animate() {
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    animate();
}

// --- 2. DEVICE ORIENTATION ON MOBILE ---------------
function initDeviceOrientation() {
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', (event) => {
            if (!orientationActive) return;
            const {alpha, beta, gamma} = event;
            if (beta !== null && gamma !== null && alpha !== null) {
                cube.rotation.x = beta * Math.PI / 180;
                cube.rotation.y = gamma * Math.PI / 180;
                cube.rotation.z = alpha * Math.PI / 180;
                updateStatus('orientation-status', `x:${beta.toFixed(1)}, y:${gamma.toFixed(1)}, z:${alpha.toFixed(1)}`);
            }
        });
        orientationActive = true;
        updateStatus('orientation-status', "Active");
    } else {
        updateStatus('orientation-status', "Not supported");
    }
}

// --- 3. FACE DETECTION -------------------
async function enableFaceDetection() {
    const button = document.getElementById('enable-face');
    button.disabled = true;
    button.innerText = "Loading...";

    try {
        // Load models from local /models folder
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('models'),
            faceapi.nets.faceLandmark68Net.loadFromUri('models'),
            faceapi.nets.faceExpressionNet.loadFromUri('models')
        ]);
        video = document.getElementById('video');
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        await video.play();
        video.addEventListener('playing', onFaceVideoPlaying, { once: true });
    } catch(err) {
        updateStatus('face-status', "Setup Failed");
        button.innerText = "Enable Face Detection";
        button.disabled = false;
        alert("Face detection model or camera load failed!\n" + err);
    }
}
function onFaceVideoPlaying() {
    faceDetectionActive = true;
    detectFaces();
    updateStatus('face-status', "Active");
    const button = document.getElementById('enable-face');
    button.innerText = "Disable Face Detection";
    button.onclick = disableFaceDetection;
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
            const [nx, ny] = [landmarks.getNose()[3].x, landmarks.getNose()[3].y];
            // Map nose position to cube rotation
            const rotY = ((nx / video.videoWidth) - 0.5) * 2;
            const rotX = ((ny / video.videoHeight) - 0.5) * 2;
            cube.rotation.y += (rotY - cube.rotation.y) * 0.12;
            cube.rotation.x += (rotX - cube.rotation.x) * 0.12;
            updateStatus('face-status', `X:${nx.toFixed(0)} Y:${ny.toFixed(0)}`);
        } else {
            updateStatus('face-status', "No face");
        }
    } catch (e) {
        updateStatus('face-status', "Detection error");
    }
    if (faceDetectionActive) requestAnimationFrame(detectFaces);
}
function disableFaceDetection() {
    faceDetectionActive = false;
    if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(track=>track.stop());
        video.srcObject = null;
    }
    updateStatus('face-status', "Disabled");
    const button = document.getElementById('enable-face');
    button.innerText = "Enable Face Detection";
    button.onclick = enableFaceDetection;
}

// --- 4. HAND DETECTION -------------------
async function enableHandDetection() {
    const button = document.getElementById('enable-hand');
    button.disabled = true;
    button.innerText = "Loading...";
    try {
        if (!handModel) {
            handModel = await handTrack.load({ flipHorizontal:true, maxNumBoxes:1 });
        }
        // Use the same video element as face detection
        video = document.getElementById('video');
        if (!video.srcObject) {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
            await video.play();
        }
        video.addEventListener('playing', onHandVideoPlaying, { once:true });
        // If already playing, start detection immediately
        if (video.readyState >= 3) onHandVideoPlaying();
    } catch(e) {
        updateStatus('hand-status','Setup failed');
        button.innerText = "Enable Hand Detection";
        button.disabled = false;
        alert("Hand detection load failed!\n" + e);
    }
}
function onHandVideoPlaying() {
    handDetectionActive = true;
    detectHand();
    updateStatus('hand-status', "Active");
    const button = document.getElementById('enable-hand');
    button.innerText = "Disable Hand Detection";
    button.onclick = disableHandDetection;
}
async function detectHand() {
    if (!handDetectionActive) return;
    try {
        const predictions = await handModel.detect(video);
        if (predictions && predictions.length > 0) {
            const hand = predictions[0];
            const centerX = hand.bbox[0] + hand.bbox[2] / 2;
            const centerY = hand.bbox[1] + hand.bbox[3] / 2;
            const rotY = ((centerX / video.videoWidth) - 0.5) * 3;
            const rotX = ((centerY / video.videoHeight) - 0.5) * 3;
            cube.rotation.y += (rotY - cube.rotation.y) * 0.14;
            cube.rotation.x += (rotX - cube.rotation.x) * 0.14;
            updateStatus('hand-status', `X:${centerX.toFixed(0)} Y:${centerY.toFixed(0)}`);
        } else {
            updateStatus('hand-status', "No hand");
        }
    } catch (e) {
        updateStatus('hand-status', "Detection error");
    }
    if (handDetectionActive) setTimeout(detectHand, 150);
}
function disableHandDetection() {
    handDetectionActive = false;
    if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(track=>track.stop());
        video.srcObject = null;
    }
    updateStatus('hand-status', "Disabled");
    const button = document.getElementById('enable-hand');
    button.innerText = "Enable Hand Detection";
    button.onclick = enableHandDetection;
}

// --- 5. UTILITIES -------------------
function updateStatus(id, text) {
    const elem = document.getElementById(id);
    if (elem) elem.innerText = text;
}
function resetCube() {
    cube.rotation.set(0,0,0);
}

// --- 6. INIT ------------------------
window.onload = () => {
    initThreeJS();
    initDeviceOrientation();
    updateStatus('face-status','Disabled');
    updateStatus('hand-status','Disabled');
};
