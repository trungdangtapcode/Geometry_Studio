import "./styles.css";

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { updateEntryAnimation } from "./animation/timeline";
import { CommandHistory } from "./editor/commands";
import { createSceneDocument, validateSceneDocument } from "./editor/documents";
import type {
  AnimationMode,
  LightKind,
  MaterialMode,
  ObjectKind,
  PrimitiveType,
  RenderMode,
  SceneDocument,
  SceneEntry,
  SerializedObject,
  ToastTone
} from "./editor/types";
import { createRenderPipeline } from "./renderer/pipeline";
import { loadModelFromFile } from "./scene/importers";
import { createLights, createStage, currentLight, setActiveLight, syncLightHelpers, syncLights, updateLightSweep } from "./scene/lights";
import { buildGeometryVisual, buildModelVisual, makeTexturePreset } from "./scene/materials";
import { createPrimitiveGeometry, createSampleModel, labelForPrimitive, normalizedGeometry } from "./scene/primitives";
import { studioTemplate } from "./ui/template";
import { capitalize, clamp, downloadText, formatNumber, hasWebGL2, hydrateIcons, query, safeJsonParse } from "./utils/dom";
import { ResourceTracker } from "./utils/resourceTracker";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Missing #app container.");
}

if (!hasWebGL2()) {
  app.innerHTML = `
    <main class="fallback">
      <h1>WebGL2 is unavailable</h1>
      <p>This project needs a browser with WebGL2 enabled to render the 3D studio.</p>
    </main>
  `;
} else {
  boot(app);
}

