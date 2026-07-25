import * as THREE from 'three'
import { OrbitControls }
from 'three/examples/jsm/controls/OrbitControls.js'

import { loadTheater }
from '../components/theatre.js'

import { addLights }
from '../components/light.js'

import {
    createLobbyUI,
    removeLobbyUI
}
from "../ui/lobbyUI.js"

let scene
let camera
let controls
let renderer

export function init({ renderer:r }) {

    renderer = r
    createLobbyUI()
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x222222)

    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    )

    // Back entrance viewpoint
    camera.position.set(
       
        -6.57,
        2.046,
        23.76
    )

    controls = new OrbitControls(
        camera,
        renderer.domElement
    )

    controls.enableDamping = true

    // Where the camera looks
    controls.target.set(
       
    -6.311,
    2.157,
    0.0266
    )

    controls.update()

    addLights(scene)

    loadTheater(scene)

    renderer.setAnimationLoop(animate)
}

function animate() {

    controls.update()

    renderer.render(
        scene,
        camera
    )

}

export function cleanup() {

    renderer.setAnimationLoop(null)
    removeLobbyUI()

    renderer.setAnimationLoop(
    null
)
}