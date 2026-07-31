// import * as THREE from "three";

// import { OrbitControls } from
//     "three/addons/controls/OrbitControls.js";

// import { GLTFLoader } from
//     "three/addons/loaders/GLTFLoader.js";


// // ==========================================
// // CONFIGURATION
// // ==========================================

// const MODEL_PATH =
//     "./assets/popcorn.glb";


// // ==========================================
// // DOM ELEMENTS
// // ==========================================

// const canvas =
//     document.getElementById("experience-canvas");

// const landingScreen =
//     document.getElementById("landing-screen");

// const enterButton =
//     document.getElementById("enter-theatre");


// // ==========================================
// // GLOBALS
// // ==========================================

// let renderer;
// let scene;
// let camera;
// let controls;


// // ==========================================
// // INIT
// // ==========================================

// export function init({ renderer: sharedRenderer }) {

//     // ==========================================
//     // RECEIVE SHARED RENDERER FROM MAIN.JS
//     // ==========================================

//     renderer = sharedRenderer;


//     // ==========================================
//     // RENDERER SETTINGS
//     // ==========================================

//     renderer.setSize(
//         window.innerWidth,
//         window.innerHeight
//     );

//     renderer.setPixelRatio(
//         Math.min(
//             window.devicePixelRatio,
//             2
//         )
//     );


//     // ==========================================
//     // COLOR MANAGEMENT
//     // ==========================================

//     renderer.outputColorSpace =
//         THREE.SRGBColorSpace;

//     renderer.toneMapping =
//         THREE.ACESFilmicToneMapping;

//     renderer.toneMappingExposure =
//         1.85;


//     // ==========================================
//     // SHADOWS
//     // ==========================================

//     renderer.shadowMap.enabled =
//         true;

//     renderer.shadowMap.type =
//         THREE.PCFSoftShadowMap;


//     // ==========================================
//     // SCENE
//     // ==========================================

//     scene =
//         new THREE.Scene();

//     scene.background =
//         new THREE.Color(
//             0x111111
//         );

//     scene.fog = null;


//     // ==========================================
//     // CAMERA
//     // ==========================================

//     camera =
//         new THREE.PerspectiveCamera(
//             45,
//             window.innerWidth /
//             window.innerHeight,
//             0.1,
//             2000
//         );


//     camera.position.set(
//         0,
//         10,
//         -100
//     );


//     // ==========================================
//     // ORBIT CONTROLS
//     // ==========================================

//     controls =
//         new OrbitControls(
//             camera,
//             renderer.domElement
//         );

//     controls.enableDamping =
//         true;

//     controls.target.set(
//         0,
//         5,
//         100
//     );

//     controls.update();


//     // ==========================================
//     // LIGHTING
//     // ==========================================

//     const ambientLight =
//         new THREE.AmbientLight(
//             0xffffff,
//             0.25
//         );

//     scene.add(
//         ambientLight
//     );


//     // ==========================================
//     // FRONT LIGHT
//     // ==========================================

//     const frontLight =
//         new THREE.DirectionalLight(
//             0xffffff,
//             4
//         );

//     frontLight.position.set(
//         0,
//         80,
//         -250
//     );

//     frontLight.target.position.set(
//         0,
//         20,
//         0
//     );

//     frontLight.castShadow =
//         true;

//     frontLight.shadow.mapSize.width =
//         4096;

//     frontLight.shadow.mapSize.height =
//         4096;

//     frontLight.shadow.normalBias =
//         0.2;

//     scene.add(
//         frontLight.target
//     );

//     scene.add(
//         frontLight
//     );


//     // ==========================================
//     // LOAD THEATRE MODEL
//     // ==========================================

//     const loader =
//         new GLTFLoader();


//     loader.load(

//         MODEL_PATH,


//         (gltf) => {

//             const theatre =
//                 gltf.scene;


//             scene.add(
//                 theatre
//             );


//             console.log(
//                 "WatchParty theatre loaded successfully."
//             );


//             // ==========================================
//             // PROCESS MESHES
//             // ==========================================

//             theatre.traverse(
//                 (object) => {

//                     if (
//                         !object.isMesh
//                     ) {

//                         return;

//                     }


//                     object.castShadow =
//                         true;

//                     object.receiveShadow =
//                         true;


//                     if (
//                         object.material
//                     ) {

//                         const materials =
//                             Array.isArray(
//                                 object.material
//                             )
//                                 ? object.material
//                                 : [
//                                     object.material
//                                 ];


//                         materials.forEach(
//                             (material) => {

//                                 console.log(
//                                     "MESH:",
//                                     object.name
//                                 );

//                                 console.log(
//                                     "MATERIAL:",
//                                     material.name
//                                 );

//                                 if (
//                                     material.color
//                                 ) {

//                                     console.log(
//                                         "COLOR:",
//                                         material.color
//                                     );

//                                 }

//                             }
//                         );

//                     }

