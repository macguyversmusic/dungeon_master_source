import * as THREE from "three";
// @ts-ignore
// import Stats from "three/addons/libs/stats.module.js";
// @ts-ignore
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
// @ts-ignore
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
// @ts-ignore
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
// @ts-ignore
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
// @ts-ignore
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
// @ts-ignore
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { PAGE_PADDING } from "./constants";

import { USDZLoader } from "three-usdz-loader";
import { USDZInstance } from "three-usdz-loader/lib/USDZInstance";

export let mixer: any;
// Setup the USDZ loader
// You may place external dependencies (.wasm / worker files) in a subfolder of the public folder.
// In this case, pass the path of this folder as an arg to the USDZLoader constructor
export let loader = new USDZLoader("/wasm");
export const scene = new THREE.Scene();

export async function initThree() {
  const clock = new THREE.Clock();

  // Create a ThreeJs Group in which the loaded USDZ model will be placed
  // Add the group to the scene

  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    20
  );
  camera.position.set(-1, 1, 2.5);

  const container = document.getElementById("skecth-container");
  // document.body.appendChild(container);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(
    window.innerWidth - PAGE_PADDING * 2,
    window.innerHeight - PAGE_PADDING - 136
  );

  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  container?.appendChild(renderer.domElement);

  // console.log(loadedModel.getGroup());
  // const light = new THREE.PointLight(0xff0000, 5, 10);
  // light.position.set(0, -3, 4);
  // scene.add(light);

  // scene.add(group);

  const ktx2Loader = new KTX2Loader()
    .setTranscoderPath("/textures/basis/")
    .detectSupport(renderer);

  new GLTFLoader()
    .setKTX2Loader(ktx2Loader)
    .setMeshoptDecoder(MeshoptDecoder)
    .load("/facecap.glb", (gltf: any) => {
      console.log("gltf", gltf);

      const mesh = gltf.scene.children[0];
      scene.add(mesh);
      console.log("mesh", mesh);

      mixer = new THREE.AnimationMixer(mesh);
      const zeroTrack = new THREE.NumberKeyframeTrack(
        "mesh_2.morphTargetInfluences",
        [0, 1],
        Array.from({ length: 104 }, () => 0)
      );
      let zeroClip = new THREE.AnimationClip("blink", -1, [zeroTrack]);
      mixer.clipAction(zeroClip).play();

      const head = mesh.getObjectByName("mesh_2");
      const influences = head?.morphTargetInfluences;

      const gui = new GUI();
      gui.close();

      for (const [key, value] of Object.entries(head.morphTargetDictionary)) {
        console.log(key, value);
        gui
          .add(influences, value, 0, 1, 0.01)
          .name(key.replace("blendShape1.", ""))
          .listen(influences);
      }
    });

  const environment = new RoomEnvironment();
  const pmremGenerator = new THREE.PMREMGenerator(renderer);

  scene.background = new THREE.Color(0x222222);
  scene.environment = pmremGenerator.fromScene(environment).texture;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minDistance = 2.5;
  controls.maxDistance = 100;
  controls.minAzimuthAngle = -Math.PI / 2;
  controls.maxAzimuthAngle = Math.PI / 2;
  controls.maxPolarAngle = Math.PI / 1.8;
  // controls.target.set(0, 0.15, -0.2);

  // const stats = new Stats();
  // container.appendChild(stats.dom);

  renderer.setAnimationLoop(() => {
    const delta = clock.getDelta();
    if (mixer) {
      mixer.update(delta);
    }

    renderer.render(scene, camera);

    controls.update();

    // stats.update();
  });
}
