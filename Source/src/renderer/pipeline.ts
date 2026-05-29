import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutlinePass } from "three/addons/postprocessing/OutlinePass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { DEFAULT_RENDER_SETTINGS } from "./renderSettings";

export interface RenderPipeline {
  renderer: THREE.WebGLRenderer;
  composer: EffectComposer;
  outlinePass: OutlinePass;
  resize: () => void;
}

export function createRenderPipeline(canvas: HTMLCanvasElement, scene: THREE.Scene, camera: THREE.PerspectiveCamera): RenderPipeline {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
    preserveDrawingBuffer: true
  });
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = DEFAULT_RENDER_SETTINGS.exposure;

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const outlinePass = new OutlinePass(new THREE.Vector2(canvas.clientWidth, canvas.clientHeight), scene, camera);
  outlinePass.edgeStrength = 3;
  outlinePass.edgeGlow = 0.45;
  outlinePass.edgeThickness = 1.3;
  outlinePass.visibleEdgeColor.set("#ffb02e");
  outlinePass.hiddenEdgeColor.set("#0d1117");
  composer.addPass(outlinePass);

  const resize = () => resizeRendererToDisplaySize(renderer, composer, outlinePass, camera);
  resize();

  return { renderer, composer, outlinePass, resize };
}

export function resizeRendererToDisplaySize(
  renderer: THREE.WebGLRenderer,
  composer: EffectComposer,
  outlinePass: OutlinePass,
  camera: THREE.PerspectiveCamera,
  maxPixelCount = 2560 * 1440
): void {
  const canvas = renderer.domElement;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  let width = Math.max(1, Math.floor(canvas.clientWidth * pixelRatio));
  let height = Math.max(1, Math.floor(canvas.clientHeight * pixelRatio));
  const pixelCount = width * height;
  if (pixelCount > maxPixelCount) {
    const scale = Math.sqrt(maxPixelCount / pixelCount);
    width = Math.max(1, Math.floor(width * scale));
    height = Math.max(1, Math.floor(height * scale));
  }

  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
    composer.setSize(width, height);
    outlinePass.setSize(width, height);
  }

  const aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
  if (Math.abs(camera.aspect - aspect) > 0.0001) {
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
  }
}
