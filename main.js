// import './style.css'

// import * as THREE from 'three'
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// const scene = new THREE.Scene()
// scene.background = new THREE.Color(0x222222)

// const camera = new THREE.PerspectiveCamera(
//     75,
//     window.innerWidth/window.innerHeight,
//     0.1,
//     1000
// )

// // camera.position.set(0,2,29)
// // camera.position.set(-8,2,29)
// // camera.lookAt(8,2,29)
// camera.position.set(-1,2,29)

// const axesHelper = new THREE.AxesHelper(20)
// scene.add(axesHelper)
// const renderer = new THREE.WebGLRenderer({
//     antialias:true
// })

// renderer.setSize(window.innerWidth,window.innerHeight)
// document.body.appendChild(renderer.domElement)

// const controls = new OrbitControls(camera,renderer.domElement)
// controls.enableDamping = true

// // Lights
// const ambientLight = new THREE.AmbientLight(0xffffff,1)
// scene.add(ambientLight)

// const directionalLight = new THREE.DirectionalLight(0xffffff,2)
// directionalLight.position.set(5,10,5)
// scene.add(directionalLight)

// // Load GLB
// const loader = new GLTFLoader()

// loader.load(
//     '/Movie_Theater_Scene_Refactored_6.glb',
//     (gltf)=>{

//         const model = gltf.scene
        
//         model.rotation.z = Math.PI*2
//         // Scale if necessary
//         model.scale.set(1,1,1)

//         scene.add(model)

//     },
//     undefined,
//     (error)=>{
//         console.error(error)
//     }
// )

// function animate(){

//     requestAnimationFrame(animate)

//     controls.update()

//     renderer.render(scene,camera)

// }

// animate()

// window.addEventListener('resize',()=>{

//     camera.aspect = window.innerWidth/window.innerHeight
//     camera.updateProjectionMatrix()

//     renderer.setSize(window.innerWidth,window.innerHeight)

// })
// import './style.css'
// import * as THREE from 'three'

// let currentScene = null

// const canvas =
//     document.getElementById(
//         'experience-canvas'
//     )

// const renderer =
//     new THREE.WebGLRenderer({
//         canvas,
//         antialias:true
//     })

// renderer.setPixelRatio(
//     Math.min(window.devicePixelRatio,2)
// )

// renderer.setSize(
//     window.innerWidth,
//     window.innerHeight
// )

// const scenes = {

//     lobby : () =>
//         import("./oldstuff/src/scenes/scene_lobby.js"),

//     // theater : () =>
//     //     import("./watchparty/scenes/scene_theatre.js")

//     lobby : () =>
//         import("./oldstuff/src/scenes/scene_lobby.js"),

   
// }

// window.loadScene = loadScene

// async function loadScene(name){

//     if(currentScene?.cleanup){
//         currentScene.cleanup()
//     }

//     const module =
//         await scenes[name]()

//     currentScene = module

//     module.init({
//         renderer
//     })

// }

// loadScene("lobby")

import * as THREE from "three";

import { OrbitControls } from
"three/addons/controls/OrbitControls.js";

import { GLTFLoader } from
"three/addons/loaders/GLTFLoader.js";

// ==========================================
// CONFIGURATION
// ==========================================

const MODEL_PATH =   "./assets/Movie_Theater_Scene_Refactored_6.glb";

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
// THREE.JS SETUP
// ==========================================

// Scene

const scene =
new THREE.Scene();

scene.background =
new THREE.Color(0x111111);

// Camera

const camera =
new THREE.PerspectiveCamera(
45,
window.innerWidth / window.innerHeight,
0.1,
1000
);

camera.position.set(
0,
2,
8
);

// Renderer

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
Math.min(window.devicePixelRatio, 2)
);

renderer.shadowMap.enabled = true;

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

controls.enableDamping = true;

camera.position.set(
    0,
    5,
    -80
);

controls.target.set(
    0,
    5,
    100
);

controls.update();

// ==========================================
// LIGHTING
// ==========================================

// Ambient Light

const ambientLight =
new THREE.AmbientLight(
0xffffff,
2
);

scene.add(
ambientLight
);

const fillLight =
new THREE.DirectionalLight(
    0xffffff,
    3
);

fillLight.position.set(
    0,
    20,
    0
);

scene.add(fillLight);
// Main Directional Light

const directionalLight =
new THREE.DirectionalLight(
0xffffff,
2
);

directionalLight.position.set(
5,
10,
5
);

directionalLight.castShadow = true;

scene.add(
directionalLight
);

// ==========================================
// LOAD THEATRE MODEL
// ==========================================

const loader =
new GLTFLoader();

loader.load(
    MODEL_PATH,

    (gltf) => {

        const theatre = gltf.scene;

        scene.add(theatre);
        
        console.log(
            "WatchParty theatre loaded successfully."
        );

        // console.log(
        //     "THEATRE OBJECT:",
        //     theatre
        // );
// Get the actual world-space bounds of the theatre
const box = new THREE.Box3().setFromObject(theatre);

const center = new THREE.Vector3();
const size = new THREE.Vector3();

box.getCenter(center);
box.getSize(size);

console.log("THEATRE WORLD CENTER:", center);
console.log("THEATRE WORLD SIZE:", size);
console.log("THEATRE MIN:", box.min);
console.log("THEATRE MAX:", box.max);
    },

    (progress) => {

        if (progress.total) {

            const percentage =
                (progress.loaded /
                progress.total) * 100;

            console.log(
                `Loading theatre: ${percentage.toFixed(0)}%`
            );

        }

    },

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

const clock =
new THREE.Clock();

function animate() {

  
const elapsedTime =
    clock.getElapsedTime();

controls.update();

renderer.render(
    scene,
    camera
);

requestAnimationFrame(
    animate
);


}

animate();
