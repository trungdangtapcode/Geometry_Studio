import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { FXAAPass } from "three/addons/postprocessing/FXAAPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { OutlinePass } from "three/addons/postprocessing/OutlinePass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { VignetteShader } from "three/addons/shaders/VignetteShader.js";
import { DEFAULT_RENDER_SETTINGS } from "./renderSettings";
import { DEFAULT_POST_PROCESSING_SETTINGS } from "./postProcessing";

export interface RenderPipeline {
  renderer: THREE.WebGLRenderer;
  composer: EffectComposer;
  fxaaPass: FXAAPass;
  ssaoPass: SSAOPass;
  bloomPass: UnrealBloomPass;
  vignettePass: ShaderPass;
  outlinePass: OutlinePass;
  outputPass: OutputPass;
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
  const ssaoPass = new SSAOPass(scene, camera, canvas.clientWidth, canvas.clientHeight);
  ssaoPass.enabled = DEFAULT_POST_PROCESSING_SETTINGS.ssao;
  ssaoPass.kernelRadius = DEFAULT_POST_PROCESSING_SETTINGS.ssaoRadius;
  ssaoPass.minDistance = DEFAULT_POST_PROCESSING_SETTINGS.ssaoMinDistance;
  ssaoPass.maxDistance = DEFAULT_POST_PROCESSING_SETTINGS.ssaoMaxDistance;
  composer.addPass(ssaoPass);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(canvas.clientWidth, canvas.clientHeight),
    DEFAULT_POST_PROCESSING_SETTINGS.bloomStrength,
    DEFAULT_POST_PROCESSING_SETTINGS.bloomRadius,
    DEFAULT_POST_PROCESSING_SETTINGS.bloomThreshold
  );
  bloomPass.enabled = DEFAULT_POST_PROCESSING_SETTINGS.bloom;
  composer.addPass(bloomPass);

  const vignettePass = new ShaderPass(VignetteShader);
  vignettePass.enabled = DEFAULT_POST_PROCESSING_SETTINGS.vignette;
  vignettePass.uniforms.darkness.value = DEFAULT_POST_PROCESSING_SETTINGS.vignetteDarkness;
  composer.addPass(vignettePass);

  const outlinePass = new OutlinePass(new THREE.Vector2(canvas.clientWidth, canvas.clientHeight), scene, camera);
  outlinePass.edgeStrength = 3;
  outlinePass.edgeGlow = 0.45;
  outlinePass.edgeThickness = 1.3;
  outlinePass.visibleEdgeColor.set("#ffb02e");
  outlinePass.hiddenEdgeColor.set("#0d1117");
  composer.addPass(outlinePass);
  const fxaaPass = new FXAAPass();
  fxaaPass.enabled = DEFAULT_POST_PROCESSING_SETTINGS.fxaa;
  composer.addPass(fxaaPass);
  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  const resize = () => resizeRendererToDisplaySize(renderer, composer, outlinePass, fxaaPass, ssaoPass, bloomPass, camera);
  resize();

  return { renderer, composer, fxaaPass, ssaoPass, bloomPass, vignettePass, outlinePass, outputPass, resize };
}

export function resizeRendererToDisplaySize(
  renderer: THREE.WebGLRenderer,
  composer: EffectComposer,
  outlinePass: OutlinePass,
  fxaaPass: FXAAPass,
  ssaoPass: SSAOPass,
  bloomPass: UnrealBloomPass,
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
    fxaaPass.setSize(width, height);
    resizeSsaoPass(ssaoPass, width, height);
    resizeBloomPass(bloomPass, width, height);
  }

  const aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
  if (Math.abs(camera.aspect - aspect) > 0.0001) {
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
  }
}

function resizeSsaoPass(ssaoPass: SSAOPass, width: number, height: number, maxPixelCount = 1280 * 720): void {
  const pixelCount = width * height;
  if (pixelCount <= maxPixelCount) {
    ssaoPass.setSize(width, height);
    return;
  }
  const scale = Math.sqrt(maxPixelCount / pixelCount);
  ssaoPass.setSize(Math.max(1, Math.floor(width * scale)), Math.max(1, Math.floor(height * scale)));
}

function resizeBloomPass(bloomPass: UnrealBloomPass, width: number, height: number, maxPixelCount = 1280 * 720): void {
  const pixelCount = width * height;
  if (pixelCount <= maxPixelCount) {
    bloomPass.setSize(width, height);
    return;
  }
  const scale = Math.sqrt(maxPixelCount / pixelCount);
  bloomPass.setSize(Math.max(1, Math.floor(width * scale)), Math.max(1, Math.floor(height * scale)));
}
