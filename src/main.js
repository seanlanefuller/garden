import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { World } from './world.js';
import { Vegetation } from './vegetation.js';
import { Sky } from './sky.js';
import { Structures } from './structures.js';
import { Fauna } from './fauna.js';
import { MapData } from './mapData.js';
import { AudioController } from './audio.js';
import { Terrain } from './terrain.js';

// Global Variables
let camera, scene, renderer, controls, fauna, audioController, terrain, structures;
let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

// Fly Mode Variables
let isFlying = false;
let flySpeed = 4000;
let moveUp = false;
let moveDown = false;

const mapData = new MapData();

async function init() {
    // Scene Setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 0, 4000);

    // Load Map Data
    try {
        await mapData.load('/map.png');
        // mapData.debugVisualize(scene);
    } catch (e) {
        console.error("Failed to load map data", e);
    }

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(305, 10, 2435); // User requested start position
    // camera.lookAt(new THREE.Vector3(305, 10, 0)); // Look North roughly

    // Audio
    audioController = new AudioController(camera, scene);
    audioController.init();

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('app').appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(100, 200, 100);
    scene.add(dirLight);

    // Controls
    setupControls();

    // Terrain (Splat Map)
    terrain = new Terrain(scene);
    terrain.init();

    // Initialize Modules
    // Pass mapData to them eventually
    const world = new World(scene); // Todo: pass mapData
    world.init();

    const vegetation = new Vegetation(scene, mapData);
    vegetation.init();

    const sky = new Sky(scene);
    sky.init();

    structures = new Structures(scene);
    structures.init();

    fauna = new Fauna(scene);
    fauna.init();

    // Add water sounds to scene
    audioController.waterSounds.forEach(soundObj => scene.add(soundObj));

    // Resize Handler
    window.addEventListener('resize', onWindowResize, false);

    // Start Loop
    animate();
}

function setupControls() {
    controls = new PointerLockControls(camera, document.body);
    const instructions = document.getElementById('instructions');
    instructions.addEventListener('click', () => {
        controls.lock();
        audioController.resume();
    });
    controls.addEventListener('lock', () => { instructions.style.display = 'none'; });
    controls.addEventListener('unlock', () => { instructions.style.display = 'block'; });
    scene.add(controls.object);

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
}

// Moving them to be defined as functions is fine.

init();


// Event Handlers
const onKeyDown = function (event) {
    switch (event.code) {
        case 'KeyT':
            toggleTeleportMenu();
            break;
        case 'KeyW':
            moveForward = true;
            break;
        case 'KeyA':
            moveLeft = true;
            break;
        case 'KeyS':
            moveBackward = true;
            break;
        case 'KeyD':
            moveRight = true;
            break;
        case 'ArrowUp':
            if (isFlying) moveUp = true;
            break;
        case 'ArrowDown':
            if (isFlying) moveDown = true;
            break;
        case 'ArrowRight':
            if (isFlying) {
                flySpeed += 100;
                updateFlySpeedUI();
            }
            break;
        case 'ArrowLeft':
            if (isFlying) {
                flySpeed = Math.max(100, flySpeed - 100);
                updateFlySpeedUI();
            }
            break;
        case 'Space':
            if (canJump === true && !isFlying) velocity.y += 350;
            canJump = false;
            break;
        case 'KeyF':
            isFlying = !isFlying;
            velocity.y = 0; // Reset vertical velocity when toggling
            document.getElementById('fly-speed').style.display = isFlying ? 'block' : 'none';
            updateFlySpeedUI();
            break;
    }
};

function toggleTeleportMenu() {
    const menu = document.getElementById('teleport-menu');
    if (menu.style.display === 'flex') {
        menu.style.display = 'none';
        controls.lock();
    } else {
        menu.style.display = 'flex';
        controls.unlock();
        populateTeleportMenu();
    }
}

function populateTeleportMenu() {
    // Need access to structures.locationManager
    // Solution: Make structures global or access via scene traversal? 
    // Easier: structures was created in init. Let's make it global.
    if (!structures || !structures.locationManager) return;

    const menu = document.getElementById('teleport-menu');
    // Keep header, clear items
    menu.innerHTML = '<h2>Teleport to Location</h2>';

    structures.locationManager.locations.forEach(loc => {
        const item = document.createElement('div');
        item.className = 'teleport-item';
        item.innerHTML = `<span>${loc.id}. ${loc.name}</span>`;
        item.onclick = () => {
            teleportTo(loc.mapX, loc.mapY);
        };
        menu.appendChild(item);
    });
}

