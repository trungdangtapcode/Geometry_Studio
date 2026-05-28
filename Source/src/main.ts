import "./styles.css";

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { updateEntryAnimation } from "./animation/timeline";
import { TimelinePlayer } from "./animation/timelinePlayer";
import {
  copyTimelineObject,
  createDefaultTimeline,
  createTimelineKeyframe,
  ensureCameraTimeline,
  ensureLightTimeline,
  ensureObjectTimeline,
  ensureTimelineTrack,
  hasCameraTimelineTracks,
  hasLightTimelineTracks,
  hasObjectTransformTimelineTracks,
  hasObjectTimelineTracks,
  hasTimelineTracks,
  normalizeTimelineDocument,
  pruneEmptyTimelineTracks,
  removeTimelineObject,
  roundTime,
  snapTimelineTime,
  sortTimelineKeyframes
} from "./animation/timelineSchema";
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
  TimelineInterpolation,
  TimelineKeyframeDocument,
  TimelineTrackDocument,
  TimelineTrackKind,
  ToastTone
} from "./editor/types";
import { createRenderPipeline } from "./renderer/pipeline";
import { loadModelFromFile } from "./scene/importers";
import { createLights, createStage, currentLight, setActiveLight, syncLightHelpers, syncLights, updateLightSweep } from "./scene/lights";
import { buildGeometryVisual, buildModelVisual, makeTexturePreset, syncTextureTransform } from "./scene/materials";
import { createPrimitiveGeometry, createSampleModel, labelForPrimitive, normalizedGeometry } from "./scene/primitives";
import { KeyframeTimelinePanel } from "./ui/timelinePanel";
import { studioTemplate } from "./ui/template";
import { capitalize, clamp, downloadText, formatNumber, hasWebGL2, hydrateIcons, query, safeJsonParse } from "./utils/dom";
import { ResourceTracker } from "./utils/resourceTracker";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Missing #app container.");
}

type TimelineKeyframeSource = {
  scope: "object" | "camera" | "lights";
  objectId: string;
  track: TimelineTrackDocument;
  keyframe: TimelineKeyframeDocument;
};

type TimelineClipboardKeyframe = {
  scope: "object" | "camera" | "lights";
  kind: TimelineTrackKind;
  relativeTime: number;
  value: [number, number, number];
  interpolation: TimelineInterpolation;
};

