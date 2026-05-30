import * as THREE from "three";
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";
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
  heavyPostProcessingSupported: boolean;
  fxaaPass: FXAAPass;
  ssaoPass: SSAOPass;
  bokehPass: BokehPass;
  bloomPass: UnrealBloomPass;
  vignettePass: ShaderPass;
  outlinePass: OutlinePass;
  outputPass: OutputPass;
  resize: () => void;
  setPixelBudget: (maxPixelCount: number) => void;
}

const DEFAULT_PIXEL_BUDGET = 2560 * 1440;

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
  const heavyPostProcessingSupported = !isAutomatedBrowser() && !isSoftwareRenderer(renderer);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const ssaoPass = new SSAOPass(scene, camera, canvas.clientWidth, canvas.clientHeight);
  ssaoPass.enabled = DEFAULT_POST_PROCESSING_SETTINGS.ssao;
  ssaoPass.kernelRadius = DEFAULT_POST_PROCESSING_SETTINGS.ssaoRadius;
  ssaoPass.minDistance = DEFAULT_POST_PROCESSING_SETTINGS.ssaoMinDistance;
  ssaoPass.maxDistance = DEFAULT_POST_PROCESSING_SETTINGS.ssaoMaxDistance;
  composer.addPass(ssaoPass);

  const bokehPass = new BokehPass(scene, camera, {
    focus: DEFAULT_POST_PROCESSING_SETTINGS.dofFocus,
    aperture: DEFAULT_POST_PROCESSING_SETTINGS.dofAperture,
    maxblur: DEFAULT_POST_PROCESSING_SETTINGS.dofMaxBlur
  });
  bokehPass.enabled = DEFAULT_POST_PROCESSING_SETTINGS.dof;
  composer.addPass(bokehPass);

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

  let pixelBudget = DEFAULT_PIXEL_BUDGET;
  const resize = () => resizeRendererToDisplaySize(renderer, composer, outlinePass, fxaaPass, ssaoPass, bokehPass, bloomPass, camera, pixelBudget);
  const setPixelBudget = (maxPixelCount: number) => {
    const nextBudget = Number.isFinite(maxPixelCount) && maxPixelCount > 0 ? Math.floor(maxPixelCount) : DEFAULT_PIXEL_BUDGET;
    if (nextBudget === pixelBudget) return;
    pixelBudget = nextBudget;
    resize();
  };
  resize();

  return {
    renderer,
    composer,
    heavyPostProcessingSupported,
    fxaaPass,
    ssaoPass,
    bokehPass,
    bloomPass,
    vignettePass,
    outlinePass,
    outputPass,
    resize,
    setPixelBudget
  };
}

export function resizeRendererToDisplaySize(
  renderer: THREE.WebGLRenderer,
  composer: EffectComposer,
  outlinePass: OutlinePass,
  fxaaPass: FXAAPass,
  ssaoPass: SSAOPass,
  bokehPass: BokehPass,
  bloomPass: UnrealBloomPass,
  camera: THREE.PerspectiveCamera,
  maxPixelCount = DEFAULT_PIXEL_BUDGET
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
    bokehPass.setSize(width, height);
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

function isSoftwareRenderer(renderer: THREE.WebGLRenderer): boolean {
  const gl = renderer.getContext();
  const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
  const rendererName = debugInfo
    ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL))
    : String(gl.getParameter(gl.RENDERER));
  return /swiftshader|llvmpipe|software|mesa offscreen/i.test(rendererName);
}

function isAutomatedBrowser(): boolean {
  return typeof navigator !== "undefined" && navigator.webdriver;
}