function teleportTo(mapX, mapY) {
    if (!structures) return;
    const pos = structures.locationManager.getWorldPosition(mapX, mapY);
    camera.position.set(pos.x, 10, pos.z);

    // Close menu
    document.getElementById('teleport-menu').style.display = 'none';
    controls.lock();
}

const onKeyUp = function (event) {
    switch (event.code) {
        case 'KeyW':
            moveForward = false;
            break;
        case 'KeyA':
            moveLeft = false;
            break;
        case 'KeyS':
            moveBackward = false;
            break;
        case 'KeyD':
            moveRight = false;
            break;
        case 'ArrowUp':
            moveUp = false;
            break;
        case 'ArrowDown':
            moveDown = false;
            break;
    }
};

function updateFlySpeedUI() {
    document.getElementById('fly-speed').innerText = `Speed: ${flySpeed}`;
}

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    if (controls.isLocked === true) {

        if (isFlying) {
            // Fly Mode Physics
            const speed = flySpeed * delta;

            direction.z = Number(moveForward) - Number(moveBackward);
            direction.x = Number(moveRight) - Number(moveLeft);
            direction.normalize();

            // WASD moves in standard planar direction
            if (moveForward || moveBackward) controls.moveForward(direction.z * speed);
            if (moveLeft || moveRight) controls.moveRight(direction.x * speed);

            // Arrows move Up/Down
            if (moveUp) controls.object.position.y += speed;
            if (moveDown) controls.object.position.y -= speed;

        } else {
            // Walking Mode Physics
            velocity.x -= velocity.x * 10.0 * delta;
            velocity.z -= velocity.z * 10.0 * delta;
            velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

            direction.z = Number(moveForward) - Number(moveBackward);
            direction.x = Number(moveRight) - Number(moveLeft);
            direction.normalize();

            // Calculate potential next position
            // This is simplified. Ideally we should use a proper collision system.
            // But for this, we can check if the terrain type is valid.

            if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
            if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

            const speedMultiplier = (mapData.getTerrainType(controls.object.position.x, controls.object.position.z) === 'PATH' ||
                mapData.getTerrainType(controls.object.position.x, controls.object.position.z) === 'ROAD') ? 1.5 : 1.0;

            controls.moveRight(-velocity.x * delta * speedMultiplier);
            controls.moveForward(-velocity.z * delta * speedMultiplier);

            // Constraint Check: Did we walk into Water or Forest?
            // If so, push back? Or bounce?
            // Simple approach: Check new position.
            const terrain = mapData.getTerrainType(controls.object.position.x, controls.object.position.z);
            if (terrain === 'WATER' || terrain === 'FOREST') {
                // Illegal move. Teleport back?
                // Or just bounce back.
                // Reversing is hard because we used moveRight/moveForward which is relative.
                // Let's try to just undo the move?
                controls.moveRight(velocity.x * delta * speedMultiplier);
                controls.moveForward(velocity.z * delta * speedMultiplier);
                // Kill velocity
                velocity.x = 0;
                velocity.z = 0;
            }

            controls.object.position.y += (velocity.y * delta);
        }

        // Constraints
        if (controls.object.position.y < 10) {
            velocity.y = 0;
            controls.object.position.y = 10;
            canJump = true;
        }
    }

    // Minimap & HUD Update
    if (controls.object) {
        const playerPos = controls.object.position;
        const playerMarker = document.getElementById('player-marker');
        const coordsDisplay = document.getElementById('coords');

        // Map world pos to minimap pos (assuming 10000x10000 world and 200x200 minimap)
        // World: -5000 to 5000 => 0 to 10000 => / 50 => 0 to 200
        const mapX = (playerPos.x + 5000) / 50;
        const mapY = (playerPos.z + 5000) / 50;

        if (playerMarker) {
            playerMarker.style.left = `${mapX}px`;
            playerMarker.style.top = `${mapY}px`;
        }

        if (coordsDisplay) {
            coordsDisplay.innerText = `X: ${Math.round(playerPos.x)} Y: ${Math.round(playerPos.y)} Z: ${Math.round(playerPos.z)}`;
        }
    }

    prevTime = time;

    renderer.render(scene, camera);

    fauna.update(time / 1000, delta);
    terrain.update(time / 1000);
}

// Handle Window Resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
