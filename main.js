// WATCHPARTY MAIN.JS

import * as THREE from 'three';
import * as theatreScene from './put_scene/scene.js';


// ==========================================
// CURRENT SCENE
// ==========================================

let currentScene = null;


// ==========================================
// CANVAS
// ==========================================

const canvas =
    document.getElementById('experience-canvas');


// ==========================================
// SHARED RENDERER
// ==========================================

const renderer =
    new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true
    });


// ==========================================
// RENDERER SETTINGS
// ==========================================

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);


// ==========================================
// COLOR MANAGEMENT
// ==========================================

renderer.outputColorSpace =
    THREE.SRGBColorSpace;


// Use the same type of rendering
// setup as the reference project

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
// GLOBAL SCENE LOADER
// ==========================================

window.loadScene =
    loadScene;


function loadScene(sceneName) {

    // ==========================================
    // CLEANUP PREVIOUS SCENE
    // ==========================================

    if (
        currentScene &&
        currentScene.cleanup
    ) {

        currentScene.cleanup();

    }


    // ==========================================
    // WATCHPARTY THEATRE
    // ==========================================

    if (
        sceneName ===
        'scene_theatre.js'
    ) {

        currentScene =
            theatreScene;


        currentScene.init({
            renderer: renderer
        });


        console.log(
            'WatchParty Theatre loaded'
        );

    }

}


// ==========================================
// WINDOW RESIZE
// ==========================================

window.addEventListener(
    'resize',
    () => {

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
// START WATCHPARTY
// ==========================================

loadScene(
    'scene_theatre.js'
);