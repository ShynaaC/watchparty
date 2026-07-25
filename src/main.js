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
import './style.css'
import * as THREE from 'three'

let currentScene = null

const canvas =
    document.getElementById(
        'experience-canvas'
    )

const renderer =
    new THREE.WebGLRenderer({
        canvas,
        antialias:true
    })

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio,2)
)

renderer.setSize(
    window.innerWidth,
    window.innerHeight
)

const scenes = {

    lobby : () =>
        import("./scenes/scene_lobby.js"),

    // theater : () =>
    //     import("./watchparty/scenes/scene_theatre.js")

    lobby : () =>
        import("./scenes/scene_lobby.js"),

   
}

window.loadScene = loadScene

async function loadScene(name){

    if(currentScene?.cleanup){
        currentScene.cleanup()
    }

    const module =
        await scenes[name]()

    currentScene = module

    module.init({
        renderer
    })

}

loadScene("lobby")