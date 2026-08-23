import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { initPanelUI } from "../ui/panels.js";
import { initRoomUI } from "../ui/room.js";
import { initSeatUI } from "../ui/seats.js";

const MODEL_PATH = "./assets/popcorn.glb";
const TWEEN_DURATION = 1.2;
const MOOD_LIGHT_SPEED = 0.018;
const CAMERA_MOVE_SPEED = 16;
const CAMERA_ROTATE_SPEED = 1.25;

const OVERVIEW_CAMERA = {
    position: [13, 44, -70],
    lookAt: [13, 25, -18]
};

const SCREEN_CENTER = [13.5, 38, -76];
const SCREEN_SIZE = [58, 32.625];
const SCREEN_LOOK_AT = [13.5, 38, -76];
const CAMERA_FOV = 36;

const FOCUS_SCREEN_CAMERA = {
    position: [13.5, 38, -20],
    lookAt: SCREEN_LOOK_AT
};
//for seat sphere pos and camer pan on selection
// const SEATS = [
//     { id: "A1", position: [-1, 29, -12], cameraPosition: [-1, 40, -4], lookAt: [-1, 30, -54] },
//     { id: "A2", position: [9, 29, -12], cameraPosition: [9, 27, -4], lookAt: [9, 40, -54] },
//     { id: "A3", position: [19, 29, -12], cameraPosition: [19, 27, -4], lookAt: [19, 34, -54] },
//     { id: "A4", position: [29, 29, -12], cameraPosition: [29, 27, -4],lookAt: [29, 34, -54] },
//
//  { id: "B1", position: [-1, 24, -26], cameraPosition: [-1, 25, -17], lookAt: [-1, 34, -44] },
//     { id: "B2", position: [9, 24, -26], cameraPosition: [9, 25, -17], lookAt: [9, 34, -44] },
//     { id: "B3", position: [19, 24, -26], cameraPosition: [19, 25, -17], lookAt: [19, 34, -44] },
//     { id: "B4", position: [29, 24, -26], cameraPosition: [29, 25, -17], lookAt: [29, 34, -44] },
// ];

const SEATS = [
    { id: "A1", position: [-1, 29, -12], cameraPosition: [7, 34, -9], lookAt: SCREEN_LOOK_AT },
    { id: "A2", position: [9, 29, -12], cameraPosition: [11, 32, -9], lookAt: SCREEN_LOOK_AT },
    { id: "A3", position: [19, 29, -12], cameraPosition: [16, 32, -9], lookAt: SCREEN_LOOK_AT },
    { id: "A4", position: [29, 29, -12], cameraPosition: [20, 34, -9], lookAt: SCREEN_LOOK_AT },

    { id: "B1", position: [-1, 24, -26], cameraPosition: [7, 28, -20], lookAt: SCREEN_LOOK_AT },
    { id: "B2", position: [9, 24, -26], cameraPosition: [11, 27, -20], lookAt: SCREEN_LOOK_AT },
    { id: "B3", position: [19, 24, -26], cameraPosition: [16, 27, -20], lookAt: SCREEN_LOOK_AT },
    { id: "B4", position: [29, 24, -26], cameraPosition: [20, 28, -20], lookAt: SCREEN_LOOK_AT },
];

const MOOD_LIGHTS = [
    { position: [-20, 64, -24], target: [7, 24, -31], hue: 0.62, pulse: 0, intensity: 220 },
    { position: [47, 64, -24], target: [20, 24, -31], hue: 0.57, pulse: 1.2, intensity: 205 },
    { position: [13.5, 68, -8], target: [13.5, 27, -42], hue: 0.74, pulse: 2.4, intensity: 190 },
    { position: [13.5, 58, -78], target: [13.5, 28, -18], hue: 0.9, pulse: 3.6, intensity: 170 }
];

const CAMERA_KEYS = new Set([
    "KeyW",
    "KeyA",
    "KeyS",
    "KeyD",
    "KeyQ",
    "KeyE",
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight"
]);

const canvas = document.getElementById("experience-canvas");
const landingScreen = document.getElementById("landing-screen");

let renderer;
let scene;
let camera;
let controls;
let clock;
let raycaster;
let mouse;
let animationFrameId = null;