//                 }
//             );


//             // // ==========================================
//             // // FIND LEVEL
//             // // ==========================================

//             // const level =
//             //     theatre.getObjectByName(
//             //         "Level"
//             //     );


//             // if (
//             //     level
//             // ) {

//             //     console.log(
//             //         "LEVEL FOUND:",
//             //         level
//             //     );

//             //     level.visible =
//             //         true;

//             // }


//             // ==========================================
//             // DEBUG WORLD BOUNDS
//             // ==========================================

//             // const box =
//             //     new THREE.Box3()
//             //         .setFromObject(
//             //             theatre
//             //         );


//             // const center =
//             //     new THREE.Vector3();

//             // const size =
//             //     new THREE.Vector3();


//             // box.getCenter(
//             //     center
//             // );

//             // box.getSize(
//             //     size
//             // );


//             // console.log(
//             //     "THEATRE WORLD CENTER:",
//             //     center
//             // );

//             // console.log(
//             //     "THEATRE WORLD SIZE:",
//             //     size
//             // );

//         },


//         // ==========================================
//         // LOADING PROGRESS
//         // ==========================================

//         (progress) => {

//             if (
//                 progress.total
//             ) {

//                 const percentage =
//                     (
//                         progress.loaded /
//                         progress.total
//                     ) * 100;


//                 console.log(
//                     `Loading theatre: ${percentage.toFixed(0)}%`
//                 );

//             }

//         },


//         // ==========================================
//         // LOADING ERROR
//         // ==========================================

//         (error) => {

//             console.error(
//                 "Error loading theatre model:",
//                 error
//             );

//         }

//     );


//     // ==========================================
//     // ENTER BUTTON
//     // ==========================================

//     if (
//         enterButton
//     ) {

//         enterButton.addEventListener(
//             "click",
//             () => {

//                 if (
//                     landingScreen
//                 ) {

//                     landingScreen.classList.add(
//                         "hidden"
//                     );

//                 }

//                 console.log(
//                     "Entered WatchParty theatre."
//                 );

//             }
//         );

//     }


//     // ==========================================
//     // ANIMATION LOOP
//     // ==========================================

//     function animate() {

//         requestAnimationFrame(
//             animate
//         );

//         controls.update();

//         renderer.render(
//             scene,
//             camera
//         );

//     }


//     animate();

// }


// // ==========================================
// // CLEANUP
// // ==========================================

// export function cleanup() {

//     if (
//         controls
//     ) {

//         controls.dispose();

//         controls = null;

//     }


//     if (
//         scene
//     ) {

//         scene.clear();

//     }

// }

import * as THREE from "three";

import { OrbitControls } from
    "three/addons/controls/OrbitControls.js";

import { GLTFLoader } from
    "three/addons/loaders/GLTFLoader.js";

import { initSeatUI } from "../ui/seats.js";


// ==========================================
// CONFIGURATION
// ==========================================

const MODEL_PATH =
    "./assets/popcorn.glb";

const TWEEN_DURATION = 1.2; // seconds


// ==========================================
// SEATS — placeholder coords, replace with real
// numbers using the 'p' key logger below
// ==========================================

const OVERVIEW_CAMERA = {
    position: [0, 50, -80],
    lookAt:   [0, 20, 40]
};

const SEATS = [
    { id: 'R1_01', position: [-50, 25, 0],   lookAt: [0, 40, 100] },
    { id: 'R1_02', position: [-25, 25, 0],   lookAt: [0, 40, 100] },
    { id: 'R1_03', position: [0,   25, 0],   lookAt: [0, 40, 100] },
    { id: 'R1_04', position: [25,  25, 0],   lookAt: [0, 40, 100] },
    { id: 'R2_01', position: [-50, 45, -40], lookAt: [0, 40, 100] },
    { id: 'R2_02', position: [-25, 45, -40], lookAt: [0, 40, 100] },
    { id: 'R2_03', position: [0,   45, -40], lookAt: [0, 40, 100] },
    { id: 'R2_04', position: [25,  45, -40], lookAt: [0, 40, 100] },
];


// ==========================================
// DOM ELEMENTS
// ==========================================

const canvas =
    document.getElementById("experience-canvas");

const landingScreen =
    document.getElementById("landing-screen");

const enterButton =
    document.getElementById("enter-theatre");


// ==========================================
// GLOBALS
// ==========================================

let renderer;
let scene;
let camera;
let controls;
let clock;

let raycaster;
let mouse;

let seatMeshes = [];
let seatUI;

let tweenActive = false;
let tweenT = 0;
const tweenStart = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
const tweenEnd   = { pos: new THREE.Vector3(), look: new THREE.Vector3() };


// ==========================================
// INIT
// ==========================================

