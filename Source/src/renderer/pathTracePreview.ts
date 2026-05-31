import * as THREE from "three";
import type { WebGLPathTracer } from "three-gpu-pathtracer";

export interface PathTracePreviewStartOptions {
  targetSamples: number;
  hiddenObjects?: THREE.Object3D[];
}

export interface PathTracePreviewStatus {
  active: boolean;
  loading: boolean;
  complete: boolean;
  supported: boolean;
  unsupportedReason: string | null;
  samples: number;
  targetSamples: number;
  error: string | null;
}

export interface PathTracePreviewController {
  start(options: PathTracePreviewStartOptions): Promise<PathTracePreviewStatus>;
  renderNextSample(): PathTracePreviewStatus;
  stop(): PathTracePreviewStatus;
  dispose(): void;
  status(): PathTracePreviewStatus;
  isActive(): boolean;
}

type PathTracerModule = typeof import("three-gpu-pathtracer");

let pathTracerModulePromise: Promise<PathTracerModule> | null = null;

export function createPathTracePreviewController(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera
): PathTracePreviewController {
  let pathTracer: WebGLPathTracer | null = null;
  let active = false;
  let loading = false;
  let complete = false;
  let samples = 0;
  let targetSamples = 32;
  let error: string | null = null;
  const hiddenObjectVisibility = new Map<THREE.Object3D, boolean>();
  const materialOverrides = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
  const previewMaterials = new Set<THREE.Material>();
  let savedEnvironment: THREE.Scene["environment"] | undefined;

  const support = detectPathTraceSupport(renderer);

  const status = (): PathTracePreviewStatus => ({
    active,
    loading,
    complete,
    supported: support.supported,
    unsupportedReason: support.unsupportedReason,
    samples,
    targetSamples,
    error
  });

  const start = async (options: PathTracePreviewStartOptions): Promise<PathTracePreviewStatus> => {
    if (!support.supported) {
      error = support.unsupportedReason;
      return status();
    }

    restoreSceneEnvironment();
    restoreHiddenObjects();
    active = false;
    complete = false;
    loading = true;
    samples = 0;
    error = null;
    targetSamples = clampSamples(options.targetSamples);

    try {
      const module = await loadPathTracerModule();
      ensureRendererContextAttributes(renderer);
      pathTracer ??= configurePathTracer(new module.WebGLPathTracer(renderer));
      hideObjects(options.hiddenObjects ?? []);
      applyPathTraceMaterials(scene);
      disableUnsupportedSceneEnvironment();
      pathTracer.setScene(scene, camera);
      pathTracer.updateCamera();
      pathTracer.reset();
      active = true;
    } catch (caught) {
      restoreSceneEnvironment();
      restoreHiddenObjects();
      error = caught instanceof Error ? caught.message : "Path tracer initialization failed.";
      active = false;
    } finally {
      loading = false;
    }

    return status();
  };

  const renderNextSample = (): PathTracePreviewStatus => {
    if (!active || loading || !pathTracer) return status();
    if (samples < targetSamples) {
      pathTracer.renderSample();
      samples = Math.max(samples, Math.floor(pathTracer.samples));
      complete = samples >= targetSamples;
    }
    return status();
  };

  const stop = (): PathTracePreviewStatus => {
    restoreMaterials();
    restoreSceneEnvironment();
    restoreHiddenObjects();
    active = false;
    loading = false;
    complete = false;
    samples = 0;
    error = null;
    renderer.setRenderTarget(null);
    renderer.clear();
    return status();
  };

  const dispose = (): void => {
    stop();
    pathTracer?.dispose();
    pathTracer = null;
  };

  function hideObjects(objects: THREE.Object3D[]): void {
    objects.forEach((object) => {
      if (hiddenObjectVisibility.has(object)) return;
      hiddenObjectVisibility.set(object, object.visible);
      object.visible = false;
    });
  }

  function restoreHiddenObjects(): void {
    hiddenObjectVisibility.forEach((visible, object) => {
      object.visible = visible;
    });
    hiddenObjectVisibility.clear();
  }

  function applyPathTraceMaterials(root: THREE.Object3D): void {
    restoreMaterials();
    root.traverseVisible((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) return;
      materialOverrides.set(mesh, mesh.material);
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map((material) => trackPreviewMaterial(createPathTraceMaterial(material)))
        : trackPreviewMaterial(createPathTraceMaterial(mesh.material));
    });
  }

  function restoreMaterials(): void {
    materialOverrides.forEach((material, mesh) => {
      mesh.material = material;
    });
    materialOverrides.clear();
    previewMaterials.forEach((material) => material.dispose());
    previewMaterials.clear();
  }

  function disableUnsupportedSceneEnvironment(): void {
    if (savedEnvironment !== undefined) return;
    savedEnvironment = scene.environment;
    scene.environment = null;
  }

  function restoreSceneEnvironment(): void {
    if (savedEnvironment === undefined) return;
    scene.environment = savedEnvironment;
    savedEnvironment = undefined;
  }

  function trackPreviewMaterial<T extends THREE.Material>(material: T): T {
    previewMaterials.add(material);
    return material;
  }

  return {
    start,
    renderNextSample,
    stop,
    dispose,
    status,
    isActive: () => active
  };
}

