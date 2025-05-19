import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x60B5E6);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Scene and camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(7, 2, -20);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 20;
controls.maxDistance = 40;
controls.minPolarAngle = 0.6;
controls.maxPolarAngle = 1.5;
controls.target = new THREE.Vector3(0, 1, 0);
controls.update();

// Ground
const groundGeometry = new THREE.PlaneGeometry(40, 40);
groundGeometry.rotateX(-Math.PI / 2);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, side: THREE.DoubleSide });
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);


// Lights
const directionalLight = new THREE.DirectionalLight(0xffffff, 5);
directionalLight.position.set(10, 10, 0);
scene.add(directionalLight);

const spotLight = new THREE.SpotLight(0xffffff, 3000, 10, 0.22, 1);
spotLight.position.set(0, 25, 0);
scene.add(spotLight);

const ambientLight = new THREE.AmbientLight(0x404040, 10);
scene.add(ambientLight);

// Raycaster and pointer
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const raycastObjects = [];

// GLTF model reference
let modelMesh;
let targetScale = 1; // target scaling factor
const clock = new THREE.Clock();

// Load GLTF model
const loader = new GLTFLoader().setPath('public/fwog/');
loader.load(
  'lowpolytree.gltf',
  (gltf) => {
    console.log('loading model');
    const mesh = gltf.scene;
    modelMesh = mesh;

    mesh.traverse((child) => {
      if (child.isMesh) {
        if (child.name.toLowerCase().includes("sign")) {
          raycastObjects.push(child);
        }
      }
    });

    mesh.position.set(0, -3, -1);
    scene.add(mesh);

    const progressContainer = document.getElementById('progress-container');
    if (progressContainer) progressContainer.style.display = 'none';

    updateTargetScale(); // set initial scale based on viewport
  },
  (xhr) => {
    console.log(`loading ${(xhr.loaded / xhr.total) * 100}%`);
  },
  (error) => {
    console.error(error);
  }
);

// Resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  updateTargetScale();
});

// Animate
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  controls.update();

  if (modelMesh) {
    const currentScale = modelMesh.scale.x;
    const lerpSpeed = 5; // higher = faster

    const newScale = THREE.MathUtils.lerp(currentScale, targetScale, delta * lerpSpeed);
    modelMesh.scale.set(newScale, newScale, newScale);
  }

  renderer.render(scene, camera);
}
animate();

// Click-based raycasting
window.addEventListener("click", (e) => {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(raycastObjects);

  if (intersects.length > 0) {
    console.log("Clicked on sign object:", intersects[0].object.name);
    showPopup(intersects[0].object.name);
  }
});

// Hover-based raycasting for cursor pointer
window.addEventListener("mousemove", (e) => {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(raycastObjects);

  document.body.style.cursor = intersects.length > 0 ? "pointer" : "default";
});

// Create popup HTML and CSS
const popup = document.createElement("div");
popup.id = "popup-overlay";
popup.innerHTML = `
  <div class="popup-content">
    <span id="close-popup">&times;</span>
    <h2>Information</h2>
    <p>This is a popup message triggered by clicking a sign object!</p>
  </div>
`;
document.body.appendChild(popup);

document.getElementById("close-popup").onclick = () => {
  popup.style.display = "none";
};

// Function to show the popup
function showPopup(objectName) {
  const content = popup.querySelector("p");
  content.innerText = `YEEEEE idk what to put here`;
  popup.style.display = "flex";
}

// Inject popup styles
const style = document.createElement("style");
style.innerHTML = `
  #popup-overlay {
    display: none;
    position: fixed;
    top: 0; left: 0;
    width: 100vw; height: 100vh;
    background: rgba(0, 0, 0, 0.7);
    justify-content: center;
    align-items: center;
    z-index: 9999;
  }
  .popup-content {
    background: #ffffff;
    padding: 20px 30px;
    border-radius: 12px;
    text-align: center;
    max-width: 400px;
    width: 90%;
    height: auto;
    box-shadow: 0 0 30px rgba(0,0,0,0.4);
    position: relative;
  }
  .popup-content h2 {
    margin-top: 0;
    font-size: 1.5rem;
  }
  .popup-content p {
    margin-bottom: 20px;
    font-size: 1rem;
  }
  #close-popup {
    position: absolute;
    top: 10px; right: 15px;
    cursor: pointer;
    font-size: 24px;
    font-weight: bold;
  }

  @media (max-width: 480px) {
    .popup-content {
      padding: 15px 20px;
      width: 80%;
    }
    .popup-content h2 {
      font-size: 1.25rem;
    }
    .popup-content p {
      font-size: 0.95rem;
    }
    #close-popup {
      font-size: 22px;
      top: 8px;
      right: 12px;
    }
  }
`;
document.head.appendChild(style);

// Update target scale based on viewport
function updateTargetScale() {
  targetScale = window.innerWidth < 1000 ? 0.25 : 1;
}
