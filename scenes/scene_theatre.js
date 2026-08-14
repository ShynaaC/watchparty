import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { initRoomUI } from "../ui/room.js";
import { initSeatUI } from "../ui/seats.js";

const MODEL_PATH = "./assets/popcorn.glb";
const TWEEN_DURATION = 1.2;

const OVERVIEW_CAMERA = {
    position: [13, 44, -70],
    lookAt: [13, 25, -18]
};

// const SCREEN_CENTER = [13.5, 35, -54];
const SCREEN_CENTER = [13.5, 35, -70]; //for screen pos
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
    { id: "A1", position: [-1, 29, -12], cameraPosition: [-1, 34, -10], lookAt: [13.5, 32, -70] },
    { id: "A2", position: [9, 29, -12], cameraPosition: [9, 31, -10], lookAt: [13.5, 32, -70] },
    { id: "A3", position: [19, 29, -12], cameraPosition: [19, 31, -10], lookAt: [13.5, 32, -70] },
    { id: "A4", position: [29, 29, -12], cameraPosition: [29, 34, -10],lookAt: [13.5, 32, -70] },

 { id: "B1", position: [-1, 24, -26], cameraPosition: [-1, 26, -21], lookAt: [13.5, 32, -70] },
    { id: "B2", position: [9, 24, -26], cameraPosition: [9, 26, -21], lookAt: [13.5, 32, -70] },
    { id: "B3", position: [19, 24, -26], cameraPosition: [19, 26, -21], lookAt: [13.5, 32, -70] },
    { id: "B4", position: [29, 24, -26], cameraPosition: [29, 26, -21], lookAt: [13.5, 32, -70] },
];

const canvas = document.getElementById("experience-canvas");

let renderer;
let scene;
let camera;
let controls;
let clock;
let raycaster;
let mouse;
let animationFrameId = null;

let seatMeshes = [];
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
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        2000
    );

    camera.position.set(...OVERVIEW_CAMERA.position);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(...OVERVIEW_CAMERA.lookAt);
    controls.update();

    clock = new THREE.Clock();
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    addLighting();
    addScreen();
    addSeatHitboxes();
    loadTheatreModel();

    seatUI = initSeatUI({
        onSit: (seat) => {
            startTween(seat.cameraPosition, seat.lookAt, false);
            controls.enabled = false;
        },
        onStandUp: () => {
            startTween(OVERVIEW_CAMERA.position, OVERVIEW_CAMERA.lookAt, true);
        }
    });

    roomUI = initRoomUI({
        onScreenStream: setScreenStream
    });

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("click", onClick);
    window.addEventListener("keydown", onKeyDown);

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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
    scene.add(ambientLight);

    const frontLight = new THREE.DirectionalLight(0xffffff, 4);
    frontLight.position.set(0, 80, -250);
    frontLight.target.position.set(0, 20, 0);
    frontLight.castShadow = true;
    frontLight.shadow.mapSize.width = 4096;
    frontLight.shadow.mapSize.height = 4096;
    frontLight.shadow.normalBias = 0.2;

    scene.add(frontLight.target);
    scene.add(frontLight);
}

function addScreen() {
    const screenGeometry = new THREE.PlaneGeometry(34, 19);

    screenMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        side: THREE.DoubleSide
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
    if (event.key !== "p") {
        return;
    }

    console.log("position:", camera.position.toArray());
    console.log("target:", controls.target.toArray());
}

function animate() {
    animationFrameId = requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (tweenActive) {
        updateTween(delta);
    } else {
        controls.update();
    }

    renderer.render(scene, camera);
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

    seatUI?.cleanup();
    roomUI?.cleanup();
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