function createPathTraceMaterial(source: THREE.Material): THREE.MeshPhysicalMaterial {
  const material = source as Partial<THREE.MeshStandardMaterial> & Record<string, unknown>;
  const params: THREE.MeshPhysicalMaterialParameters = {
    name: source.name ? `${source.name} Path Trace Preview` : "Path Trace Preview Material",
    color: material.color instanceof THREE.Color ? material.color : new THREE.Color("#d6d8da"),
    emissive: material.emissive instanceof THREE.Color ? material.emissive : new THREE.Color("#000000"),
    emissiveIntensity: finiteMaterialNumber(material.emissiveIntensity, 0),
    roughness: finiteMaterialNumber(material.roughness, 0.56),
    metalness: finiteMaterialNumber(material.metalness, 0),
    opacity: finiteMaterialNumber(source.opacity, 1),
    transparent: source.transparent || finiteMaterialNumber(source.opacity, 1) < 0.999,
    side: source.side,
    iridescenceThicknessRange: [100, 400]
  };
  if (material.map instanceof THREE.Texture) params.map = material.map;
  if (material.alphaMap instanceof THREE.Texture) params.alphaMap = material.alphaMap;
  if (material.normalMap instanceof THREE.Texture) params.normalMap = material.normalMap;
  if (material.emissiveMap instanceof THREE.Texture) params.emissiveMap = material.emissiveMap;
  const preview = new THREE.MeshPhysicalMaterial(params);
  preview.transmission = finiteMaterialNumber(material.transmission, 0);
  preview.ior = finiteMaterialNumber(material.ior, 1.5);
  preview.thickness = finiteMaterialNumber(material.thickness, 0);
  preview.iridescence = finiteMaterialNumber(material.iridescence, 0);
  preview.iridescenceIOR = finiteMaterialNumber(material.iridescenceIOR, 1.3);
  preview.clearcoat = finiteMaterialNumber(material.clearcoat, 0);
  preview.clearcoatRoughness = finiteMaterialNumber(material.clearcoatRoughness, 0);
  return preview;
}

function finiteMaterialNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function configurePathTracer(pathTracer: WebGLPathTracer): WebGLPathTracer {
  pathTracer.bounces = 6;
  pathTracer.transmissiveBounces = 4;
  pathTracer.filterGlossyFactor = 0.35;
  pathTracer.renderDelay = 0;
  pathTracer.fadeDuration = 0;
  pathTracer.minSamples = 1;
  pathTracer.renderScale = 0.85;
  pathTracer.rasterizeScene = false;
  pathTracer.dynamicLowRes = false;
  pathTracer.tiles.set(2, 2);
  pathTracer.textureSize.set(1024, 1024);
  return pathTracer;
}

function loadPathTracerModule(): Promise<PathTracerModule> {
  pathTracerModulePromise ??= import("three-gpu-pathtracer");
  return pathTracerModulePromise;
}

function clampSamples(value: number): number {
  if (!Number.isFinite(value)) return 32;
  return Math.min(Math.max(Math.round(value), 4), 128);
}

function detectPathTraceSupport(renderer: THREE.WebGLRenderer): { supported: boolean; unsupportedReason: string | null } {
  if (!renderer.capabilities.isWebGL2) {
    return { supported: false, unsupportedReason: "Path tracing requires WebGL2." };
  }
  if (isAutomatedBrowser()) {
    return { supported: false, unsupportedReason: "Path tracing is disabled in automated browser tests." };
  }
  if (isSoftwareRenderer(renderer)) {
    return { supported: false, unsupportedReason: "Path tracing requires a hardware WebGL renderer." };
  }
  return { supported: true, unsupportedReason: null };
}

function isAutomatedBrowser(): boolean {
  return typeof navigator !== "undefined" && navigator.webdriver;
}

function isSoftwareRenderer(renderer: THREE.WebGLRenderer): boolean {
  const gl = renderer.getContext();
  const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
  const rendererName = debugInfo
    ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL))
    : String(gl.getParameter(gl.RENDERER));
  return /swiftshader|llvmpipe|software|mesa offscreen/i.test(rendererName);
}

function ensureRendererContextAttributes(renderer: THREE.WebGLRenderer): void {
  const rendererWithFallback = renderer as THREE.WebGLRenderer & { __pathTraceContextAttributesFallback?: boolean };
  if (rendererWithFallback.__pathTraceContextAttributesFallback) return;

  const original = renderer.getContextAttributes.bind(renderer);
  renderer.getContextAttributes = (() => original() ?? {
    alpha: true,
    antialias: true,
    depth: true,
    desynchronized: false,
    failIfMajorPerformanceCaveat: false,
    powerPreference: "high-performance",
    premultipliedAlpha: true,
    preserveDrawingBuffer: true,
    stencil: false
  }) as typeof renderer.getContextAttributes;
  rendererWithFallback.__pathTraceContextAttributesFallback = true;
}