let seatMeshes = [];
let moodLights = [];
let pressedKeys = new Set();
let panelUI = null;
let seatUI = null;
let roomUI = null;

let screenMaterial = null;
let screenTexture = null;
let screenVideo = null;

let tweenActive = false;
let tweenT = 0;
let enableControlsAfterTween = true;

const tweenStart = {
    pos: new THREE.Vector3(),
    look: new THREE.Vector3()
};

const tweenEnd = {
    pos: new THREE.Vector3(),
    look: new THREE.Vector3()
};

export function init({ renderer: sharedRenderer }) {
    renderer = sharedRenderer;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    camera = new THREE.PerspectiveCamera(
        CAMERA_FOV,
        window.innerWidth / window.innerHeight,
        0.1,
        2000
    );

    camera.position.set(...OVERVIEW_CAMERA.position);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 18;
    controls.maxDistance = 96;
    controls.minPolarAngle = 0.72;
    controls.maxPolarAngle = 1.42;
    controls.target.set(...OVERVIEW_CAMERA.lookAt);
    controls.update();

    clock = new THREE.Clock();
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    addLighting();
    addMoodLights();
    addTheatreEnclosure();
    addScreen();
    addSeatHitboxes();
    loadTheatreModel();

    seatUI = initSeatUI({
        onSit: (seat) => {
            startTween(seat.cameraPosition, seat.lookAt, true);
            controls.enabled = false;
        },
        onFocusScreen: (isFocused, seat) => {
            const cameraPosition = isFocused
                ? FOCUS_SCREEN_CAMERA.position
                : seat.cameraPosition;
            const lookAt = isFocused
                ? FOCUS_SCREEN_CAMERA.lookAt
                : seat.lookAt;

            pressedKeys.clear();
            startTween(cameraPosition, lookAt, true);
            controls.enabled = false;
        },
        onStandUp: () => {
            pressedKeys.clear();
            startTween(OVERVIEW_CAMERA.position, OVERVIEW_CAMERA.lookAt, true);
        }
    });

    roomUI = initRoomUI({
        onScreenStream: setScreenStream
    });

    panelUI = initPanelUI();

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("click", onClick);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    animate();
}

export function resize() {
    if (!camera) {
        return;
    }

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}

function addLighting() {
    const ambientLight = new THREE.AmbientLight(0x061226, 0.18);
    scene.add(ambientLight);

    const frontLight = new THREE.DirectionalLight(0x7f92c8, 1.15);
    frontLight.position.set(0, 80, -250);
    frontLight.target.position.set(0, 20, 0);
    frontLight.castShadow = true;
    frontLight.shadow.mapSize.width = 4096;
    frontLight.shadow.mapSize.height = 4096;
    frontLight.shadow.normalBias = 0.2;

    scene.add(frontLight.target);
    scene.add(frontLight);
}

function addMoodLights() {
    MOOD_LIGHTS.forEach((config) => {
        const color = new THREE.Color().setHSL(config.hue, 0.7, 0.15);
        const light = new THREE.SpotLight(
            color,
            config.intensity,
            230,
            Math.PI / 2.45,
            0.9,
            0.82
        );
        const target = new THREE.Object3D();

        light.position.set(...config.position);
        target.position.set(...config.target);
        light.target = target;
        light.castShadow = false;

        scene.add(light);
        scene.add(target);

        moodLights.push({
            light,
            target,
            baseHue: config.hue,
            pulse: config.pulse,
            baseIntensity: config.intensity
        });
    });
}

function addTheatreEnclosure() {
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x02050d,
        roughness: 1,
        metalness: 0,
        side: THREE.DoubleSide
    });

    addWall("Screen Wall", [120, 92], [13.5, 34, -98], [0, 0, 0], wallMaterial);
    addWall("Back Wall", [120, 92], [13.5, 34, 18], [0, 0, 0], wallMaterial);
    addWall("Left Wall", [118, 92], [-38, 34, -40], [0, Math.PI / 2, 0], wallMaterial);
    addWall("Right Wall", [118, 92], [65, 34, -40], [0, Math.PI / 2, 0], wallMaterial);
    addWall("Ceiling", [120, 118], [13.5, 78, -40], [Math.PI / 2, 0, 0], wallMaterial);
}

