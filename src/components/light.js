import * as THREE from 'three'

export function addLights(scene){

    const ambientLight =
        new THREE.AmbientLight(
            0xffffff,
            1
        )

    scene.add(ambientLight)

    const directionalLight =
        new THREE.DirectionalLight(
            0xffffff,
            2
        )

    directionalLight.position.set(
        5,
        10,
        5
    )

    scene.add(directionalLight)

}