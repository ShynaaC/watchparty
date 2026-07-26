import * as THREE from "three";

import { OrbitControls } from
    "three/addons/controls/OrbitControls.js";

import { GLTFLoader } from
    "three/addons/loaders/GLTFLoader.js";


// ==========================================
// CONFIGURATION
// ==========================================

const MODEL_PATH =
    "./assets/popcorn.glb";


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


// ==========================================
// INIT
// ==========================================

export function init({ renderer: sharedRenderer }) {

    // ==========================================
    // RECEIVE SHARED RENDERER FROM MAIN.JS
    // ==========================================

    renderer = sharedRenderer;


    // ==========================================
    // RENDERER SETTINGS
    // ==========================================

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

    renderer.outputColorSpace =
        THREE.SRGBColorSpace;

    renderer.toneMapping =
        THREE.ACESFilmicToneMapping;

    renderer.toneMappingExposure =
        1.85;


    // ==========================================
    // SHADOWS
    // ==========================================

    renderer.shadowMap.enabled =
        true;

    renderer.shadowMap.type =
        THREE.PCFSoftShadowMap;


    // ==========================================
    // SCENE
    // ==========================================

    scene =
        new THREE.Scene();

    scene.background =
        new THREE.Color(
            0x111111
        );

    scene.fog = null;


    // ==========================================
    // CAMERA
    // ==========================================

    camera =
        new THREE.PerspectiveCamera(
            45,
            window.innerWidth /
            window.innerHeight,
            0.1,
            2000
        );


    camera.position.set(
        0,
        10,
        -100
    );


    // ==========================================
    // ORBIT CONTROLS
    // ==========================================

    controls =
        new OrbitControls(
            camera,
            renderer.domElement
        );

    controls.enableDamping =
        true;

    controls.target.set(
        0,
        5,
        100
    );

    controls.update();


    // ==========================================
    // LIGHTING
    // ==========================================

    const ambientLight =
        new THREE.AmbientLight(
            0xffffff,
            0.25
        );

    scene.add(
        ambientLight
    );


    // ==========================================
    // FRONT LIGHT
    // ==========================================

    const frontLight =
        new THREE.DirectionalLight(
            0xffffff,
            4
        );

    frontLight.position.set(
        0,
        80,
        -250
    );

    frontLight.target.position.set(
        0,
        20,
        0
    );

    frontLight.castShadow =
        true;

    frontLight.shadow.mapSize.width =
        4096;

    frontLight.shadow.mapSize.height =
        4096;

    frontLight.shadow.normalBias =
        0.2;

    scene.add(
        frontLight.target
    );

    scene.add(
        frontLight
    );


    // ==========================================
    // LOAD THEATRE MODEL
    // ==========================================

    const loader =
        new GLTFLoader();


    loader.load(

        MODEL_PATH,


        (gltf) => {

            const theatre =
                gltf.scene;


            scene.add(
                theatre
            );


            console.log(
                "WatchParty theatre loaded successfully."
            );


            // ==========================================
            // PROCESS MESHES
            // ==========================================

            theatre.traverse(
                (object) => {

                    if (
                        !object.isMesh
                    ) {

                        return;

                    }


                    object.castShadow =
                        true;

                    object.receiveShadow =
                        true;


                    if (
                        object.material
                    ) {

                        const materials =
                            Array.isArray(
                                object.material
                            )
                                ? object.material
                                : [
                                    object.material
                                ];


                        materials.forEach(
                            (material) => {

                                console.log(
                                    "MESH:",
                                    object.name
                                );

                                console.log(
                                    "MATERIAL:",
                                    material.name
                                );

                                if (
                                    material.color
                                ) {

                                    console.log(
                                        "COLOR:",
                                        material.color
                                    );

                                }

                            }
                        );

                    }

                }
            );


            // ==========================================
            // FIND LEVEL
            // ==========================================

            const level =
                theatre.getObjectByName(
                    "Level"
                );


            if (
                level
            ) {

                console.log(
                    "LEVEL FOUND:",
                    level
                );

                level.visible =
                    true;

            }


            // ==========================================
            // DEBUG WORLD BOUNDS
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
    // ENTER BUTTON
    // ==========================================

    if (
        enterButton
    ) {

        enterButton.addEventListener(
            "click",
            () => {

                if (
                    landingScreen
                ) {

                    landingScreen.classList.add(
                        "hidden"
                    );

                }

                console.log(
                    "Entered WatchParty theatre."
                );

            }
        );

    }


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

}


// ==========================================
// CLEANUP
// ==========================================

export function cleanup() {

    if (
        controls
    ) {

        controls.dispose();

        controls = null;

    }


    if (
        scene
    ) {

        scene.clear();

    }

}