function addWall(name, size, position, rotation, material) {
    const wall = new THREE.Mesh(
        new THREE.PlaneGeometry(...size),
        material.clone()
    );

    wall.name = name;
    wall.position.set(...position);
    wall.rotation.set(...rotation);
    wall.receiveShadow = true;

    scene.add(wall);
}

function addScreen() {
    const screenGeometry = new THREE.PlaneGeometry(...SCREEN_SIZE);

    screenMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        side: THREE.DoubleSide,
        toneMapped: false
    });

    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(...SCREEN_CENTER);
    screen.name = "Screen";
    scene.add(screen);
}

function addSeatHitboxes() {
    SEATS.forEach((seat) => {
        const hitbox = new THREE.Mesh(
            new THREE.SphereGeometry(1.7, 16, 10),
            new THREE.MeshBasicMaterial({
                color: 0xf0bd57,
                transparent: true,
                opacity: 0.32,
                depthWrite: false
            })
        );

        hitbox.position.set(...seat.position);
        hitbox.userData.seatData = seat;

        scene.add(hitbox);
        seatMeshes.push(hitbox);
    });
}

function loadTheatreModel() {
    const loader = new GLTFLoader();

    loader.load(
        MODEL_PATH,
        (gltf) => {
            const theatre = gltf.scene;
            scene.add(theatre);

            theatre.traverse((object) => {
                if (!object.isMesh) {
                    return;
                }

                object.castShadow = true;
                object.receiveShadow = true;
            });
        },
        (progress) => {
            if (progress.total) {
                const pct = (progress.loaded / progress.total) * 100;
                console.log(`Loading theatre: ${pct.toFixed(0)}%`);
            }
        },
        (error) => {
            console.error("Error loading theatre model:", error);
        }
    );
}

function setScreenStream(stream) {
    disposeScreenTexture();

    if (!stream) {
        screenMaterial.color.set(0x000000);
        screenMaterial.map = null;
        screenMaterial.needsUpdate = true;
        return;
    }

    screenVideo = document.createElement("video");
    screenVideo.srcObject = stream;
    screenVideo.muted = true;
    screenVideo.playsInline = true;
    screenVideo.autoplay = true;

    screenTexture = new THREE.VideoTexture(screenVideo);
    screenTexture.colorSpace = THREE.SRGBColorSpace;
    screenTexture.minFilter = THREE.LinearFilter;
    screenTexture.magFilter = THREE.LinearFilter;
    screenTexture.generateMipmaps = false;
    screenTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    screenMaterial.color.set(0xffffff);
    screenMaterial.map = screenTexture;
    screenMaterial.needsUpdate = true;

    screenVideo.play().catch(() => {
        console.warn("Screen video playback was blocked by the browser.");
    });
}

function onMouseMove(event) {
    const rect = canvas.getBoundingClientRect();

    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(seatMeshes, false);

    seatUI.setHoveredSeat(hits[0]?.object.userData.seatData || null);
}

function onClick() {
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(seatMeshes, false);

    if (hits.length > 0) {
        seatUI.sitInSeat(hits[0].object.userData.seatData);
    }
}

function onKeyDown(event) {
    if (isTypingInField(event.target)) {
        return;
    }

    if (event.key === "p") {
        console.log("position:", camera.position.toArray());
        console.log("target:", controls.target.toArray());
        return;
    }

    if (CAMERA_KEYS.has(event.code)) {
        event.preventDefault();
        pressedKeys.add(event.code);
    }
}

function onKeyUp(event) {
    pressedKeys.delete(event.code);
}

function animate() {
    animationFrameId = requestAnimationFrame(animate);

    const delta = clock.getDelta();
    updateMoodLights(clock.elapsedTime);

    if (tweenActive) {
        updateTween(delta);
    } else {
        updateKeyboardCamera(delta);
        controls.update();
    }

    renderer.render(scene, camera);
}