type TimelineClipboard = {
  keyframes: TimelineClipboardKeyframe[];
};

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
  const timelinePlayer = new TimelinePlayer();
  const entries = new Map<string, SceneEntry>();
  let sceneTimeline = createDefaultTimeline();
  let selectedId = "";
  let idCounter = 1;
  let playing = false;
  let transformSpace: "world" | "local" = "world";
  let lastFpsTime = performance.now();
  let frameCount = 0;
  let statsVisible = true;
  let recordingPreview = false;
  let previewRecorder: MediaRecorder | null = null;
  let previewChunks: Blob[] = [];
  let timelineClipboard: TimelineClipboard | null = null;
  let pendingDragSnapshot: SceneDocument | null = null;
  let pendingTimelineDragSnapshot: SceneDocument | null = null;
  let evaluationTourTimers: number[] = [];

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const clock = new THREE.Clock();
  const stage = createStage();
  const lightRig = createLights(scene);
  const frustumHelper = new THREE.CameraHelper(camera);
  frustumHelper.visible = false;
  scene.add(stage.ground, stage.grid, stage.axes, frustumHelper);

  const timelinePanel = new KeyframeTimelinePanel({
    onTimeChanged: setTimelineTime,
    onAddKeyframe: addTimelineKeyframe,
    onDeleteKeyframes: deleteTimelineKeyframes,
    onCopyKeyframes: copyTimelineKeyframes,
    onPasteKeyframes: pasteTimelineKeyframes,
    onDuplicateKeyframes: duplicateTimelineKeyframes,
    onClearTrack: clearTimelineTrack,
    onToggleTrack: toggleTimelineTrack,
    onTrackKindChanged: updateAllUI,
    onTrackLabelSelected: selectTimelineTrackLabel,
    onStepKeyframe: stepTimelineKeyframe,
    onStepFrame: stepTimelineFrame,
    onSetInterpolation: setTimelineInterpolation,
    onDragStarted: beginTimelineDrag,
    onKeyframeMoved: moveTimelineKeyframe,
    onDragFinished: finishTimelineDrag,
    onSettingsChanged: updateTimelineSettings,
    onTogglePlayback: togglePlay
  });

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
    options: Partial<Pick<SceneEntry, "renderMode" | "materialMode" | "animation" | "textureName" | "opacity" | "roughness" | "metalness">> & { color?: string; name?: string; id?: string } = {},
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
      textureName: options.textureName ?? "none",
      opacity: options.opacity ?? 1,
      roughness: options.roughness ?? 0.42,
      metalness: options.metalness ?? 0.08
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
    opacity?: number;
    roughness?: number;
    metalness?: number;
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
      opacity: config.opacity ?? 1,
      roughness: config.roughness ?? 0.42,
      metalness: config.metalness ?? 0.08,
      texture,
      textureName,
      textureRepeat: new THREE.Vector2(1, 1),
      textureOffset: new THREE.Vector2(0, 0),
      textureRotation: 0,
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

  function applyEntryAppearance(entry: SceneEntry): void {
    entry.root.traverse((object) => {
      const material = (object as THREE.Mesh | THREE.LineSegments | THREE.Points).material;
      if (!material) return;
      const materials = Array.isArray(material) ? material : [material];
      materials.forEach((item) => {
        if ("color" in item && item.color instanceof THREE.Color) {
          item.color.copy(entry.color);
        }
        item.transparent = entry.opacity < 1;
        item.opacity = entry.opacity;
        if ("roughness" in item && typeof item.roughness === "number") {
          item.roughness = entry.roughness;
        }
        if ("metalness" in item && typeof item.metalness === "number") {
          item.metalness = entry.metalness;
        }
        item.needsUpdate = true;
      });
    });
  }

  function applyEntryTextureTransform(entry: SceneEntry): void {
    syncTextureTransform(entry);
    entry.root.traverse((object) => {
      const material = (object as THREE.Mesh | THREE.LineSegments | THREE.Points).material;
      if (!material) return;
      const materials = Array.isArray(material) ? material : [material];
      materials.forEach((item) => {
        if ("map" in item && item.map) item.needsUpdate = true;
      });
    });
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
    query<HTMLButtonElement>("#record-video-btn").addEventListener("click", togglePreviewRecording);
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
        if (sceneTimeline.autoKey) updateAllUI();
      }
      syncSelectedBases();
    });
    transformControls.addEventListener("objectChange", () => {
      if (sceneTimeline.autoKey) {
        setTimelineKeyframe(trackKindForTransformMode(), { notify: false, record: false, refresh: false });
      }
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
        applyEntryAppearance(entry);
        if (sceneTimeline.autoKey) {
          setTimelineKeyframe("objectColor", { notify: false, record: false, refresh: false });
        }
      });
    });

    query<HTMLInputElement>("#object-opacity").addEventListener("change", (event) => {
      updateSelectedEntry((entry) => {
        entry.opacity = clamp(Number((event.target as HTMLInputElement).value), 0, 1);
        applyEntryAppearance(entry);
        if (sceneTimeline.autoKey) {
          setTimelineKeyframe("objectOpacity", { notify: false, record: false, refresh: false });
        }
      });
    });

    query<HTMLInputElement>("#object-roughness").addEventListener("change", (event) => {
      updateSelectedEntry((entry) => {
        entry.roughness = clamp(Number((event.target as HTMLInputElement).value), 0, 1);
        applyEntryAppearance(entry);
        if (sceneTimeline.autoKey) {
          setTimelineKeyframe("objectRoughness", { notify: false, record: false, refresh: false });
        }
      });
    });

    query<HTMLInputElement>("#object-metalness").addEventListener("change", (event) => {
      updateSelectedEntry((entry) => {
        entry.metalness = clamp(Number((event.target as HTMLInputElement).value), 0, 1);
        applyEntryAppearance(entry);
        if (sceneTimeline.autoKey) {
          setTimelineKeyframe("objectMetalness", { notify: false, record: false, refresh: false });
        }
      });
    });

    query<HTMLInputElement>("#object-visible").addEventListener("change", (event) => {
      updateSelectedEntry((entry) => {
        entry.root.visible = (event.target as HTMLInputElement).checked;
        if (sceneTimeline.autoKey) {
          setTimelineKeyframe("objectVisibility", { notify: false, record: false, refresh: false });
        }
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
          applyEntryTextureTransform(entry);
          if (sceneTimeline.autoKey) {
            setTimelineKeyframe("objectTextureRepeat", { notify: false, record: false, refresh: false });
          }
        });
      });
    });

    document.querySelectorAll<HTMLInputElement>(".texture-offset").forEach((input) => {
      input.addEventListener("change", () => {
        updateSelectedEntry((entry) => {
          const axis = input.dataset.axis as "x" | "y";
          entry.textureOffset[axis] = Number(input.value);
          applyEntryTextureTransform(entry);
          if (sceneTimeline.autoKey) {
            setTimelineKeyframe("objectTextureOffset", { notify: false, record: false, refresh: false });
          }
        });
      });
    });

    query<HTMLInputElement>("#texture-rotation").addEventListener("change", (event) => {
      updateSelectedEntry((entry) => {
        entry.textureRotation = THREE.MathUtils.degToRad(Number((event.target as HTMLInputElement).value));
        applyEntryTextureTransform(entry);
        if (sceneTimeline.autoKey) {
          setTimelineKeyframe("objectTextureRotation", { notify: false, record: false, refresh: false });
        }
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
      if (sceneTimeline.autoKey) {
        setTimelineKeyframe(lightIntensityTrackForKind(lightRig.active), { notify: false, record: false, refresh: false });
      }
      updateAllUI();
    });
    query<HTMLInputElement>("#light-color").addEventListener("change", (event) => {
      recordHistory();
      currentLight(lightRig).color.set((event.target as HTMLInputElement).value);
      if (sceneTimeline.autoKey) {
        setTimelineKeyframe(lightColorTrackForKind(lightRig.active), { notify: false, record: false, refresh: false });
      }
      updateAllUI();
    });
    query<HTMLInputElement>("#ambient-intensity").addEventListener("change", (event) => {
      recordHistory();
      lightRig.ambient.intensity = Number((event.target as HTMLInputElement).value);
      if (sceneTimeline.autoKey) {
        setTimelineKeyframe("ambientIntensity", { notify: false, record: false, refresh: false });
      }
      updateAllUI();
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
    timelinePanel.update(sceneTimeline, entries.values(), selectedId, playing);
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
        if (sceneTimeline.autoKey) {
          setTimelineKeyframe(prop, { notify: false, record: false, refresh: false });
        }
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
      ["target", "Target X", "x", controls.target.x, 0.1],
      ["target", "Target Y", "y", controls.target.y, 0.1],
      ["target", "Target Z", "z", controls.target.z, 0.1],
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
        const group = input.dataset.group as "position" | "target" | "camera";
        const prop = input.dataset.prop!;
        const value = Number(input.value);
        if (group === "position" && (prop === "x" || prop === "y" || prop === "z")) camera.position[prop] = value;
        else if (group === "target" && (prop === "x" || prop === "y" || prop === "z")) controls.target[prop] = value;
        else if (prop === "fov") camera.fov = clamp(value, 1, 175);
        else if (prop === "near") camera.near = clamp(value, 0.01, camera.far - 0.01);
        else if (prop === "far") camera.far = Math.max(value, camera.near + 0.01);
        camera.updateProjectionMatrix();
        frustumHelper.update();
        controls.update();
        if (sceneTimeline.autoKey) {
          setTimelineKeyframe(cameraTrackForGroup(group), { notify: false, record: false, refresh: false });
        }
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
        if (sceneTimeline.autoKey) {
          setTimelineKeyframe(lightPositionTrackForKind(lightRig.active), { notify: false, record: false, refresh: false });
        }
        updateAllUI();
      });
    });
  }

  function syncSelectionSummary(): void {
    const entry = selectedEntry();
    const summary = entry
      ? `${entry.name} | ${capitalize(entry.renderMode)} | ${hasObjectTimelineTracks(sceneTimeline, entry.id) ? "Keyframed" : entry.animation === "none" ? "Static" : capitalize(entry.animation)}`
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
    query<HTMLInputElement>("#object-opacity").value = String(entry?.opacity ?? 1);
    query<HTMLInputElement>("#object-roughness").value = String(entry?.roughness ?? 0.42);
    query<HTMLInputElement>("#object-metalness").value = String(entry?.metalness ?? 0.08);
    query<HTMLInputElement>("#object-visible").checked = entry?.root.visible ?? true;
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
    document.querySelectorAll<HTMLInputElement>(".texture-offset").forEach((input) => {
      const axis = input.dataset.axis as "x" | "y";
      input.value = String(entry?.textureOffset[axis] ?? 0);
    });
    query<HTMLInputElement>("#texture-rotation").value = String(THREE.MathUtils.radToDeg(entry?.textureRotation ?? 0));
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
    if ((event.ctrlKey || event.metaKey) && key === "c") {
      event.preventDefault();
      copyTimelineKeyframes();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && key === "v") {
      event.preventDefault();
      pasteTimelineKeyframes();
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
    if (key === "arrowleft" || key === "arrowright") {
      event.preventDefault();
      if (event.shiftKey) stepTimelineKeyframe(key === "arrowright" ? 1 : -1);
      else stepTimelineFrame(key === "arrowright" ? 1 : -1);
      return;
    }
    if (key === "home") {
      event.preventDefault();
      setTimelineTime(sceneTimeline.workStart);
      return;
    }
    if (key === "end") {
      event.preventDefault();
      setTimelineTime(sceneTimeline.workEnd);
      return;
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
    if (playing && (sceneTimeline.currentTime < sceneTimeline.workStart || sceneTimeline.currentTime >= sceneTimeline.workEnd)) {
      setTimelineTime(sceneTimeline.workStart);
    }
    updatePlayButton();
    timelinePanel.update(sceneTimeline, entries.values(), selectedId, playing);
    showToast(playing ? "Animation running" : "Animation paused", "good");
  }

  function startCinematicDemo(): void {
    recordHistory();
    clearSceneEntries();
    sceneTimeline = createDefaultTimeline();
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
    rebuildTimelineRuntime();
    updateAllUI();
    showToast("Cinematic demo staged", "good");
  }

  function startEvaluationTour(): void {
    clearEvaluationTourMessages();
    recordHistory();
    clearSceneEntries();
    sceneTimeline = createDefaultTimeline();
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
    rebuildTimelineRuntime();
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
    evaluationTourTimers = steps.map((message, index) =>
      window.setTimeout(() => showToast(message, "good"), index * 1500)
    );
  }

  function resetScene(): void {
    recordHistory();
    clearSceneEntries();
    sceneTimeline = createDefaultTimeline();
    addPrimitive("cube", new THREE.Vector3(0, 0.02, 0), { color: "#4bd0a0" }, false);
    addPrimitive("sphere", new THREE.Vector3(3.2, 0.02, -1.2), { color: "#df6b80", textureName: "checker", animation: "pulse" }, false);
    setCameraPreset("reset");
    rebuildTimelineRuntime();
    updateAllUI();
    showToast("Scene reset", "good");
  }

  function clearSceneEntries(): void {
    timelinePlayer.clear();
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
    removeTimelineObject(sceneTimeline, entry.id);
    rebuildTimelineRuntime();
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
    const copyId = `object-${idCounter++}`;
    const copy = restoreObject({
      ...serializeObjectForDuplicate(entry),
      id: copyId,
      name: `${entry.name} Copy`,
      position: [entry.root.position.x + 0.8, entry.root.position.y, entry.root.position.z + 0.8]
    });
    copyTimelineObject(sceneTimeline, entry.id, copy.id);
    rebuildTimelineRuntime();
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
      lightRig,
      timeline: sceneTimeline
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
    sceneTimeline = normalizeTimelineDocument(document.timeline, new Set(entries.keys()));
    selectedId = document.selectedId && entries.has(document.selectedId) ? document.selectedId : entries.size ? firstEntryId() : "";
    if (selectedId) transformControls.attach(entries.get(selectedId)!.root);
    if (resetHistory) history.reset();
    rebuildTimelineRuntime();
    timelinePlayer.setTime(sceneTimeline.currentTime);
    applyCameraTimeline();
    applyLightTimeline();
    applyObjectPropertyTimeline();
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
        textureName: object.textureName,
        opacity: object.opacity ?? 1,
        roughness: object.roughness ?? 0.42,
        metalness: object.metalness ?? 0.08
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
        textureName: object.textureName,
        opacity: object.opacity ?? 1,
        roughness: object.roughness ?? 0.42,
        metalness: object.metalness ?? 0.08
      });
      entry.root.position.fromArray(object.position);
      rebuildEntryVisual(entry);
      scene.add(entry.root);
      entries.set(entry.id, entry);
    }
    entry.root.rotation.set(object.rotation[0], object.rotation[1], object.rotation[2]);
    entry.root.scale.fromArray(object.scale);
    entry.root.visible = object.visible ?? true;
    entry.textureRepeat.set(object.textureRepeat[0], object.textureRepeat[1]);
    entry.textureOffset.fromArray(object.textureOffset ?? [0, 0]);
    entry.textureRotation = object.textureRotation ?? 0;
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

  function setTimelineTime(time: number): void {
    sceneTimeline.currentTime = clamp(roundTime(time), 0, sceneTimeline.duration);
    timelinePlayer.setTime(sceneTimeline.currentTime);
    applyCameraTimeline();
    applyLightTimeline();
    applyObjectPropertyTimeline();
    timelinePanel.setPlaybackTime(sceneTimeline, playing);
    if (hasCameraTimelineTracks(sceneTimeline)) syncCameraUI();
    if (hasLightTimelineTracks(sceneTimeline)) syncLightUI();
    if (hasTimelineTracks(sceneTimeline)) {
      syncTransformUI();
      syncSegmentedButtons();
      syncSelectionSummary();
    }
  }

  function advanceTimeline(delta: number): void {
    if (sceneTimeline.duration <= 0) return;
    const workStart = clamp(sceneTimeline.workStart, 0, sceneTimeline.duration);
    const workEnd = clamp(sceneTimeline.workEnd, workStart + 0.001, sceneTimeline.duration);
    const span = Math.max(workEnd - workStart, 0.001);
    let nextTime = sceneTimeline.currentTime + delta;
    if (nextTime < workStart || sceneTimeline.currentTime > workEnd) {
      nextTime = workStart;
    } else if (nextTime > workEnd) {
      if (recordingPreview) {
        nextTime = workEnd;
        playing = false;
        updatePlayButton();
        window.setTimeout(() => stopPreviewRecording(false), 0);
      } else if (sceneTimeline.loop) {
        nextTime = workStart + ((nextTime - workEnd) % span);
      } else {
        nextTime = workEnd;
        playing = false;
        updatePlayButton();
      }
    }
    sceneTimeline.currentTime = roundTime(nextTime);
    timelinePlayer.setTime(sceneTimeline.currentTime);
    applyCameraTimeline();
    applyLightTimeline();
    applyObjectPropertyTimeline();
    timelinePanel.setPlaybackTime(sceneTimeline, playing);
    if (hasCameraTimelineTracks(sceneTimeline)) syncCameraUI();
    if (hasLightTimelineTracks(sceneTimeline)) syncLightUI();
    if (hasTimelineTracks(sceneTimeline)) {
      syncTransformUI();
      syncSegmentedButtons();
      syncSelectionSummary();
    }
  }

  function updateTimelineSettings(patch: Partial<SceneDocument["timeline"]>): void {
    recordHistory();
    if (typeof patch.duration === "number" && Number.isFinite(patch.duration)) {
      sceneTimeline.duration = clamp(patch.duration, 0.5, 120);
      sceneTimeline.currentTime = clamp(sceneTimeline.currentTime, 0, sceneTimeline.duration);
      sceneTimeline.workStart = clamp(sceneTimeline.workStart, 0, sceneTimeline.duration);
      sceneTimeline.workEnd = clamp(sceneTimeline.workEnd, sceneTimeline.workStart + 0.001, sceneTimeline.duration);
    }
    if (typeof patch.workStart === "number" && Number.isFinite(patch.workStart)) sceneTimeline.workStart = clamp(patch.workStart, 0, sceneTimeline.duration - 0.001);
    if (typeof patch.workEnd === "number" && Number.isFinite(patch.workEnd)) sceneTimeline.workEnd = clamp(patch.workEnd, sceneTimeline.workStart + 0.001, sceneTimeline.duration);
    if (sceneTimeline.workEnd <= sceneTimeline.workStart) sceneTimeline.workEnd = Math.min(sceneTimeline.duration, sceneTimeline.workStart + 0.001);
    if (typeof patch.fps === "number" && Number.isFinite(patch.fps)) sceneTimeline.fps = Math.round(clamp(patch.fps, 1, 120));
    if (typeof patch.snapStep === "number" && Number.isFinite(patch.snapStep)) sceneTimeline.snapStep = clamp(patch.snapStep, 0.001, 10);
    if (typeof patch.loop === "boolean") sceneTimeline.loop = patch.loop;
    if (typeof patch.snapEnabled === "boolean") sceneTimeline.snapEnabled = patch.snapEnabled;
    if (typeof patch.autoKey === "boolean") sceneTimeline.autoKey = patch.autoKey;
    rebuildTimelineRuntime();
    timelinePlayer.setTime(sceneTimeline.currentTime);
    applyCameraTimeline();
    applyLightTimeline();
    applyObjectPropertyTimeline();
    updateAllUI();
  }

  function addTimelineKeyframe(kind: TimelineTrackKind): void {
    setTimelineKeyframe(kind);
  }

  function setTimelineKeyframe(
    kind: TimelineTrackKind,
    options: { notify?: boolean; record?: boolean; refresh?: boolean; time?: number } = {}
  ): void {
    const time = snapTimelineTime(sceneTimeline, options.time ?? sceneTimeline.currentTime);
    if (isCameraTrackKind(kind)) {
      if (options.record !== false) recordHistory();
      const cameraTimeline = ensureCameraTimeline(sceneTimeline);
      const track = ensureTimelineTrack(cameraTimeline, kind);
      const value = timelineValueForCamera(kind);
      const existing = track.keyframes.find((keyframe) => Math.abs(keyframe.time - time) < 0.001);
      if (existing) existing.value = value;
      else track.keyframes.push(createTimelineKeyframe(time, value));
      sortTimelineKeyframes(track);
      sceneTimeline.currentTime = time;
      rebuildTimelineRuntime();
      timelinePlayer.setTime(sceneTimeline.currentTime);
      applyCameraTimeline();
      if (options.refresh !== false) updateAllUI();
      if (options.notify !== false) showToast(`${cameraTrackLabel(kind)} keyframe set at ${formatNumber(time)}s`, "good");
      return;
    }

    if (isLightTrackKind(kind)) {
      if (options.record !== false) recordHistory();
      const lightTimeline = ensureLightTimeline(sceneTimeline);
      const track = ensureTimelineTrack(lightTimeline, kind);
      const value = timelineValueForLight(kind);
      const existing = track.keyframes.find((keyframe) => Math.abs(keyframe.time - time) < 0.001);
      if (existing) existing.value = value;
      else track.keyframes.push(createTimelineKeyframe(time, value));
      sortTimelineKeyframes(track);
      sceneTimeline.currentTime = time;
      rebuildTimelineRuntime();
      timelinePlayer.setTime(sceneTimeline.currentTime);
      applyLightTimeline();
      if (options.refresh !== false) updateAllUI();
      if (options.notify !== false) showToast(`${lightTrackLabel(kind)} keyframe set at ${formatNumber(time)}s`, "good");
      return;
    }

    const entry = selectedEntry();
    if (!entry) {
      if (options.notify !== false) showToast("Select an object before adding a keyframe.", "bad");
      return;
    }
    if (options.record !== false) recordHistory();
    const objectTimeline = ensureObjectTimeline(sceneTimeline, entry.id);
    const track = ensureTimelineTrack(objectTimeline, kind);
    const value = timelineValueForEntry(entry, kind);
    const existing = track.keyframes.find((keyframe) => Math.abs(keyframe.time - time) < 0.001);
    if (existing) {
      existing.value = value;
    } else {
      track.keyframes.push(createTimelineKeyframe(time, value));
    }
    sortTimelineKeyframes(track);
    if (isObjectTransformTrackKind(kind)) entry.animation = "none";
    sceneTimeline.currentTime = time;
    rebuildTimelineRuntime();
    timelinePlayer.setTime(sceneTimeline.currentTime);
    applyObjectPropertyTimeline();
    if (options.refresh !== false) updateAllUI();
    if (options.notify !== false) showToast(`${objectTrackLabel(kind)} keyframe set at ${formatNumber(time)}s`, "good");
  }

  function deleteTimelineKeyframes(keyframeIds: string[]): void {
    if (keyframeIds.length === 0) {
      showToast("Select a keyframe in the timeline first.", "bad");
      return;
    }
    recordHistory();
    const ids = new Set(keyframeIds);
    sceneTimeline.camera.tracks.forEach((track) => {
      track.keyframes = track.keyframes.filter((keyframe) => !ids.has(keyframe.id));
    });
    sceneTimeline.lights.tracks.forEach((track) => {
      track.keyframes = track.keyframes.filter((keyframe) => !ids.has(keyframe.id));
    });
    sceneTimeline.objects.forEach((objectTimeline) => {
      objectTimeline.tracks.forEach((track) => {
        track.keyframes = track.keyframes.filter((keyframe) => !ids.has(keyframe.id));
      });
    });
    pruneEmptyTimelineTracks(sceneTimeline);
    rebuildTimelineRuntime();
    timelinePlayer.setTime(sceneTimeline.currentTime);
    applyCameraTimeline();
    applyLightTimeline();
    applyObjectPropertyTimeline();
    updateAllUI();
    showToast("Keyframe deleted", "good");
  }

  function copyTimelineKeyframes(keyframeIds: string[] = timelinePanel.selectedKeyframeIdsList()): void {
    const sources = resolveTimelineKeyframeSources(keyframeIds);
    if (sources.length === 0) {
      showToast("Select a keyframe, or park the playhead on one in the active track.", "bad");
      return;
    }

    const origin = Math.min(...sources.map((source) => source.keyframe.time));
    timelineClipboard = {
      keyframes: sources.map(({ scope, track, keyframe }) => ({
        scope,
        kind: track.kind,
        relativeTime: roundTime(keyframe.time - origin),
        value: [...keyframe.value] as [number, number, number],
        interpolation: keyframe.interpolation
      }))
    };
    showToast(`${sources.length} keyframe${sources.length === 1 ? "" : "s"} copied`, "good");
  }

  function pasteTimelineKeyframes(): void {
    if (!timelineClipboard || timelineClipboard.keyframes.length === 0) {
      showToast("Copy timeline keyframes before pasting.", "bad");
      return;
    }

    const baseTime = snapTimelineTime(sceneTimeline, sceneTimeline.currentTime);
    const selectedObject = selectedEntry();
    let pasted = 0;
    let skipped = 0;

    recordHistory();
    timelineClipboard.keyframes.forEach((clip) => {
      const rawTime = baseTime + clip.relativeTime;
      if (rawTime > sceneTimeline.duration + 0.001) {
        skipped += 1;
        return;
      }
      const time = snapTimelineTime(sceneTimeline, rawTime);

      const track = pasteTargetTrack(clip, selectedObject);
      if (!track) {
        skipped += 1;
        return;
      }

      track.enabled = true;
      const existing = track.keyframes.find((keyframe) => Math.abs(keyframe.time - time) < 0.001);
      if (existing) {
        existing.value = [...clip.value] as [number, number, number];
        existing.interpolation = clip.interpolation;
      } else {
        const pastedKeyframe = createTimelineKeyframe(time, [...clip.value] as [number, number, number]);
        pastedKeyframe.interpolation = clip.interpolation;
        track.keyframes.push(pastedKeyframe);
      }
      sortTimelineKeyframes(track);
      pasted += 1;
    });

    if (selectedObject && timelineClipboard.keyframes.some((clip) => clip.scope === "object" && isObjectTransformTrackKind(clip.kind))) {
      selectedObject.animation = "none";
    }

    if (pasted === 0) {
      updateAllUI();
      showToast("No compatible keyframes could be pasted.", "bad");
      return;
    }

    sceneTimeline.currentTime = baseTime;
    rebuildTimelineRuntime();
    timelinePlayer.setTime(sceneTimeline.currentTime);
    applyCameraTimeline();
    applyLightTimeline();
    applyObjectPropertyTimeline();
    updateAllUI();
    showToast(`${pasted} keyframe${pasted === 1 ? "" : "s"} pasted${skipped ? `, ${skipped} skipped` : ""}`, "good");
  }

  function duplicateTimelineKeyframes(keyframeIds: string[]): void {
    const sources = resolveTimelineKeyframeSources(keyframeIds);
    if (sources.length === 0) {
      showToast("Select a keyframe, or park the playhead on one in the active track.", "bad");
      return;
    }

    recordHistory();
    const offset = Math.max(sceneTimeline.snapEnabled ? sceneTimeline.snapStep : 1 / sceneTimeline.fps, 0.001);
    let created = 0;
    const changedObjectIds = new Set<string>();

    sources.forEach(({ objectId, track, keyframe }) => {
      const nextTime = nextAvailableKeyframeTime(track, keyframe.time + offset, offset);
      if (nextTime === null) return;
      const duplicate = createTimelineKeyframe(nextTime, [...keyframe.value] as [number, number, number]);
      duplicate.interpolation = keyframe.interpolation;
      track.keyframes.push(duplicate);
      sortTimelineKeyframes(track);
      changedObjectIds.add(objectId);
      created += 1;
    });

    changedObjectIds.forEach((objectId) => {
      const entry = entries.get(objectId);
      if (entry && sources.some((source) => source.objectId === objectId && isObjectTransformTrackKind(source.track.kind))) {
        entry.animation = "none";
      }
    });

    if (created === 0) {
      updateAllUI();
      showToast("No room to duplicate selected keyframes.", "bad");
      return;
    }
    rebuildTimelineRuntime();
    timelinePlayer.setTime(sceneTimeline.currentTime);
    applyCameraTimeline();
    applyLightTimeline();
    applyObjectPropertyTimeline();
    updateAllUI();
    showToast(`${created} keyframe${created === 1 ? "" : "s"} duplicated`, "good");
  }

  function setTimelineInterpolation(keyframeIds: string[], interpolation: TimelineInterpolation): void {
    const sources = resolveTimelineKeyframeSources(keyframeIds);
    if (sources.length === 0) {
      showToast("Select a keyframe, or park the playhead on one in the active track.", "bad");
      return;
    }

    recordHistory();
    sources.forEach(({ keyframe }) => {
      keyframe.interpolation = interpolation;
    });
    rebuildTimelineRuntime();
    timelinePlayer.setTime(sceneTimeline.currentTime);
    applyCameraTimeline();
    applyLightTimeline();
    applyObjectPropertyTimeline();
    updateAllUI();
    showToast(`${capitalize(interpolation)} interpolation applied`, "good");
  }

  function clearTimelineTrack(kind: TimelineTrackKind): void {
    if (isCameraTrackKind(kind)) {
      const track = sceneTimeline.camera.tracks.find((candidate) => candidate.kind === kind);
      if (!track || track.keyframes.length === 0) {
        showToast(`${cameraTrackLabel(kind)} track has no keyframes.`, "bad");
        return;
      }
      recordHistory();
      sceneTimeline.camera.tracks = sceneTimeline.camera.tracks.filter((candidate) => candidate.kind !== kind);
      pruneEmptyTimelineTracks(sceneTimeline);
      rebuildTimelineRuntime();
      timelinePlayer.setTime(sceneTimeline.currentTime);
      applyCameraTimeline();
      updateAllUI();
      showToast(`${cameraTrackLabel(kind)} track cleared`, "good");
      return;
    }
    if (isLightTrackKind(kind)) {
      const track = sceneTimeline.lights.tracks.find((candidate) => candidate.kind === kind);
      if (!track || track.keyframes.length === 0) {
        showToast(`${lightTrackLabel(kind)} track has no keyframes.`, "bad");
        return;
      }
      recordHistory();
      sceneTimeline.lights.tracks = sceneTimeline.lights.tracks.filter((candidate) => candidate.kind !== kind);
      pruneEmptyTimelineTracks(sceneTimeline);
      rebuildTimelineRuntime();
      timelinePlayer.setTime(sceneTimeline.currentTime);
      applyLightTimeline();
      updateAllUI();
      showToast(`${lightTrackLabel(kind)} track cleared`, "good");
      return;
    }
    const entry = selectedEntry();
    if (!entry) {
      showToast("Select an object before clearing a track.", "bad");
      return;
    }
    const objectTimeline = sceneTimeline.objects.find((candidate) => candidate.objectId === entry.id);
    const track = objectTimeline?.tracks.find((candidate) => candidate.kind === kind);
    if (!objectTimeline || !track || track.keyframes.length === 0) {
      showToast(`${objectTrackLabel(kind)} track has no keyframes.`, "bad");
      return;
    }
    recordHistory();
    objectTimeline.tracks = objectTimeline.tracks.filter((candidate) => candidate.kind !== kind);
    pruneEmptyTimelineTracks(sceneTimeline);
    rebuildTimelineRuntime();
    timelinePlayer.setTime(sceneTimeline.currentTime);
    applyObjectPropertyTimeline();
    updateAllUI();
    showToast(`${objectTrackLabel(kind)} track cleared`, "good");
  }

  function toggleTimelineTrack(kind: TimelineTrackKind): void {
    const track = activeTimelineTrack(kind);
    if (!track || track.keyframes.length === 0) {
      showToast("Add keyframes to the active track before toggling it.", "bad");
      return;
    }

    recordHistory();
    track.enabled = !track.enabled;
    rebuildTimelineRuntime();
    timelinePlayer.setTime(sceneTimeline.currentTime);
    applyCameraTimeline();
    applyLightTimeline();
    applyObjectPropertyTimeline();
    updateAllUI();
    showToast(`${track.label} track ${track.enabled ? "enabled" : "disabled"}`, "good");
  }

  function selectTimelineTrackLabel(targetId: string, _kind: TimelineTrackKind): void {
    if (entries.has(targetId)) {
      setSelected(targetId);
      return;
    }
    updateAllUI();
  }

  function activeTimelineTrack(kind: TimelineTrackKind): TimelineTrackDocument | null {
    if (isCameraTrackKind(kind)) {
      return sceneTimeline.camera.tracks.find((candidate) => candidate.kind === kind) ?? null;
    }
    if (isLightTrackKind(kind)) {
      return sceneTimeline.lights.tracks.find((candidate) => candidate.kind === kind) ?? null;
    }
    const entry = selectedEntry();
    const objectTimeline = entry ? sceneTimeline.objects.find((candidate) => candidate.objectId === entry.id) : null;
    return objectTimeline?.tracks.find((candidate) => candidate.kind === kind) ?? null;
  }

  function stepTimelineKeyframe(direction: -1 | 1): void {
    const times = stepCandidateTimes(timelinePanel.selectedTrackKind());
    if (times.length === 0) {
      showToast("No timeline keyframes to navigate.", "bad");
      return;
    }
    const current = sceneTimeline.currentTime;
    const epsilon = 0.001;
    const target = direction > 0
      ? times.find((time) => time > current + epsilon)
      : [...times].reverse().find((time) => time < current - epsilon);
    if (target === undefined) {
      showToast(direction > 0 ? "No later keyframe." : "No earlier keyframe.", "bad");
      return;
    }
    setTimelineTime(target);
  }

  function stepTimelineFrame(direction: -1 | 1): void {
    const step = 1 / Math.max(sceneTimeline.fps, 1);
    setTimelineTime(sceneTimeline.currentTime + direction * step);
  }

  function beginTimelineDrag(): void {
    if (!pendingTimelineDragSnapshot) pendingTimelineDragSnapshot = snapshot();
  }

  function moveTimelineKeyframe(keyframeId: string, time: number): void {
    if (!pendingTimelineDragSnapshot) pendingTimelineDragSnapshot = snapshot();
    const match = findTimelineKeyframe(keyframeId);
    if (!match) return;
    match.keyframe.time = clamp(roundTime(time), 0, sceneTimeline.duration);
    sortTimelineKeyframes(match.track);
    rebuildTimelineRuntime();
    timelinePlayer.setTime(sceneTimeline.currentTime);
    applyCameraTimeline();
    applyLightTimeline();
    applyObjectPropertyTimeline();
    if (hasTimelineTracks(sceneTimeline)) syncTransformUI();
  }

  function finishTimelineDrag(): void {
    if (pendingTimelineDragSnapshot) {
      history.record(pendingTimelineDragSnapshot);
      pendingTimelineDragSnapshot = null;
      syncHistoryButtons();
    }
    pruneEmptyTimelineTracks(sceneTimeline);
    rebuildTimelineRuntime();
    timelinePlayer.setTime(sceneTimeline.currentTime);
    applyCameraTimeline();
    applyLightTimeline();
    applyObjectPropertyTimeline();
    updateAllUI();
  }

  function rebuildTimelineRuntime(): void {
    sceneTimeline = normalizeTimelineDocument(sceneTimeline, new Set(entries.keys()));
    timelinePlayer.rebuild(sceneTimeline, entries.values());
  }

  function findTimelineKeyframe(keyframeId: string): { keyframe: TimelineKeyframeDocument; track: TimelineTrackDocument } | null {
    for (const track of sceneTimeline.camera.tracks) {
      const keyframe = track.keyframes.find((candidate) => candidate.id === keyframeId);
      if (keyframe) return { keyframe, track };
    }
    for (const track of sceneTimeline.lights.tracks) {
      const keyframe = track.keyframes.find((candidate) => candidate.id === keyframeId);
      if (keyframe) return { keyframe, track };
    }
    for (const objectTimeline of sceneTimeline.objects) {
      for (const track of objectTimeline.tracks) {
        const keyframe = track.keyframes.find((candidate) => candidate.id === keyframeId);
        if (keyframe) return { keyframe, track };
      }
    }
    return null;
  }

  function timelineValueForEntry(entry: SceneEntry, kind: TimelineTrackKind): [number, number, number] {
    if (kind === "position") return [entry.root.position.x, entry.root.position.y, entry.root.position.z];
    if (kind === "scale") return [entry.root.scale.x, entry.root.scale.y, entry.root.scale.z];
    if (kind === "rotation") return [
      THREE.MathUtils.radToDeg(entry.root.rotation.x),
      THREE.MathUtils.radToDeg(entry.root.rotation.y),
      THREE.MathUtils.radToDeg(entry.root.rotation.z)
    ];
    if (kind === "objectColor") return [entry.color.r, entry.color.g, entry.color.b];
    if (kind === "objectOpacity") return [entry.opacity, 0, 0];
    if (kind === "objectRoughness") return [entry.roughness, 0, 0];
    if (kind === "objectMetalness") return [entry.metalness, 0, 0];
    if (kind === "objectTextureRepeat") return [entry.textureRepeat.x, entry.textureRepeat.y, 0];
    if (kind === "objectTextureOffset") return [entry.textureOffset.x, entry.textureOffset.y, 0];
    if (kind === "objectTextureRotation") return [entry.textureRotation, 0, 0];
    if (kind === "objectVisibility") return [entry.root.visible ? 1 : 0, 0, 0];
    return [0, 0, 0];
  }

  function timelineValueForCamera(kind: TimelineTrackKind): [number, number, number] {
    if (kind === "cameraPosition") return [camera.position.x, camera.position.y, camera.position.z];
    if (kind === "cameraTarget") return [controls.target.x, controls.target.y, controls.target.z];
    return [camera.fov, camera.near, camera.far];
  }

  function timelineValueForLight(kind: TimelineTrackKind): [number, number, number] {
    if (kind === "ambientIntensity") return [lightRig.ambient.intensity, 0, 0];
    const light = lightForTrackKind(kind);
    if (!light) return [0, 0, 0];
    if (kind.endsWith("Position")) return [light.position.x, light.position.y, light.position.z];
    if (kind.endsWith("Color")) return [light.color.r, light.color.g, light.color.b];
    return [light.intensity, 0, 0];
  }

  function applyCameraTimeline(): void {
    if (!hasCameraTimelineTracks(sceneTimeline)) return;
    let projectionChanged = false;
    sceneTimeline.camera.tracks.forEach((track) => {
      const value = evaluateTimelineTrack(track, sceneTimeline.currentTime);
      if (!value) return;
      if (track.kind === "cameraPosition") {
        camera.position.fromArray(value);
      } else if (track.kind === "cameraTarget") {
        controls.target.fromArray(value);
      } else if (track.kind === "cameraLens") {
        camera.fov = clamp(value[0], 1, 175);
        camera.near = clamp(value[1], 0.01, Math.max(0.02, value[2] - 0.01));
        camera.far = Math.max(value[2], camera.near + 0.01);
        projectionChanged = true;
      }
    });
    if (projectionChanged) camera.updateProjectionMatrix();
    controls.update();
    frustumHelper.update();
  }

  function applyLightTimeline(): void {
    if (!hasLightTimelineTracks(sceneTimeline)) return;
    sceneTimeline.lights.tracks.forEach((track) => {
      const value = evaluateTimelineTrack(track, sceneTimeline.currentTime);
      if (!value) return;
      const light = lightForTrackKind(track.kind);
      if (track.kind === "ambientIntensity") {
        lightRig.ambient.intensity = Math.max(0, value[0]);
      } else if (light && track.kind.endsWith("Position")) {
        light.position.fromArray(value);
      } else if (light && track.kind.endsWith("Color")) {
        light.color.setRGB(clamp(value[0], 0, 1), clamp(value[1], 0, 1), clamp(value[2], 0, 1));
      } else if (light && track.kind.endsWith("Intensity")) {
        light.intensity = Math.max(0, value[0]);
      }
    });
    syncLightHelpers(lightRig);
  }

  function applyObjectPropertyTimeline(): void {
    sceneTimeline.objects.forEach((objectTimeline) => {
      const entry = entries.get(objectTimeline.objectId);
      if (!entry) return;
      let appearanceChanged = false;
      let textureChanged = false;
      objectTimeline.tracks.forEach((track) => {
        if (!isObjectPropertyTrackKind(track.kind)) return;
        const value = evaluateTimelineTrack(track, sceneTimeline.currentTime);
        if (!value) return;
        if (track.kind === "objectColor") {
          entry.color.setRGB(clamp(value[0], 0, 1), clamp(value[1], 0, 1), clamp(value[2], 0, 1));
          appearanceChanged = true;
        } else if (track.kind === "objectOpacity") {
          entry.opacity = clamp(value[0], 0, 1);
          appearanceChanged = true;
        } else if (track.kind === "objectRoughness") {
          entry.roughness = clamp(value[0], 0, 1);
          appearanceChanged = true;
        } else if (track.kind === "objectMetalness") {
          entry.metalness = clamp(value[0], 0, 1);
          appearanceChanged = true;
        } else if (track.kind === "objectTextureRepeat") {
          entry.textureRepeat.set(Math.max(0.001, value[0]), Math.max(0.001, value[1]));
          textureChanged = true;
        } else if (track.kind === "objectTextureOffset") {
          entry.textureOffset.set(value[0], value[1]);
          textureChanged = true;
        } else if (track.kind === "objectTextureRotation") {
          entry.textureRotation = value[0];
          textureChanged = true;
        } else if (track.kind === "objectVisibility") {
          entry.root.visible = value[0] >= 0.5;
        }
      });
      if (appearanceChanged) applyEntryAppearance(entry);
      if (textureChanged) applyEntryTextureTransform(entry);
    });
  }

  function evaluateTimelineTrack(track: TimelineTrackDocument, time: number): [number, number, number] | null {
    if (!track.enabled) return null;
    const keyframes = [...track.keyframes].sort((left, right) => left.time - right.time);
    if (keyframes.length === 0) return null;
    if (time <= keyframes[0].time) return [...keyframes[0].value] as [number, number, number];
    const last = keyframes[keyframes.length - 1];
    if (time >= last.time) return [...last.value] as [number, number, number];
    const rightIndex = keyframes.findIndex((keyframe) => keyframe.time >= time);
    const left = keyframes[rightIndex - 1];
    const right = keyframes[rightIndex];
    if (!left || !right) return [...last.value] as [number, number, number];
    if (left.interpolation === "hold") return [...left.value] as [number, number, number];
    const span = Math.max(right.time - left.time, 0.001);
    const rawT = clamp((time - left.time) / span, 0, 1);
    const t = left.interpolation === "smooth" ? rawT * rawT * (3 - 2 * rawT) : rawT;
    return [
      left.value[0] + (right.value[0] - left.value[0]) * t,
      left.value[1] + (right.value[1] - left.value[1]) * t,
      left.value[2] + (right.value[2] - left.value[2]) * t
    ];
  }

  function resolveTimelineKeyframeSources(keyframeIds: string[]): TimelineKeyframeSource[] {
    const sources: TimelineKeyframeSource[] = [];
    const ids = new Set(keyframeIds);
    if (ids.size > 0) {
      sceneTimeline.camera.tracks.forEach((track) => {
        track.keyframes.forEach((keyframe) => {
          if (ids.has(keyframe.id)) sources.push({ scope: "camera", objectId: "camera", track, keyframe });
        });
      });
      sceneTimeline.lights.tracks.forEach((track) => {
        track.keyframes.forEach((keyframe) => {
          if (ids.has(keyframe.id)) sources.push({ scope: "lights", objectId: "lights", track, keyframe });
        });
      });
      sceneTimeline.objects.forEach((objectTimeline) => {
        objectTimeline.tracks.forEach((track) => {
          track.keyframes.forEach((keyframe) => {
            if (ids.has(keyframe.id)) sources.push({ scope: "object", objectId: objectTimeline.objectId, track, keyframe });
          });
        });
      });
      return sources;
    }

    const selectedTrack = timelinePanel.selectedTrackKind();
    if (isCameraTrackKind(selectedTrack)) {
      const track = sceneTimeline.camera.tracks.find((candidate) => candidate.kind === selectedTrack);
      const keyframe = track?.keyframes.find((candidate) => Math.abs(candidate.time - sceneTimeline.currentTime) < 0.001);
      if (track && keyframe) sources.push({ scope: "camera", objectId: "camera", track, keyframe });
      return sources;
    }
    if (isLightTrackKind(selectedTrack)) {
      const track = sceneTimeline.lights.tracks.find((candidate) => candidate.kind === selectedTrack);
      const keyframe = track?.keyframes.find((candidate) => Math.abs(candidate.time - sceneTimeline.currentTime) < 0.001);
      if (track && keyframe) sources.push({ scope: "lights", objectId: "lights", track, keyframe });
      return sources;
    }

    const entry = selectedEntry();
    const objectTimeline = entry ? sceneTimeline.objects.find((candidate) => candidate.objectId === entry.id) : null;
    const track = objectTimeline?.tracks.find((candidate) => candidate.kind === selectedTrack);
    const keyframe = track?.keyframes.find((candidate) => Math.abs(candidate.time - sceneTimeline.currentTime) < 0.001);
    if (entry && track && keyframe) sources.push({ scope: "object", objectId: entry.id, track, keyframe });
    return sources;
  }

  function pasteTargetTrack(clip: TimelineClipboardKeyframe, selectedObject: SceneEntry | null): TimelineTrackDocument | null {
    if (clip.scope === "camera") {
      return ensureTimelineTrack(ensureCameraTimeline(sceneTimeline), clip.kind);
    }
    if (clip.scope === "lights") {
      return ensureTimelineTrack(ensureLightTimeline(sceneTimeline), clip.kind);
    }
    if (!selectedObject) return null;
    return ensureTimelineTrack(ensureObjectTimeline(sceneTimeline, selectedObject.id), clip.kind);
  }

  function nextAvailableKeyframeTime(track: TimelineTrackDocument, startTime: number, offset: number): number | null {
    let candidate = snapTimelineTime(sceneTimeline, startTime);
    while (candidate <= sceneTimeline.duration) {
      const occupied = track.keyframes.some((keyframe) => Math.abs(keyframe.time - candidate) < 0.001);
      if (!occupied) return candidate;
      candidate = snapTimelineTime(sceneTimeline, candidate + offset);
      if (sceneTimeline.duration - candidate < 0.001) break;
    }
    return null;
  }

  function stepCandidateTimes(kind: TimelineTrackKind): number[] {
    if (isCameraTrackKind(kind)) {
      return [...new Set(sceneTimeline.camera.tracks
        .filter((track) => track.kind === kind)
        .flatMap((track) => track.keyframes.map((keyframe) => roundTime(keyframe.time))))]
        .sort((left, right) => left - right);
    }
    if (isLightTrackKind(kind)) {
      return [...new Set(sceneTimeline.lights.tracks
        .filter((track) => track.kind === kind)
        .flatMap((track) => track.keyframes.map((keyframe) => roundTime(keyframe.time))))]
        .sort((left, right) => left - right);
    }
    const selectedObjectTimeline = sceneTimeline.objects.find((objectTimeline) => objectTimeline.objectId === selectedId);
    const selectedTrack = selectedObjectTimeline?.tracks.find((track) => track.kind === kind && track.keyframes.length > 0);
    const times = selectedTrack
      ? selectedTrack.keyframes.map((keyframe) => keyframe.time)
      : sceneTimeline.objects.flatMap((objectTimeline) => objectTimeline.tracks.flatMap((track) => track.keyframes.map((keyframe) => keyframe.time)));
    return [...new Set(times.map(roundTime))].sort((left, right) => left - right);
  }

  function trackKindForTransformMode(): TimelineTrackKind {
    const mode = transformControls.getMode();
    if (mode === "rotate") return "rotation";
    if (mode === "scale") return "scale";
    return "position";
  }

  function cameraTrackForGroup(group: "position" | "target" | "camera"): TimelineTrackKind {
    if (group === "position") return "cameraPosition";
    if (group === "target") return "cameraTarget";
    return "cameraLens";
  }

  function lightPositionTrackForKind(kind: LightKind): TimelineTrackKind {
    if (kind === "directional") return "directionalPosition";
    if (kind === "point") return "pointPosition";
    return "spotPosition";
  }

  function lightColorTrackForKind(kind: LightKind): TimelineTrackKind {
    if (kind === "directional") return "directionalColor";
    if (kind === "point") return "pointColor";
    return "spotColor";
  }

  function lightIntensityTrackForKind(kind: LightKind): TimelineTrackKind {
    if (kind === "directional") return "directionalIntensity";
    if (kind === "point") return "pointIntensity";
    return "spotIntensity";
  }

  function isCameraTrackKind(kind: TimelineTrackKind): kind is "cameraPosition" | "cameraTarget" | "cameraLens" {
    return kind === "cameraPosition" || kind === "cameraTarget" || kind === "cameraLens";
  }

  function isObjectTransformTrackKind(kind: TimelineTrackKind): kind is "position" | "rotation" | "scale" {
    return kind === "position" || kind === "rotation" || kind === "scale";
  }

  function isObjectPropertyTrackKind(kind: TimelineTrackKind): kind is
    | "objectColor"
    | "objectOpacity"
    | "objectRoughness"
    | "objectMetalness"
    | "objectTextureRepeat"
    | "objectTextureOffset"
    | "objectTextureRotation"
    | "objectVisibility" {
    return kind === "objectColor" ||
      kind === "objectOpacity" ||
      kind === "objectRoughness" ||
      kind === "objectMetalness" ||
      kind === "objectTextureRepeat" ||
      kind === "objectTextureOffset" ||
      kind === "objectTextureRotation" ||
      kind === "objectVisibility";
  }

  function isLightTrackKind(kind: TimelineTrackKind): kind is
    | "directionalPosition"
    | "directionalColor"
    | "directionalIntensity"
    | "pointPosition"
    | "pointColor"
    | "pointIntensity"
    | "spotPosition"
    | "spotColor"
    | "spotIntensity"
    | "ambientIntensity" {
    return kind === "directionalPosition" ||
      kind === "directionalColor" ||
      kind === "directionalIntensity" ||
      kind === "pointPosition" ||
      kind === "pointColor" ||
      kind === "pointIntensity" ||
      kind === "spotPosition" ||
      kind === "spotColor" ||
      kind === "spotIntensity" ||
      kind === "ambientIntensity";
  }

  function lightForTrackKind(kind: TimelineTrackKind): THREE.DirectionalLight | THREE.PointLight | THREE.SpotLight | null {
    if (kind.startsWith("directional")) return lightRig.directional;
    if (kind.startsWith("point")) return lightRig.point;
    if (kind.startsWith("spot")) return lightRig.spot;
    return null;
  }

  function cameraTrackLabel(kind: TimelineTrackKind): string {
    if (kind === "cameraPosition") return "Camera position";
    if (kind === "cameraTarget") return "Camera target";
    if (kind === "cameraLens") return "Camera lens";
    return capitalize(kind);
  }

  function objectTrackLabel(kind: TimelineTrackKind): string {
    if (kind === "position") return "Position";
    if (kind === "rotation") return "Rotation";
    if (kind === "scale") return "Scale";
    if (kind === "objectColor") return "Object color";
    if (kind === "objectOpacity") return "Object opacity";
    if (kind === "objectRoughness") return "Object roughness";
    if (kind === "objectMetalness") return "Object metalness";
    if (kind === "objectTextureRepeat") return "Texture repeat";
    if (kind === "objectTextureOffset") return "Texture offset";
    if (kind === "objectTextureRotation") return "Texture rotation";
    if (kind === "objectVisibility") return "Object visibility";
    return capitalize(kind);
  }

  function lightTrackLabel(kind: TimelineTrackKind): string {
    if (kind === "directionalPosition") return "Sun position";
    if (kind === "directionalColor") return "Sun color";
    if (kind === "directionalIntensity") return "Sun intensity";
    if (kind === "pointPosition") return "Point light position";
    if (kind === "pointColor") return "Point light color";
    if (kind === "pointIntensity") return "Point light intensity";
    if (kind === "spotPosition") return "Spot light position";
    if (kind === "spotColor") return "Spot light color";
    if (kind === "spotIntensity") return "Spot light intensity";
    if (kind === "ambientIntensity") return "Ambient intensity";
    return capitalize(kind);
  }

  function exportScreenshot(): void {
    composer.render();
    const link = document.createElement("a");
    link.download = "geometry-studio.png";
    link.href = renderer.domElement.toDataURL("image/png");
    link.click();
    showToast("Screenshot exported", "good");
  }

  function togglePreviewRecording(): void {
    if (recordingPreview) {
      stopPreviewRecording(true);
      return;
    }
    if (!("MediaRecorder" in window) || !("captureStream" in canvas)) {
      showToast("WebM recording is not supported in this browser.", "bad");
      return;
    }
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
        ? "video/webm;codecs=vp8"
        : "video/webm";
    previewChunks = [];
    const stream = canvas.captureStream(Math.min(Math.max(sceneTimeline.fps, 1), 60));
    previewRecorder = new MediaRecorder(stream, { mimeType });
    previewRecorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) previewChunks.push(event.data);
    });
    previewRecorder.addEventListener("stop", () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(previewChunks, { type: mimeType });
      previewChunks = [];
      if (blob.size === 0) {
        showToast("Recording produced no video data.", "bad");
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "geometry-studio-preview.webm";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 500);
      showToast("WebM preview exported", "good");
    });
    recordingPreview = true;
    updateRecordingButton();
    setTimelineTime(sceneTimeline.workStart);
    playing = true;
    updatePlayButton();
    timelinePanel.update(sceneTimeline, entries.values(), selectedId, playing);
    previewRecorder.start(250);
    showToast("Recording work area to WebM", "good");
  }

  function stopPreviewRecording(manual: boolean): void {
    if (!recordingPreview && !previewRecorder) return;
    recordingPreview = false;
    if (manual) {
      playing = false;
      updatePlayButton();
      timelinePanel.update(sceneTimeline, entries.values(), selectedId, playing);
    }
    updateRecordingButton();
    if (previewRecorder && previewRecorder.state !== "inactive") previewRecorder.stop();
    previewRecorder = null;
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

    if (playing) {
      advanceTimeline(delta);
      entries.forEach((entry) => {
        if (!hasObjectTransformTimelineTracks(sceneTimeline, entry.id)) updateEntryAnimation(entry, delta, elapsed);
      });
    }
    if (lightRig.sweep && !hasLightTimelineTracks(sceneTimeline)) updateLightSweep(lightRig, elapsed);

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
    while (stack.children.length >= 3) {
      stack.firstElementChild?.remove();
    }
    const toast = document.createElement("div");
    toast.className = `toast ${tone}`;
    toast.textContent = message;
    stack.appendChild(toast);
    window.setTimeout(() => {
      toast.classList.add("leaving");
      window.setTimeout(() => toast.remove(), 250);
    }, 3600);
  }

  function clearEvaluationTourMessages(): void {
    evaluationTourTimers.forEach((timer) => window.clearTimeout(timer));
    evaluationTourTimers = [];
    query<HTMLDivElement>("#toast-stack").replaceChildren();
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

  function updateRecordingButton(): void {
    const button = query<HTMLButtonElement>("#record-video-btn");
    button.classList.toggle("strong", recordingPreview);
    button.innerHTML = `<span data-icon="${recordingPreview ? "Square" : "Video"}"></span><span>${recordingPreview ? "Stop WebM" : "Record WebM"}</span>`;
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
      opacity: entry.opacity,
      roughness: entry.roughness,
      metalness: entry.metalness,
      visible: entry.root.visible,
      textureName: entry.textureName === "uploaded" ? "none" : entry.textureName,
      textureRepeat: [entry.textureRepeat.x, entry.textureRepeat.y],
      textureOffset: [entry.textureOffset.x, entry.textureOffset.y],
      textureRotation: entry.textureRotation,
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
