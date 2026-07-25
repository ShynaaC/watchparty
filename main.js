import * as THREE from "three";

import { OrbitControls } from
    "three/addons/controls/OrbitControls.js";

import { GLTFLoader } from
    "three/addons/loaders/GLTFLoader.js";


// ==========================================
// CONFIGURATION
// ==========================================

const MODEL_PATH =
    "./assets/Movie_Theater_Scene_Refactored_6.glb";


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
// SCENE
// ==========================================

const scene =
    new THREE.Scene();

scene.background =
    new THREE.Color(0x111111);

scene.fog = null;


// ==========================================
// CAMERA
// ==========================================

const camera =
    new THREE.PerspectiveCamera(
        45,
        window.innerWidth /
        window.innerHeight,
        0.1,
        2000
    );


// ==========================================
// ORIGINAL CAMERA POSITION
// ==========================================

camera.position.set(
    0,
    5,
    -80
);


// ==========================================
// RENDERER
// ==========================================

const renderer =
    new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true
    });

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.setPixelRatio(
    Math.min(
        window.devicePixelRatio,
        2
    )
);


// ==========================================
// COLOR MANAGEMENT
// ==========================================

// IMPORTANT:
// Use the same color pipeline as your
// working theatre scene.

renderer.outputColorSpace =
    THREE.SRGBColorSpace;

renderer.toneMapping =
    THREE.ACESFilmicToneMapping;

renderer.toneMappingExposure =
    1.85;


// ==========================================
// SHADOWS
// ==========================================

// Same as your working scene

renderer.shadowMap.enabled =
    true;

renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;


// ==========================================
// CONTROLS
// ==========================================

const controls =
    new OrbitControls(
        camera,
        renderer.domElement
    );

controls.enableDamping =
    true;


// ==========================================
// CAMERA TARGET
// ==========================================

controls.target.set(
    0,
    5,
    100
);

controls.update();


// ==========================================
// LIGHTING
// ==========================================


// ==========================================
// AMBIENT LIGHT
// ==========================================

// Same style as working scene

const ambientLight =
    new THREE.AmbientLight(
        0xde6aa8,
        0.25
    );

scene.add(
    ambientLight
);


// ==========================================
// MAIN SCREEN LIGHT
// ==========================================

// This is the important light from
// your working version.

const screenLight =
    new THREE.DirectionalLight(
        0xde6aa8,
        4
    );

screenLight.castShadow =
    true;


// Position the light in front of
// the theatre screen

screenLight.position.set(
    5,
    80,
    -250
);


// Point the light toward the screen

screenLight.target.position.set(
    80,
    80,
    -250
);

scene.add(
    screenLight
);

scene.add(
    screenLight.target
);


// ==========================================
// SHADOW QUALITY
// ==========================================

screenLight.shadow.mapSize.width =
    4096;

screenLight.shadow.mapSize.height =
    4096;

screenLight.shadow.camera.left =
    -50;

screenLight.shadow.camera.right =
    50;

screenLight.shadow.camera.top =
    50;

screenLight.shadow.camera.bottom =
    -50;

screenLight.shadow.normalBias =
    0.2;


// ==========================================
// OPTIONAL SOFT FILL LIGHT
// ==========================================

// Small neutral fill light so that
// areas away from the pink screen light
// are not completely black.

const fillLight =
    new THREE.HemisphereLight(
        0xffffff,
        0x222222,
        0.35
    );

scene.add(
    fillLight
);


// ==========================================
// LOAD THEATRE MODEL
// ==========================================

const loader =
    new GLTFLoader();

loader.load(

    MODEL_PATH,


    // ==========================================
    // SUCCESS
    // ==========================================

    (gltf) => {

        const theatre =
            gltf.scene;


        // ==========================================
        // ADD COMPLETE MODEL
        // ==========================================

        scene.add(
            theatre
        );


        console.log(
            "WatchParty theatre loaded successfully."
        );


        // ==========================================
        // PROCESS ALL MESHES
        // ==========================================

        theatre.traverse(
            (object) => {

                if (!object.isMesh) {
                    return;
                }


                // ==========================================
                // SHADOWS
                // ==========================================

                object.castShadow =
                    true;

                object.receiveShadow =
                    true;


                // ==========================================
                // IMPORTANT
                // ==========================================

                // DO NOT MODIFY:
                //
                // material.color
                // material.metalness
                // material.roughness
                // material.opacity
                //
                // The GLB already contains
                // its original materials and colors.

            }
        );


        // ==========================================
        // FIND LEVEL
        // ==========================================

        const level =
            theatre.getObjectByName(
                "Level"
            );


        if (level) {

            console.log(
                "LEVEL FOUND:",
                level
            );


            // Keep Level visible

            level.visible =
                true;

        }


        // ==========================================
        // FIND CUBE.067
        // ==========================================

        const cube067 =
            theatre.getObjectByName(
                "Cube.067"
            );


        if (cube067) {

            console.log(
                "CUBE.067 FOUND:",
                cube067
            );

        }


        // ==========================================
        // FIND CUBE002
        // ==========================================

        const cube002 =
            theatre.getObjectByName(
                "Cube002"
            );


        if (cube002) {

            const worldPosition =
                new THREE.Vector3();


            cube002.getWorldPosition(
                worldPosition
            );


            console.log(
                "Cube002 WORLD POSITION:",
                worldPosition
            );

        }


        // ==========================================
        // GET WORLD BOUNDS
        // ==========================================

        const box =
            new THREE.Box3()
                .setFromObject(
                    theatre
                );


        const center =
            new THREE.Vector3();


        const size =
            new THREE.Vector3();


        box.getCenter(
            center
        );


        box.getSize(
            size
        );


        console.log(
            "THEATRE WORLD CENTER:",
            center
        );


        console.log(
            "THEATRE WORLD SIZE:",
            size
        );


        console.log(
            "THEATRE MIN:",
            box.min
        );


        console.log(
            "THEATRE MAX:",
            box.max
        );

    },


    // ==========================================
    // LOADING PROGRESS
    // ==========================================

    (progress) => {

        if (
            progress.total
        ) {

            const percentage =
                (
                    progress.loaded /
                    progress.total
                ) * 100;


            console.log(
                `Loading theatre: ${percentage.toFixed(0)}%`
            );

        }

    },


    // ==========================================
    // LOADING ERROR
    // ==========================================

    (error) => {

        console.error(
            "Error loading theatre model:",
            error
        );

    }

);


// ==========================================
// ENTER THEATRE BUTTON
// ==========================================

enterButton.addEventListener(
    "click",
    () => {

        landingScreen.classList.add(
            "hidden"
        );


        console.log(
            "Entered WatchParty theatre."
        );

    }
);


// ==========================================
// WINDOW RESIZE
// ==========================================

window.addEventListener(
    "resize",
    () => {

        camera.aspect =
            window.innerWidth /
            window.innerHeight;


        camera.updateProjectionMatrix();


        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );


        renderer.setPixelRatio(
            Math.min(
                window.devicePixelRatio,
                2
            )
        );

    }
);


// ==========================================
// ANIMATION LOOP
// ==========================================

function animate() {

    requestAnimationFrame(
        animate
    );


    controls.update();


    renderer.render(
        scene,
        camera
    );

}


animate();