export function init({ renderer: sharedRenderer }) {

    renderer = sharedRenderer;

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.85;

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;


    // ==========================================
    // SCENE
    // ==========================================

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);
    scene.fog = null;


    // ==========================================
    // CAMERA — start at overview
    // ==========================================

    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        2000
    );

    camera.position.set(...OVERVIEW_CAMERA.position);


    // ==========================================
    // ORBIT CONTROLS
    // ==========================================

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(...OVERVIEW_CAMERA.lookAt);
    controls.update();


    // ==========================================
    // CLOCK — needed for tween timing
    // ==========================================

    clock = new THREE.Clock();


    // ==========================================
    // LIGHTING
    // ==========================================

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


    // ==========================================
    // SCREEN PLACEHOLDER
    // ==========================================

    const screenGeo = new THREE.PlaneGeometry(60, 34);
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const screen = new THREE.Mesh(screenGeo, screenMat);

    screen.position.set(0, 60, 100);
    screen.rotation.y = Math.PI;
    screen.name = "Screen";

    scene.add(screen);


    // ==========================================
    // SEAT HITBOXES
    // ==========================================

    SEATS.forEach((seat) => {

        const hitbox = new THREE.Mesh(
            new THREE.SphereGeometry(8, 8, 8),
            new THREE.MeshBasicMaterial({ visible: false })
        );

        hitbox.position.set(...seat.position);
        hitbox.userData.seatData = seat;

        scene.add(hitbox);
        seatMeshes.push(hitbox);

    });


    // ==========================================
    // SEAT UI (DOM)
    // ==========================================

    seatUI = initSeatUI({

        onSit: (seat) => {
            startTween(seat.position, seat.lookAt);
            controls.enabled = false;
        },

        onStandUp: () => {
            startTween(OVERVIEW_CAMERA.position, OVERVIEW_CAMERA.lookAt);
        }

    });


    // ==========================================
    // RAYCASTER SETUP
    // ==========================================

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

   canvas.addEventListener('mousemove', onMouseMove);
   canvas.addEventListener('click', onClick);
    window.addEventListener('keydown', onKeyDown);


    // ==========================================
    // LOAD THEATRE MODEL
    // ==========================================

    const loader = new GLTFLoader();

    loader.load(
        MODEL_PATH,

        (gltf) => {

            const theatre = gltf.scene;
            scene.add(theatre);

            theatre.traverse((object) => {
                if (!object.isMesh) return;
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


    // ==========================================
    // ENTER BUTTON
    // ==========================================

    if (enterButton) {

        enterButton.addEventListener("click", () => {

            if (landingScreen) {
                landingScreen.classList.add("hidden");
            }

        });

    }


    // ==========================================
    // ANIMATION LOOP
    // ==========================================

    function animate() {

        requestAnimationFrame(animate);

        const delta = clock.getDelta();

        if (tweenActive) {
            updateTween(delta);
        } else {
            controls.update();
        }

        renderer.render(scene, camera);

    }

    animate();

}


// ==========================================
// RAYCAST HANDLERS
// ==========================================

function onMouseMove(event) {

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(seatMeshes);

    if (hits.length > 0) {
        seatUI.setHoveredSeat(hits[0].object.userData.seatData);
    } else {
        seatUI.setHoveredSeat(null);
    }

}

function onClick() {

    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(seatMeshes);

    if (hits.length > 0) {
        seatUI.sitInSeat(hits[0].object.userData.seatData);
    }

}


// ==========================================
// DEBUG: press 'p' to log camera position
// ==========================================

function onKeyDown(event) {

    if (event.key === 'p') {
        console.log('position:', camera.position.toArray());
        console.log('target:', controls.target.toArray());
    }

}


// ==========================================
// CAMERA TWEEN
// ==========================================

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function startTween(toPos, toLook) {

    tweenStart.pos.copy(camera.position);
    tweenStart.look.copy(controls.target);

    tweenEnd.pos.set(...toPos);
    tweenEnd.look.set(...toLook);

    tweenT = 0;
    tweenActive = true;

}

function updateTween(delta) {

    tweenT += delta / TWEEN_DURATION;
    const eased = easeInOutCubic(Math.min(tweenT, 1));

    camera.position.lerpVectors(tweenStart.pos, tweenEnd.pos, eased);

    const currentLook = new THREE.Vector3()
        .lerpVectors(tweenStart.look, tweenEnd.look, eased);

    camera.lookAt(currentLook);

    if (tweenT >= 1) {
        tweenActive = false;
        controls.target.copy(tweenEnd.look);
        controls.enabled = (tweenEnd.pos.toArray().toString() === OVERVIEW_CAMERA.position.toString());
        controls.update();
    }

}


// ==========================================
// CLEANUP
// ==========================================

export function cleanup() {

   canvas.addEventListener('mousemove', onMouseMove);
   canvas.addEventListener('click', onClick);
    window.removeEventListener('keydown', onKeyDown);

    if (controls) {
        controls.dispose();
        controls = null;
    }

    if (scene) {
        scene.clear();
    }

    seatMeshes = [];

}