function boot(root: HTMLDivElement): void {
  root.innerHTML = studioTemplate();
  hydrateIcons();

  const canvas = query<HTMLCanvasElement>("#scene-canvas");
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#e9edf0");
  scene.fog = new THREE.Fog("#e9edf0", 28, 90);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500);
  camera.position.set(7.5, 5.5, 9);

  const { renderer, composer, outlinePass, resize: resizePipeline } = createRenderPipeline(canvas, scene, camera);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(0, 1.2, 0);
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.minDistance = 2.5;
  controls.maxDistance = 48;
  controls.update();

  const transformControls = new TransformControls(camera, renderer.domElement);
  transformControls.setMode("translate");
  transformControls.setSpace("world");
  scene.add(transformControls.getHelper());

  const resourceTracker = new ResourceTracker();
  const history = new CommandHistory();
  const entries = new Map<string, SceneEntry>();
  let selectedId = "";
  let idCounter = 1;
  let playing = false;
  let transformSpace: "world" | "local" = "world";
  let lastFpsTime = performance.now();
  let frameCount = 0;
  let statsVisible = true;
  let pendingDragSnapshot: SceneDocument | null = null;

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const clock = new THREE.Clock();
  const stage = createStage();
  const lightRig = createLights(scene);
  const frustumHelper = new THREE.CameraHelper(camera);
  frustumHelper.visible = false;
  scene.add(stage.ground, stage.grid, stage.axes, frustumHelper);

  seedDefaultScene();
  setSelected(firstEntryId());
  bindEvents();
  updateAllUI();
  showToast("Studio upgraded: JSON save/load, Undo/Redo, telemetry, drag-drop import, tours, and screenshots are ready.", "good");
  animate();

  function seedDefaultScene(): void {
    addPrimitive("cube", new THREE.Vector3(0, 0.02, 0), { color: "#4bd0a0" }, false);
    addPrimitive("torus", new THREE.Vector3(-3.2, 0.02, -1.6), { color: "#f7bd4b", renderMode: "lines", animation: "spin" }, false);
    addPrimitive("sphere", new THREE.Vector3(3.2, 0.02, -1.2), { color: "#df6b80", textureName: "checker", animation: "pulse" }, false);
  }

  function addPrimitive(
    primitiveType: PrimitiveType,
    position = nextSpawnPosition(),
    options: Partial<Pick<SceneEntry, "renderMode" | "materialMode" | "animation" | "textureName">> & { color?: string; name?: string; id?: string } = {},
    record = true
  ): SceneEntry {
    if (record) recordHistory();
    const geometry = normalizedGeometry(createPrimitiveGeometry(primitiveType));
    const entry = makeEntry({
      id: options.id,
      kind: "primitive",
      type: primitiveType,
      name: options.name ?? labelForPrimitive(primitiveType),
      sourceGeometry: geometry,
      color: new THREE.Color(options.color ?? accentColor(idCounter)),
      renderMode: options.renderMode ?? "solid",
      materialMode: options.materialMode ?? "standard",
      animation: options.animation ?? "none",
      textureName: options.textureName ?? "none"
    });

    entry.root.position.copy(position);
    entry.basePosition.copy(position);
    rebuildEntryVisual(entry);
    scene.add(entry.root);
    entries.set(entry.id, entry);
    setSelected(entry.id);
    updateAllUI();
    if (record) showToast(`${entry.name} added`, "good");
    return entry;
  }

  function addSampleModel(position = nextSpawnPosition(), record = true): SceneEntry {
    if (record) recordHistory();
    const entry = makeEntry({
      kind: "sampleModel",
      type: "model",
      name: "Sample Drone",
      sourceObject: createSampleModel(),
      color: new THREE.Color("#d8dadf"),
      renderMode: "solid",
      materialMode: "standard",
      animation: "spin",
      textureName: "none"
    });
    entry.root.position.copy(position);
    entry.basePosition.copy(position);
    rebuildEntryVisual(entry);
    scene.add(entry.root);
    entries.set(entry.id, entry);
    setSelected(entry.id);
    updateAllUI();
    if (record) showToast("Built-in sample model added", "good");
    return entry;
  }

  function makeEntry(config: {
    id?: string;
    kind: ObjectKind;
    type: PrimitiveType | "model";
    name: string;
    sourceGeometry?: THREE.BufferGeometry;
    sourceObject?: THREE.Object3D;
    color: THREE.Color;
    renderMode?: RenderMode;
    materialMode?: MaterialMode;
    animation?: AnimationMode;
    textureName?: string;
  }): SceneEntry {
    const id = config.id ?? `object-${idCounter++}`;
    idCounter = Math.max(idCounter, numericObjectId(id) + 1);
    const root = new THREE.Group();
    root.name = config.name;
    root.userData.sceneId = id;
    const textureName = config.textureName ?? "none";
    const texture = textureName === "none" ? null : resourceTracker.track(makeTexturePreset(textureName));
    return {
      id,
      root,
      kind: config.kind,
      type: config.type,
      name: config.name,
      sourceGeometry: config.sourceGeometry,
      sourceObject: config.sourceObject,
      renderMode: config.renderMode ?? "solid",
      materialMode: config.materialMode ?? "standard",
      color: config.color,
      texture,
      textureName,
      textureRepeat: new THREE.Vector2(1, 1),
      animation: config.animation ?? "none",
      basePosition: root.position.clone(),
      baseScale: root.scale.clone(),
      phase: Math.random() * Math.PI * 2
    };
  }

  function rebuildEntryVisual(entry: SceneEntry): void {
    resourceTracker.disposeObject(entry.root);
    const visual = entry.kind === "primitive" && entry.sourceGeometry
      ? buildGeometryVisual(entry, resourceTracker)
      : buildModelVisual(entry, resourceTracker);

    visual.traverse((object) => {
      object.userData.sceneId = entry.id;
      if ((object as THREE.Mesh).isMesh) {
        const mesh = object as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    entry.root.add(visual);
    syncLights(lightRig, entries.values());
    syncOutline();
  }

  function setSelected(id: string): void {
    const entry = entries.get(id);
    if (!entry) return;
    selectedId = id;
    transformControls.attach(entry.root);
    syncOutline();
    updateAllUI();
  }

  function syncOutline(): void {
    const selected = selectedEntry();
    outlinePass.selectedObjects = selected ? [selected.root] : [];
  }

  function selectedEntry(): SceneEntry | null {
    return entries.get(selectedId) ?? null;
  }

  function firstEntryId(): string {
    return entries.keys().next().value as string;
  }

  function bindEvents(): void {
    document.querySelectorAll<HTMLButtonElement>(".primitive-btn").forEach((button) => {
      button.addEventListener("click", () => addPrimitive(button.dataset.primitive as PrimitiveType));
    });

    query<HTMLButtonElement>("#sample-model-btn").addEventListener("click", () => addSampleModel());
    query<HTMLButtonElement>("#delete-selected").addEventListener("click", deleteSelected);
    query<HTMLButtonElement>("#duplicate-selected").addEventListener("click", duplicateSelected);
    query<HTMLButtonElement>("#reset-scene").addEventListener("click", resetScene);
    query<HTMLButtonElement>("#play-toggle").addEventListener("click", togglePlay);
    query<HTMLButtonElement>("#cinematic-btn").addEventListener("click", startCinematicDemo);
    query<HTMLButtonElement>("#evaluation-btn").addEventListener("click", startEvaluationTour);
    query<HTMLButtonElement>("#screenshot-btn").addEventListener("click", exportScreenshot);
    query<HTMLButtonElement>("#save-scene").addEventListener("click", saveScene);
    query<HTMLInputElement>("#scene-input").addEventListener("change", handleSceneLoad);
    query<HTMLButtonElement>("#undo-btn").addEventListener("click", undo);
    query<HTMLButtonElement>("#redo-btn").addEventListener("click", redo);
    query<HTMLInputElement>("#object-name").addEventListener("change", renameSelected);

    document.querySelectorAll<HTMLButtonElement>(".transform-tool").forEach((button) => {
      button.addEventListener("click", () => setTransformMode(button.dataset.mode as "translate" | "rotate" | "scale"));
    });

    transformControls.addEventListener("dragging-changed", (event) => {
      controls.enabled = !event.value;
      if (event.value) pendingDragSnapshot = snapshot();
      if (!event.value && pendingDragSnapshot) {
        history.record(pendingDragSnapshot);
        pendingDragSnapshot = null;
        syncHistoryButtons();
      }
      syncSelectedBases();
    });
    transformControls.addEventListener("objectChange", () => {
      syncTransformUI();
      syncSelectedBases();
    });

    query<HTMLButtonElement>("#toggle-space").addEventListener("click", () => {
      transformSpace = transformSpace === "world" ? "local" : "world";
      transformControls.setSpace(transformSpace);
      query<HTMLButtonElement>("#toggle-space span:last-child").textContent = `${capitalize(transformSpace)} Space`;
    });

    query<HTMLButtonElement>("#reset-transform").addEventListener("click", () => {
      const entry = selectedEntry();
      if (!entry) return;
      recordHistory();
      entry.root.position.set(0, 0.02, 0);
      entry.root.rotation.set(0, 0, 0);
      entry.root.scale.set(1, 1, 1);
      syncSelectedBases();
      updateAllUI();
    });

    query<HTMLSelectElement>("#material-mode").addEventListener("change", (event) => {
      updateSelectedEntry((entry) => {
        entry.materialMode = (event.target as HTMLSelectElement).value as MaterialMode;
        rebuildEntryVisual(entry);
      });
    });

    query<HTMLInputElement>("#object-color").addEventListener("change", (event) => {
      updateSelectedEntry((entry) => {
        entry.color.set((event.target as HTMLInputElement).value);
        rebuildEntryVisual(entry);
      });
    });

    document.querySelectorAll<HTMLButtonElement>("[data-render]").forEach((button) => {
      button.addEventListener("click", () => {
        updateSelectedEntry((entry) => {
          entry.renderMode = button.dataset.render as RenderMode;
          rebuildEntryVisual(entry);
        });
      });
    });

    document.querySelectorAll<HTMLButtonElement>("[data-animation]").forEach((button) => {
      button.addEventListener("click", () => {
        updateSelectedEntry((entry) => {
          entry.animation = button.dataset.animation as AnimationMode;
          entry.basePosition.copy(entry.root.position);
          entry.baseScale.copy(entry.root.scale);
        });
      });
    });

    document.querySelectorAll<HTMLButtonElement>("[data-texture]").forEach((button) => {
      button.addEventListener("click", () => {
        const entry = selectedEntry();
        if (!entry) return;
        applyTexture(entry, button.dataset.texture ?? "none");
      });
    });

    document.querySelectorAll<HTMLButtonElement>(".material-preset").forEach((button) => {
      button.addEventListener("click", () => applyMaterialPreset(button.dataset.materialPreset ?? "standard"));
    });

    query<HTMLInputElement>("#texture-input").addEventListener("change", handleTextureUpload);
    query<HTMLInputElement>("#model-input").addEventListener("change", handleModelImport);

    document.querySelectorAll<HTMLInputElement>(".texture-repeat").forEach((input) => {
      input.addEventListener("change", () => {
        updateSelectedEntry((entry) => {
          const axis = input.dataset.axis as "x" | "y";
          entry.textureRepeat[axis] = Number(input.value);
          rebuildEntryVisual(entry);
        });
      });
    });

    document.querySelectorAll<HTMLButtonElement>("[data-view]").forEach((button) => {
      button.addEventListener("click", () => {
        recordHistory();
        setCameraPreset(button.dataset.view ?? "reset");
      });
    });

    document.querySelectorAll<HTMLButtonElement>("[data-light]").forEach((button) => {
      button.addEventListener("click", () => {
        recordHistory();
        setActiveLight(lightRig, button.dataset.light as LightKind);
        updateAllUI();
      });
    });

    query<HTMLInputElement>("#light-intensity").addEventListener("change", (event) => {
      recordHistory();
      currentLight(lightRig).intensity = Number((event.target as HTMLInputElement).value);
      updateAllUI();
    });
    query<HTMLInputElement>("#light-color").addEventListener("change", (event) => {
      recordHistory();
      currentLight(lightRig).color.set((event.target as HTMLInputElement).value);
      updateAllUI();
    });
    query<HTMLInputElement>("#ambient-intensity").addEventListener("change", (event) => {
      recordHistory();
      lightRig.ambient.intensity = Number((event.target as HTMLInputElement).value);
    });
    query<HTMLInputElement>("#shadow-toggle").addEventListener("change", (event) => {
      recordHistory();
      lightRig.shadows = (event.target as HTMLInputElement).checked;
      syncLights(lightRig, entries.values());
    });
    query<HTMLInputElement>("#helper-toggle").addEventListener("change", (event) => {
      recordHistory();
      lightRig.helpers = (event.target as HTMLInputElement).checked;
      syncLights(lightRig, entries.values());
    });
    query<HTMLInputElement>("#light-sweep").addEventListener("change", (event) => {
      recordHistory();
      lightRig.sweep = (event.target as HTMLInputElement).checked;
    });
    query<HTMLInputElement>("#grid-toggle").addEventListener("change", (event) => {
      recordHistory();
      stage.grid.visible = (event.target as HTMLInputElement).checked;
    });
    query<HTMLInputElement>("#axes-toggle").addEventListener("change", (event) => {
      recordHistory();
      stage.axes.visible = (event.target as HTMLInputElement).checked;
    });
    query<HTMLInputElement>("#stats-toggle").addEventListener("change", (event) => {
      recordHistory();
      statsVisible = (event.target as HTMLInputElement).checked;
      query<HTMLDivElement>("#fps").classList.toggle("hidden", !statsVisible);
      query<HTMLDivElement>("#telemetry-grid").classList.toggle("hidden", !statsVisible);
    });
    query<HTMLInputElement>("#frustum-toggle").addEventListener("change", (event) => {
      recordHistory();
      frustumHelper.visible = (event.target as HTMLInputElement).checked;
      frustumHelper.update();
    });

    canvas.addEventListener("pointerdown", handleCanvasPick);
    window.addEventListener("keydown", handleKeyboard);
    window.addEventListener("resize", resize);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);
  }

  function updateSelectedEntry(mutator: (entry: SceneEntry) => void): void {
    const entry = selectedEntry();
    if (!entry) return;
    recordHistory();
    mutator(entry);
    updateAllUI();
  }

  function updateAllUI(): void {
    renderOutliner();
    syncTransformUI();
    syncCameraUI();
    syncLightUI();
    syncSelectionSummary();
    syncSegmentedButtons();
    syncTextureUI();
    syncHistoryButtons();
    updateTelemetry();
  }

  function renderOutliner(): void {
    const outliner = query<HTMLDivElement>("#outliner");
    outliner.innerHTML = "";
    entries.forEach((entry) => {
      const item = document.createElement("button");
      item.className = "outliner-item";
      item.type = "button";
      item.dataset.id = entry.id;
      item.ariaLabel = `Select ${entry.name}`;
      item.classList.toggle("active", entry.id === selectedId);
      item.innerHTML = `
        <span class="object-dot" style="background:${entry.color.getStyle()}"></span>
        <span class="object-name">${entry.name}</span>
        <span class="object-mode">${capitalize(entry.renderMode)}</span>
      `;
      item.addEventListener("click", () => setSelected(entry.id));
      outliner.appendChild(item);
    });
  }

  function syncTransformUI(): void {
    const entry = selectedEntry();
    const grid = query<HTMLDivElement>("#transform-grid");
    const rows = [
      ["position", "Position", entry?.root.position ?? new THREE.Vector3()],
      ["rotation", "Rotation", entry?.root.rotation ?? new THREE.Euler()],
      ["scale", "Scale", entry?.root.scale ?? new THREE.Vector3(1, 1, 1)]
    ] as const;

    grid.innerHTML = rows
      .map(([key, label, value]) => {
        const values = key === "rotation"
          ? [THREE.MathUtils.radToDeg((value as THREE.Euler).x), THREE.MathUtils.radToDeg((value as THREE.Euler).y), THREE.MathUtils.radToDeg((value as THREE.Euler).z)]
          : [(value as THREE.Vector3).x, (value as THREE.Vector3).y, (value as THREE.Vector3).z];
        return `
          <div class="grid-label">${label}</div>
          ${["x", "y", "z"].map((axis, index) => `
            <label class="axis-input">
              <span>${axis.toUpperCase()}</span>
              <input class="transform-input" data-prop="${key}" data-axis="${axis}" type="number" step="0.1" value="${formatNumber(values[index])}" />
            </label>
          `).join("")}
        `;
      })
      .join("");

    grid.querySelectorAll<HTMLInputElement>(".transform-input").forEach((input) => {
      input.addEventListener("change", () => {
        const current = selectedEntry();
        if (!current) return;
        recordHistory();
        const prop = input.dataset.prop as "position" | "rotation" | "scale";
        const axis = input.dataset.axis as "x" | "y" | "z";
        const value = Number(input.value);
        if (prop === "rotation") current.root.rotation[axis] = THREE.MathUtils.degToRad(value);
        else current.root[prop][axis] = value;
        syncSelectedBases();
        updateAllUI();
      });
    });
  }

  function syncCameraUI(): void {
    const grid = query<HTMLDivElement>("#camera-grid");
    const values = [
      ["position", "X", "x", camera.position.x, 0.1],
      ["position", "Y", "y", camera.position.y, 0.1],
      ["position", "Z", "z", camera.position.z, 0.1],
      ["camera", "FOV", "fov", camera.fov, 1],
      ["camera", "Near", "near", camera.near, 0.01],
      ["camera", "Far", "far", camera.far, 1]
    ] as const;
    grid.innerHTML = values
      .map(([group, label, prop, value, step]) => `
        <label class="axis-input wide-axis">
          <span>${label}</span>
          <input class="camera-input" data-group="${group}" data-prop="${prop}" type="number" step="${step}" value="${formatNumber(value)}" />
        </label>
      `)
      .join("");

    grid.querySelectorAll<HTMLInputElement>(".camera-input").forEach((input) => {
      input.addEventListener("change", () => {
        recordHistory();
        const prop = input.dataset.prop!;
        const value = Number(input.value);
        if (prop === "x" || prop === "y" || prop === "z") camera.position[prop] = value;
        else if (prop === "fov") camera.fov = clamp(value, 1, 175);
        else if (prop === "near") camera.near = clamp(value, 0.01, camera.far - 0.01);
        else if (prop === "far") camera.far = Math.max(value, camera.near + 0.01);
        camera.updateProjectionMatrix();
        frustumHelper.update();
        controls.update();
        syncCameraUI();
      });
    });

    query<HTMLDivElement>("#camera-chip").textContent = `FOV ${formatNumber(camera.fov)} | Near ${formatNumber(camera.near)} | Far ${formatNumber(camera.far)}`;
  }

  function syncLightUI(): void {
    const light = currentLight(lightRig);
    query<HTMLInputElement>("#light-intensity").value = String(light.intensity);
    query<HTMLInputElement>("#light-color").value = `#${light.color.getHexString()}`;
    query<HTMLInputElement>("#ambient-intensity").value = String(lightRig.ambient.intensity);
    query<HTMLInputElement>("#shadow-toggle").checked = lightRig.shadows;
    query<HTMLInputElement>("#helper-toggle").checked = lightRig.helpers;
    query<HTMLInputElement>("#light-sweep").checked = lightRig.sweep;

    const grid = query<HTMLDivElement>("#light-grid");
    grid.innerHTML = ["x", "y", "z"]
      .map((axis) => `
        <label class="axis-input wide-axis">
          <span>${axis.toUpperCase()}</span>
          <input class="light-input" data-axis="${axis}" type="number" step="0.25" value="${formatNumber(light.position[axis as "x" | "y" | "z"])}" />
        </label>
      `)
      .join("");
    grid.querySelectorAll<HTMLInputElement>(".light-input").forEach((input) => {
      input.addEventListener("change", () => {
        recordHistory();
        const axis = input.dataset.axis as "x" | "y" | "z";
        currentLight(lightRig).position[axis] = Number(input.value);
        syncLightHelpers(lightRig);
      });
    });
  }

  function syncSelectionSummary(): void {
    const entry = selectedEntry();
    const summary = entry
      ? `${entry.name} | ${capitalize(entry.renderMode)} | ${entry.animation === "none" ? "Static" : capitalize(entry.animation)}`
      : "No object selected";
    query<HTMLParagraphElement>("#selection-summary").textContent = summary;
    query<HTMLInputElement>("#object-name").value = entry?.name ?? "";
  }

  function syncSegmentedButtons(): void {
    const entry = selectedEntry();
    document.querySelectorAll<HTMLButtonElement>("[data-render]").forEach((button) => {
      button.classList.toggle("active", button.dataset.render === entry?.renderMode);
    });
    document.querySelectorAll<HTMLButtonElement>("[data-animation]").forEach((button) => {
      button.classList.toggle("active", button.dataset.animation === entry?.animation);
    });
    document.querySelectorAll<HTMLButtonElement>("[data-light]").forEach((button) => {
      button.classList.toggle("active", button.dataset.light === lightRig.active);
    });
    query<HTMLSelectElement>("#material-mode").value = entry?.materialMode ?? "standard";
    query<HTMLInputElement>("#object-color").value = entry ? `#${entry.color.getHexString()}` : "#4bd0a0";
    query<HTMLInputElement>("#grid-toggle").checked = stage.grid.visible;
    query<HTMLInputElement>("#axes-toggle").checked = stage.axes.visible;
    query<HTMLInputElement>("#stats-toggle").checked = statsVisible;
    query<HTMLInputElement>("#frustum-toggle").checked = frustumHelper.visible;
  }

  function syncTextureUI(): void {
    const entry = selectedEntry();
    document.querySelectorAll<HTMLElement>(".texture-swatch").forEach((button) => {
      button.classList.toggle("active", button.dataset.texture === entry?.textureName);
    });
    document.querySelectorAll<HTMLInputElement>(".texture-repeat").forEach((input) => {
      const axis = input.dataset.axis as "x" | "y";
      input.value = String(entry?.textureRepeat[axis] ?? 1);
    });
  }

  function syncHistoryButtons(): void {
    query<HTMLButtonElement>("#undo-btn").disabled = !history.canUndo();
    query<HTMLButtonElement>("#redo-btn").disabled = !history.canRedo();
  }

  function syncSelectedBases(): void {
    const entry = selectedEntry();
    if (!entry) return;
    if (entry.animation === "bounce" || entry.animation === "orbit") entry.basePosition.copy(entry.root.position);
    if (entry.animation === "pulse") entry.baseScale.copy(entry.root.scale);
  }

  function applyTexture(entry: SceneEntry, textureName: string): void {
    recordHistory();
    resourceTracker.disposeResource(entry.texture);
    entry.textureName = textureName;
    entry.texture = textureName === "none" ? null : resourceTracker.track(makeTexturePreset(textureName));
    entry.materialMode = entry.materialMode === "normal" ? "standard" : entry.materialMode;
    rebuildEntryVisual(entry);
    updateAllUI();
    showToast(textureName === "none" ? "Texture removed" : `${capitalize(textureName)} texture applied`, "good");
  }

  function applyMaterialPreset(preset: string): void {
    updateSelectedEntry((entry) => {
      if (preset === "texture") {
        entry.materialMode = "standard";
        if (entry.textureName === "none") {
          entry.textureName = "uv";
          entry.texture = resourceTracker.track(makeTexturePreset("uv"));
        }
      } else {
        entry.materialMode = preset as MaterialMode;
      }
      rebuildEntryVisual(entry);
    });
  }

  function handleTextureUpload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) void importTextureFile(file);
  }

  async function importTextureFile(file: File): Promise<void> {
    const entry = selectedEntry();
    if (!entry) return;
    if (!file.type.startsWith("image/")) {
      showToast("Drop an image file to apply it as a texture.", "bad");
      return;
    }
    recordHistory();
    const url = URL.createObjectURL(file);
    setProgress("Loading texture...", 0.35);
    new THREE.TextureLoader().load(
      url,
      (texture) => {
        resourceTracker.disposeResource(entry.texture);
        texture.colorSpace = THREE.SRGBColorSpace;
        entry.texture = resourceTracker.track(texture);
        entry.textureName = "uploaded";
        entry.materialMode = entry.materialMode === "normal" ? "standard" : entry.materialMode;
        rebuildEntryVisual(entry);
        updateAllUI();
        URL.revokeObjectURL(url);
        setProgress("Texture loaded", 1);
        showToast(`Texture loaded: ${file.name}`, "good");
      },
      undefined,
      () => {
        URL.revokeObjectURL(url);
        setProgress("Texture failed", 0);
        showToast("Could not load that image texture.", "bad");
      }
    );
  }

  async function handleModelImport(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) await importModelFile(file);
    input.value = "";
  }

  async function importModelFile(file: File): Promise<void> {
    try {
      recordHistory();
      setProgress(`Loading ${file.name}`, 0.05);
      const imported = await loadModelFromFile(file, (progress) => {
        setProgress(`Loading ${progress.label}`, progress.ratio);
      });
      const entry = makeEntry({
        kind: "model",
        type: "model",
        name: imported.name,
        sourceObject: imported.object,
        color: new THREE.Color("#d8dadf"),
        renderMode: "solid",
        materialMode: "standard",
        animation: "none",
        textureName: "none"
      });
      entry.root.position.copy(nextSpawnPosition());
      entry.basePosition.copy(entry.root.position);
      rebuildEntryVisual(entry);
      scene.add(entry.root);
      entries.set(entry.id, entry);
      setSelected(entry.id);
      setProgress("Model loaded", 1);
      showToast(`Model imported: ${file.name}`, "good");
    } catch (error) {
      setProgress("Import failed", 0);
      showToast(error instanceof Error ? error.message : "Model import failed.", "bad");
    } finally {
      updateAllUI();
    }
  }

  function handleCanvasPick(event: PointerEvent): void {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const roots = Array.from(entries.values()).map((entry) => entry.root);
    const hits = raycaster.intersectObjects(roots, true);
    const sceneId = hits.find((hit) => lookupSceneId(hit.object))?.object;
    if (sceneId) {
      const id = lookupSceneId(sceneId);
      if (id) setSelected(id);
    }
  }

  function lookupSceneId(object: THREE.Object3D): string | undefined {
    let cursor: THREE.Object3D | null = object;
    while (cursor) {
      if (typeof cursor.userData.sceneId === "string") return cursor.userData.sceneId;
      cursor = cursor.parent;
    }
    return undefined;
  }

  function handleKeyboard(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
    if ((event.ctrlKey || event.metaKey) && key === "z") {
      event.preventDefault();
      undo();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && (key === "y" || (event.shiftKey && key === "z"))) {
      event.preventDefault();
      redo();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && key === "s") {
      event.preventDefault();
      saveScene();
      return;
    }
    if (key === "t") setTransformMode("translate");
    if (key === "r") setTransformMode("rotate");
    if (key === "s") setTransformMode("scale");
    if (key === " ") {
      event.preventDefault();
      togglePlay();
    }
    if (key === "delete" || key === "backspace") deleteSelected();
  }

  function setTransformMode(mode: "translate" | "rotate" | "scale"): void {
    transformControls.setMode(mode);
    document.querySelectorAll(".transform-tool").forEach((tool) => {
      tool.classList.toggle("active", (tool as HTMLElement).dataset.mode === mode);
    });
  }

  function setCameraPreset(view: string): void {
    const positions: Record<string, THREE.Vector3> = {
      front: new THREE.Vector3(0, 3.5, 12),
      top: new THREE.Vector3(0, 14, 0.01),
      iso: new THREE.Vector3(8, 6, 8),
      reset: new THREE.Vector3(7.5, 5.5, 9)
    };
    const position = positions[view] ?? positions.reset;
    camera.position.copy(position);
    controls.target.set(0, 1.2, 0);
    camera.lookAt(controls.target);
    controls.update();
    frustumHelper.update();
    syncCameraUI();
  }

  function togglePlay(): void {
    playing = !playing;
    const button = query<HTMLButtonElement>("#play-toggle");
    button.innerHTML = `<span data-icon="${playing ? "Pause" : "Play"}"></span><span>${playing ? "Pause" : "Play"}</span>`;
    hydrateIcons(button);
    showToast(playing ? "Animation running" : "Animation paused", "good");
  }

  function startCinematicDemo(): void {
    recordHistory();
    clearSceneEntries();
    const cube = addPrimitive("cube", new THREE.Vector3(-4.2, 0.02, 0.8), { color: "#4bd0a0", textureName: "uv", animation: "bounce" }, false);
    const sphere = addPrimitive("sphere", new THREE.Vector3(-1.4, 0.02, -1.6), { color: "#f7bd4b", textureName: "checker", animation: "pulse" }, false);
    const teapot = addPrimitive("teapot", new THREE.Vector3(1.55, 0.02, 0.7), { color: "#df6b80", materialMode: "phong", animation: "spin" }, false);
    const knot = addPrimitive("torusKnot", new THREE.Vector3(4.2, 0.02, -1.3), { color: "#7c70f4", renderMode: "lines", animation: "spin" }, false);
    const surface = addPrimitive("parametric", new THREE.Vector3(0, 0.02, 2.7), { color: "#2fb6c3", renderMode: "points", animation: "orbit" }, false);
    [cube, sphere, teapot, knot, surface].forEach((entry) => {
      entry.basePosition.copy(entry.root.position);
      entry.baseScale.copy(entry.root.scale);
    });
    lightRig.active = "point";
    lightRig.sweep = true;
    lightRig.point.intensity = 7;
    lightRig.point.color.set("#fff1c7");
    lightRig.point.position.set(4, 7, 4);
    setCameraPreset("iso");
    if (!playing) togglePlay();
    setSelected(teapot.id);
    updateAllUI();
    showToast("Cinematic demo staged", "good");
  }

  function startEvaluationTour(): void {
    recordHistory();
    clearSceneEntries();
    const cube = addPrimitive("cube", new THREE.Vector3(-5, 0.02, -1.3), { color: "#4bd0a0", renderMode: "solid", materialMode: "standard" }, false);
    const sphere = addPrimitive("sphere", new THREE.Vector3(-2.5, 0.02, 1.2), { color: "#df6b80", textureName: "checker", animation: "pulse" }, false);
    const cone = addPrimitive("cone", new THREE.Vector3(0, 0.02, -1.5), { color: "#f7bd4b", renderMode: "points", materialMode: "basic" }, false);
    const cylinder = addPrimitive("cylinder", new THREE.Vector3(2.5, 0.02, 1.2), { color: "#2fb6c3", materialMode: "lambert" }, false);
    const torus = addPrimitive("torus", new THREE.Vector3(5, 0.02, -1.2), { color: "#7c70f4", renderMode: "lines", animation: "spin" }, false);
    const teapot = addPrimitive("teapot", new THREE.Vector3(0, 0.02, 3.2), { color: "#f06c4f", materialMode: "phong", animation: "bounce" }, false);
    addSampleModel(new THREE.Vector3(0, 0.02, -4.1), false);
    [cube, sphere, cone, cylinder, torus, teapot].forEach((entry) => {
      entry.basePosition.copy(entry.root.position);
      entry.baseScale.copy(entry.root.scale);
    });
    lightRig.active = "spot";
    lightRig.helpers = true;
    lightRig.shadows = true;
    lightRig.sweep = true;
    stage.grid.visible = true;
    stage.axes.visible = true;
    frustumHelper.visible = true;
    setCameraPreset("iso");
    if (!playing) togglePlay();
    setSelected(cube.id);
    updateAllUI();
    const steps = [
      "Evaluation Tour: required primitives are visible.",
      "Render modes: Solid cube, Points cone, Lines torus.",
      "Projection: camera FOV, Near, Far and frustum helper are enabled.",
      "Affine transforms: select any object and use Move / Rotate / Scale.",
      "Lighting: ambient, spot light, shadows, helpers, and light sweep are active.",
      "Texture mapping: checker texture is applied to the sphere.",
      "Model loading: built-in sample model demonstrates imported model workflow.",
      "Animation: spin, bounce, pulse, and light sweep are running."
    ];
    steps.forEach((message, index) => window.setTimeout(() => showToast(message, "good"), index * 1700));
  }

  function resetScene(): void {
    recordHistory();
    clearSceneEntries();
    addPrimitive("cube", new THREE.Vector3(0, 0.02, 0), { color: "#4bd0a0" }, false);
    addPrimitive("sphere", new THREE.Vector3(3.2, 0.02, -1.2), { color: "#df6b80", textureName: "checker", animation: "pulse" }, false);
    setCameraPreset("reset");
    updateAllUI();
    showToast("Scene reset", "good");
  }

  function clearSceneEntries(): void {
    transformControls.detach();
    entries.forEach((entry) => {
      disposeEntry(entry);
      scene.remove(entry.root);
    });
    entries.clear();
    selectedId = "";
    syncOutline();
  }

  function disposeEntry(entry: SceneEntry): void {
    resourceTracker.disposeObject(entry.root);
    resourceTracker.disposeResource(entry.sourceGeometry);
    resourceTracker.disposeResource(entry.texture);
  }

  function deleteSelected(): void {
    const entry = selectedEntry();
    if (!entry) return;
    recordHistory();
    transformControls.detach();
    disposeEntry(entry);
    scene.remove(entry.root);
    entries.delete(entry.id);
    selectedId = entries.size ? firstEntryId() : "";
    if (selectedId) transformControls.attach(entries.get(selectedId)!.root);
    syncOutline();
    updateAllUI();
    showToast(`${entry.name} deleted`, "good");
  }

  function duplicateSelected(): void {
    const entry = selectedEntry();
    if (!entry) return;
    recordHistory();
    const copy = restoreObject({
      ...serializeObjectForDuplicate(entry),
      id: `object-${idCounter++}`,
      name: `${entry.name} Copy`,
      position: [entry.root.position.x + 0.8, entry.root.position.y, entry.root.position.z + 0.8]
    });
    setSelected(copy.id);
    updateAllUI();
    showToast(`${entry.name} duplicated`, "good");
  }

  function renameSelected(): void {
    const entry = selectedEntry();
    if (!entry) return;
    const name = query<HTMLInputElement>("#object-name").value.trim();
    if (!name || name === entry.name) return;
    recordHistory();
    entry.name = name;
    entry.root.name = name;
    updateAllUI();
  }

  function saveScene(): void {
    downloadText("geometry-studio.scene.json", JSON.stringify(snapshot(), null, 2));
    showToast("Scene JSON exported", "good");
  }

  async function handleSceneLoad(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const document = validateSceneDocument(safeJsonParse<SceneDocument>(text));
      recordHistory();
      restoreScene(document);
      showToast(`Scene loaded: ${file.name}`, "good");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Scene load failed.", "bad");
    } finally {
      input.value = "";
    }
  }

  function snapshot(): SceneDocument {
    return createSceneDocument({
      entries: entries.values(),
      selectedId: selectedId || null,
      playing,
      camera,
      target: controls.target,
      stage,
      statsVisible,
      frustumVisible: frustumHelper.visible,
      lightRig
    });
  }

  function recordHistory(): void {
    history.record(snapshot());
    syncHistoryButtons();
  }

  function undo(): void {
    const previous = history.undo(snapshot());
    if (!previous) return;
    restoreScene(previous, false);
    showToast("Undo", "good");
  }

  function redo(): void {
    const next = history.redo(snapshot());
    if (!next) return;
    restoreScene(next, false);
    showToast("Redo", "good");
  }

  function restoreScene(document: SceneDocument, resetHistory = false): void {
    clearSceneEntries();
    camera.fov = document.camera.fov;
    camera.near = document.camera.near;
    camera.far = document.camera.far;
    camera.position.fromArray(document.camera.position);
    controls.target.fromArray(document.camera.target);
    camera.updateProjectionMatrix();
    controls.update();
    stage.grid.visible = document.display.grid;
    stage.axes.visible = document.display.axes;
    statsVisible = document.display.stats;
    frustumHelper.visible = document.display.frustum;
    applyLightDocument(document);
    playing = document.playing;
    document.objects.forEach((object) => restoreObject(object));
    selectedId = document.selectedId && entries.has(document.selectedId) ? document.selectedId : entries.size ? firstEntryId() : "";
    if (selectedId) transformControls.attach(entries.get(selectedId)!.root);
    if (resetHistory) history.reset();
    updatePlayButton();
    syncLights(lightRig, entries.values());
    syncOutline();
    updateAllUI();
  }

  function restoreObject(object: SerializedObject): SceneEntry {
    let entry: SceneEntry;
    if (object.kind === "primitive" && object.type !== "model") {
      entry = addPrimitive(object.type, new THREE.Vector3().fromArray(object.position), {
        id: object.id,
        name: object.name,
        color: object.color,
        renderMode: object.renderMode,
        materialMode: object.materialMode,
        animation: object.animation,
        textureName: object.textureName
      }, false);
    } else {
      entry = makeEntry({
        id: object.id,
        kind: object.kind === "model" ? "sampleModel" : object.kind,
        type: "model",
        name: object.kind === "model" ? `${object.name} (sample placeholder)` : object.name,
        sourceObject: createSampleModel(),
        color: new THREE.Color(object.color),
        renderMode: object.renderMode,
        materialMode: object.materialMode,
        animation: object.animation,
        textureName: object.textureName
      });
      entry.root.position.fromArray(object.position);
      rebuildEntryVisual(entry);
      scene.add(entry.root);
      entries.set(entry.id, entry);
    }
    entry.root.rotation.set(object.rotation[0], object.rotation[1], object.rotation[2]);
    entry.root.scale.fromArray(object.scale);
    entry.textureRepeat.set(object.textureRepeat[0], object.textureRepeat[1]);
    entry.basePosition.copy(entry.root.position);
    entry.baseScale.copy(entry.root.scale);
    rebuildEntryVisual(entry);
    return entry;
  }

  function applyLightDocument(document: SceneDocument): void {
    lightRig.active = document.lights.active;
    lightRig.helpers = document.lights.helpers;
    lightRig.shadows = document.lights.shadows;
    lightRig.sweep = document.lights.sweep;
    lightRig.ambient.intensity = document.lights.ambientIntensity;
    applySerializedLight(lightRig.directional, document.lights.directional);
    applySerializedLight(lightRig.point, document.lights.point);
    applySerializedLight(lightRig.spot, document.lights.spot);
  }

  function applySerializedLight(light: THREE.DirectionalLight | THREE.PointLight | THREE.SpotLight, value: { color: string; intensity: number; position: [number, number, number] }): void {
    light.color.set(value.color);
    light.intensity = value.intensity;
    light.position.fromArray(value.position);
  }

  function exportScreenshot(): void {
    composer.render();
    const link = document.createElement("a");
    link.download = "geometry-studio.png";
    link.href = renderer.domElement.toDataURL("image/png");
    link.click();
    showToast("Screenshot exported", "good");
  }

  function handleDragOver(event: DragEvent): void {
    event.preventDefault();
    query<HTMLDivElement>("#drop-overlay").classList.add("active");
  }

  function handleDragLeave(event: DragEvent): void {
    if (event.relatedTarget) return;
    query<HTMLDivElement>("#drop-overlay").classList.remove("active");
  }

  function handleDrop(event: DragEvent): void {
    event.preventDefault();
    query<HTMLDivElement>("#drop-overlay").classList.remove("active");
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    if (file.type.startsWith("image/")) void importTextureFile(file);
    else void importModelFile(file);
  }

  function setProgress(label: string, ratio: number): void {
    const progress = query<HTMLDivElement>("#load-progress");
    progress.querySelector("span")!.style.width = `${Math.round(clamp(ratio, 0, 1) * 100)}%`;
    progress.querySelector("strong")!.textContent = label;
  }

  function animate(): void {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const elapsed = clock.elapsedTime;

    if (playing) entries.forEach((entry) => updateEntryAnimation(entry, delta, elapsed));
    if (lightRig.sweep) updateLightSweep(lightRig, elapsed);

    controls.update();
    frustumHelper.update();
    composer.render();
    updateFps();
  }

  function updateFps(): void {
    frameCount += 1;
    const now = performance.now();
    if (now - lastFpsTime > 500) {
      const fps = Math.round((frameCount * 1000) / (now - lastFpsTime));
      query<HTMLDivElement>("#fps").textContent = `${fps} FPS`;
      updateTelemetry(fps);
      frameCount = 0;
      lastFpsTime = now;
    }
  }

  function updateTelemetry(fps?: number): void {
    const info = renderer.info;
    const grid = query<HTMLDivElement>("#telemetry-grid");
    grid.innerHTML = [
      ["FPS", fps ?? "--"],
      ["Calls", info.render.calls],
      ["Triangles", info.render.triangles],
      ["Lines", info.render.lines],
      ["Points", info.render.points],
      ["Geometries", info.memory.geometries],
      ["Textures", info.memory.textures],
      ["Objects", entries.size]
    ].map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("");
  }

  function resize(): void {
    resizePipeline();
    frustumHelper.update();
    syncCameraUI();
  }

  function showToast(message: string, tone: ToastTone = "good"): void {
    const stack = query<HTMLDivElement>("#toast-stack");
    const toast = document.createElement("div");
    toast.className = `toast ${tone}`;
    toast.textContent = message;
    stack.appendChild(toast);
    window.setTimeout(() => {
      toast.classList.add("leaving");
      window.setTimeout(() => toast.remove(), 250);
    }, 3600);
  }

  function nextSpawnPosition(): THREE.Vector3 {
    const index = entries.size;
    const angle = index * 1.618;
    const radius = 2.2 + (index % 4) * 0.65;
    return new THREE.Vector3(Math.cos(angle) * radius, 0.02, Math.sin(angle) * radius);
  }

  function updatePlayButton(): void {
    const button = query<HTMLButtonElement>("#play-toggle");
    button.innerHTML = `<span data-icon="${playing ? "Pause" : "Play"}"></span><span>${playing ? "Pause" : "Play"}</span>`;
    hydrateIcons(button);
  }

  function serializeObjectForDuplicate(entry: SceneEntry): SerializedObject {
    return {
      id: entry.id,
      name: entry.name,
      kind: entry.kind,
      type: entry.type,
      renderMode: entry.renderMode,
      materialMode: entry.materialMode,
      color: `#${entry.color.getHexString()}`,
      textureName: entry.textureName === "uploaded" ? "none" : entry.textureName,
      textureRepeat: [entry.textureRepeat.x, entry.textureRepeat.y],
      animation: entry.animation,
      position: [entry.root.position.x, entry.root.position.y, entry.root.position.z],
      rotation: [entry.root.rotation.x, entry.root.rotation.y, entry.root.rotation.z],
      scale: [entry.root.scale.x, entry.root.scale.y, entry.root.scale.z]
    };
  }
}

function accentColor(index: number): string {
  const colors = ["#4bd0a0", "#df6b80", "#f7bd4b", "#7c70f4", "#2fb6c3", "#8ccf5f"];
  return colors[index % colors.length];
}

function numericObjectId(id: string): number {
  const match = id.match(/^object-(\d+)$/);
  return match ? Number(match[1]) : 0;
}