function updateKeyboardCamera(delta) {
    if (
        !controls.enabled ||
        !landingScreen.classList.contains("hidden") ||
        pressedKeys.size === 0
    ) {
        return;
    }

    const move = new THREE.Vector3();
    const forward = new THREE.Vector3()
        .subVectors(controls.target, camera.position)
        .setY(0)
        .normalize();
    const right = new THREE.Vector3()
        .crossVectors(forward, camera.up)
        .normalize();

    if (pressedKeys.has("KeyW") || pressedKeys.has("ArrowUp")) {
        move.add(forward);
    }

    if (pressedKeys.has("KeyS") || pressedKeys.has("ArrowDown")) {
        move.sub(forward);
    }

    if (pressedKeys.has("KeyD")) {
        move.add(right);
    }

    if (pressedKeys.has("KeyA")) {
        move.sub(right);
    }

    if (move.lengthSq() > 0) {
        move.normalize().multiplyScalar(CAMERA_MOVE_SPEED * delta);
        camera.position.add(move);
        controls.target.add(move);
    }

    let rotation = 0;

    if (pressedKeys.has("ArrowLeft") || pressedKeys.has("KeyQ")) {
        rotation += CAMERA_ROTATE_SPEED * delta;
    }

    if (pressedKeys.has("ArrowRight") || pressedKeys.has("KeyE")) {
        rotation -= CAMERA_ROTATE_SPEED * delta;
    }

    if (rotation !== 0) {
        const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
        offset.applyAxisAngle(camera.up, rotation);
        camera.position.copy(controls.target).add(offset);
        camera.lookAt(controls.target);
    }
}

function isTypingInField(target) {
    return (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
    );
}

function updateMoodLights(elapsedTime) {
    moodLights.forEach(({ light, baseHue, pulse, baseIntensity }) => {
        const hue = (baseHue + elapsedTime * MOOD_LIGHT_SPEED) % 1;
        const brightness = 0.14 + Math.sin(elapsedTime * 0.9 + pulse) * 0.025;
        const intensity = baseIntensity + Math.sin(elapsedTime * 0.8 + pulse) * 35;

        light.color.setHSL(hue, 0.72, brightness);
        light.intensity = intensity;
    });
}

function startTween(toPos, toLook, enableControlsAtEnd) {
    tweenStart.pos.copy(camera.position);
    tweenStart.look.copy(controls.target);

    tweenEnd.pos.set(...toPos);
    tweenEnd.look.set(...toLook);

    tweenT = 0;
    tweenActive = true;
    enableControlsAfterTween = enableControlsAtEnd;
}

function updateTween(delta) {
    tweenT += delta / TWEEN_DURATION;

    const eased = easeInOutCubic(Math.min(tweenT, 1));
    const currentLook = new THREE.Vector3().lerpVectors(
        tweenStart.look,
        tweenEnd.look,
        eased
    );

    camera.position.lerpVectors(tweenStart.pos, tweenEnd.pos, eased);
    camera.lookAt(currentLook);

    if (tweenT < 1) {
        return;
    }

    tweenActive = false;
    controls.target.copy(tweenEnd.look);
    controls.enabled = enableControlsAfterTween;
    controls.update();
}

function easeInOutCubic(t) {
    return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function disposeScreenTexture() {
    if (screenVideo) {
        screenVideo.pause();
        screenVideo.srcObject = null;
        screenVideo = null;
    }

    if (screenTexture) {
        screenTexture.dispose();
        screenTexture = null;
    }
}

export function cleanup() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    canvas.removeEventListener("mousemove", onMouseMove);
    canvas.removeEventListener("click", onClick);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);

    seatUI?.cleanup();
    roomUI?.cleanup();
    panelUI?.cleanup();
    disposeScreenTexture();

    controls?.dispose();

    if (scene) {
        scene.traverse((object) => {
            if (!object.isMesh) {
                return;
            }

            object.geometry?.dispose();

            const materials = Array.isArray(object.material)
                ? object.material
                : [object.material];

            materials.forEach((material) => material?.dispose());
        });

        scene.clear();
    }

    seatMeshes = [];
    moodLights = [];
    pressedKeys = new Set();
    panelUI = null;
    seatUI = null;
    roomUI = null;
    scene = null;
    camera = null;
    controls = null;
    clock = null;
    raycaster = null;
    mouse = null;
    screenMaterial = null;
}
