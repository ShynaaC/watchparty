import { GLTFLoader }
from 'three/examples/jsm/loaders/GLTFLoader.js'

export function loadTheater(scene){

    const loader =
        new GLTFLoader()

    loader.load(

        '/Movie_Theater_Scene_Refactored_6.glb',

        (gltf)=>{

            const model =
                gltf.scene

            scene.add(model)

        }

    )

}