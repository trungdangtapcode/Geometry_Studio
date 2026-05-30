import "./styles.css";

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { updateEntryAnimation } from "./animation/timeline";
import {
  cascadeResolvedKeyframesByTargetFromTime,
  centerResolvedKeyframesOnTime,
  createTimelineClipboard,
  distributeResolvedKeyframesAcrossRange,
  duplicateResolvedKeyframes,
  editResolvedKeyframes,
  fitResolvedKeyframesToRange,
  moveResolvedKeyframesToTime,
  nudgeResolvedKeyframes,
  pasteTimelineClipboard,
  resolveTimelineKeyframeSources,
  reverseResolvedKeyframes,
  roveResolvedKeyframesAcrossTime,
  selectedResolvedKeyframeRange,
  snapResolvedKeyframesToFrames,
  staggerResolvedKeyframesFromTime,
  type EditTimelineResult,
  type TimelineClipboard,
  type TimelineKeyframeEditPatch,
  type TimelineKeyframeSource
} from "./animation/timelineEditing";
import { evaluateTimelineTrack } from "./animation/interpolation";
import { objectLayerRange, setObjectVisibilityRange, shiftObjectLayerKeyframes, type TimelineLayerRange } from "./animation/timelineLayers";
import { TimelinePlayer } from "./animation/timelinePlayer";
import { TimelineTransport, type PlaybackDirection } from "./animation/timelineTransport";
import {
  copyTimelineObject,
  createDefaultTimeline,
  createTimelineKeyframe,
  createTimelineMarker,
  ensureCameraTimeline,
  ensureLightTimeline,
  ensureObjectTimeline,
  ensureTimelineTrack,
  hasCameraTimelineTracks,
  hasLightTimelineTracks,
  hasObjectTransformTimelineTracks,
  hasObjectTimelineTracks,
  hasSoloTimelineTracks,
  hasTimelineTracks,
  isTimelineTrackRuntimeActive,
  normalizeTimelineDocument,
  pruneEmptyTimelineTracks,
  removeTimelineObject,
  roundTime,
  snapTimelineTime,
  sortTimelineKeyframes,
  sortTimelineMarkers
} from "./animation/timelineSchema";
import {
  cameraTrackForGroup,
  cameraTrackLabel,
  isCameraTrackKind,
  isLightTrackKind,
  isObjectPropertyTrackKind,
  isObjectTransformTrackKind,
  lightColorTrackForKind,
  lightIntensityTrackForKind,
  lightPositionTrackForKind,
  lightTrackLabel,
  objectTrackLabel,
  primaryTrackForAnimationMode,
  timelineValueForEntry
} from "./animation/timelineTracks";
import { CommandHistory } from "./editor/commands";
import { createSceneDocument, validateSceneDocument } from "./editor/documents";
import type {
  AnimationMode,
  LightKind,
  MaterialMode,
  ObjectKind,
  PostProcessingSettings,
  PrimitiveType,
  EnvironmentPresetId,
  RenderSettings,
  RenderToneMappingMode,
  RenderMode,
  SceneDocument,
  SceneEntry,
  SerializedObject,
  ShadowQuality,
  TimelineInterpolation,
  TimelineKeyframeDocument,
  TimelineTrackDocument,
  TimelineTrackKind,
  ToastTone
} from "./editor/types";
import { createEnvironmentController, environmentPreset } from "./renderer/environment";
import { createRenderPipeline } from "./renderer/pipeline";
import { applyPostProcessingSettings, normalizePostProcessingSettings, postProcessingLabel } from "./renderer/postProcessing";
import { applyRenderSettings, createDefaultRenderSettings, normalizeRenderSettings, shadowQualityLabel, toneMappingLabel } from "./renderer/renderSettings";
import { loadModelFromFiles } from "./scene/importers";
import { createLights, createStage, currentLight, setActiveLight, syncLightHelpers, syncLights, updateLightSweep } from "./scene/lights";
import { applyLightingPreset, lightingPresetById, lightRigMatchesPreset } from "./scene/lightingPresets";
import { applyMaterialPresetValues, entryMatchesMaterialPreset, materialPresetById } from "./scene/materialPresets";
import { buildGeometryVisual, buildModelVisual, makeTexturePreset, syncTextureTransform } from "./scene/materials";
import { clearMotionPath, createMotionPathRig, updateMotionPath } from "./scene/motionPath";
import { createPrimitiveGeometry, createSampleModel, labelForPrimitive, normalizedGeometry } from "./scene/primitives";
import { KeyframeTimelinePanel, type TimelineVisibleRowTarget } from "./ui/timelinePanel";
import { bindUiDensityControl } from "./ui/density";
import { studioTemplate } from "./ui/template";
import { renderTransformInspector, type TransformAxis, type TransformProperty } from "./ui/transformInspector";
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
  bindUiDensityControl(root);
  hydrateIcons();

  const canvas = query<HTMLCanvasElement>("#scene-canvas");
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#e9edf0");
  scene.fog = new THREE.Fog("#e9edf0", 28, 90);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500);
  camera.position.set(7.5, 5.5, 9);

  const renderPipeline = createRenderPipeline(canvas, scene, camera);
  const { renderer, composer, outlinePass, resize: resizePipeline } = renderPipeline;
  const environmentController = createEnvironmentController(renderer, scene);
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
  const transport = new TimelineTransport();
  const entries = new Map<string, SceneEntry>();
  let sceneTimeline = createDefaultTimeline();
  let renderSettings = createDefaultRenderSettings();
  let selectedId = "";
  let idCounter = 1;
  let transformSpace: "world" | "local" = "world";
  let lastFpsTime = performance.now();
  let frameCount = 0;
  let statsVisible = true;
  let motionPathVisible = true;
  let recordingPreview = false;
  let previewRecorder: MediaRecorder | null = null;
  let previewChunks: Blob[] = [];
  let previewRecordingRange: { start: number; end: number } | null = null;
  let timelineClipboard: TimelineClipboard | null = null;
  let pendingDragSnapshot: SceneDocument | null = null;
  let pendingTransformAutoKeySeedValues: Record<TransformProperty, [number, number, number]> | null = null;
  let pendingTimelineDragSnapshot: SceneDocument | null = null;
  let evaluationTourTimers: number[] = [];

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const clock = new THREE.Clock();
  const stage = createStage();
  const lightRig = createLights(scene);
  applyRenderSettings(renderer, lightRig, renderSettings);
  environmentController.apply(renderSettings);
  applyPostProcessingSettings(renderPipeline, renderSettings.postProcessing);
  const motionPathRig = createMotionPathRig();
  const frustumHelper = new THREE.CameraHelper(camera);
  frustumHelper.visible = false;
  scene.add(stage.ground, stage.grid, stage.axes, motionPathRig.group, frustumHelper);

  const timelinePanel = new KeyframeTimelinePanel({
    onTimeChanged: setTimelineTime,
    onAddKeyframe: addTimelineKeyframe,
    onSetTransformKeyframes: setTransformTimelineKeyframes,
    onSetVisibleKeyframes: setVisibleTimelineKeyframes,
    onTrimLayerIn: trimSelectedLayerInPoint,
    onTrimLayerOut: trimSelectedLayerOutPoint,
    onSplitLayer: splitSelectedLayerAtPlayhead,
    onSetWorkAreaToLayer: setTimelineWorkAreaToSelectedLayer,
    onEditLayerRange: editTimelineLayerRange,
    onDeleteKeyframes: deleteTimelineKeyframes,
    onCopyKeyframes: copyTimelineKeyframes,
    onCopyVisibleTimeKeyframes: copyVisibleTimelineTimeKeyframes,
    onCutVisibleTimeKeyframes: cutVisibleTimelineTimeKeyframes,
    onPasteKeyframes: pasteTimelineKeyframes,
    onSelectWorkAreaKeyframes: selectTimelineWorkAreaKeyframes,
    onSelectVisibleKeyframes: selectVisibleTimelineKeyframes,
    onSelectVisibleTimeKeyframes: selectVisibleTimelineTimeKeyframes,
    onPreviewSelectedRange: previewSelectedTimelineKeyRange,
    onDuplicateKeyframes: duplicateTimelineKeyframes,
    onDuplicateVisibleTimeKeyframes: duplicateVisibleTimelineTimeKeyframes,
    onDeleteVisibleTimeKeyframes: deleteVisibleTimelineTimeKeyframes,
    onNudgeKeyframes: nudgeTimelineKeyframes,
    onMoveKeyframesToPlayhead: moveTimelineKeyframesToPlayhead,
    onCenterKeyframesOnPlayhead: centerTimelineKeyframesOnPlayhead,
    onRoveKeyframesAcrossTime: roveTimelineKeyframesAcrossTime,
    onReverseKeyframes: reverseTimelineKeyframes,
    onSnapKeyframesToFrames: snapTimelineKeyframesToFrames,
    onDistributeKeyframes: distributeTimelineKeyframes,
    onFitKeyframesToWorkArea: fitTimelineKeyframesToWorkArea,
    onStaggerKeyframesFromPlayhead: staggerTimelineKeyframesFromPlayhead,
    onCascadeKeyframesFromPlayhead: cascadeTimelineKeyframesFromPlayhead,
    onEditKeyframes: editTimelineKeyframes,
    onAddMarker: addTimelineMarker,
    onDeleteMarker: deleteTimelineMarker,
    onRenameMarker: renameTimelineMarker,
    onSetMarkerColor: setTimelineMarkerColor,
    onStepMarker: stepTimelineMarker,
    onClearTrack: clearTimelineTrack,
    onToggleTrack: toggleTimelineTrack,
    onToggleTrackLock: toggleTimelineTrackLock,
    onToggleTrackSolo: toggleTimelineTrackSolo,
    onTrackKindChanged: updateAllUI,
    onTrackLabelSelected: selectTimelineTrackLabel,
    onStepKeyframe: stepTimelineKeyframe,
    onStepVisibleKeyframe: stepVisibleTimelineKeyframe,
    onStepSelectedKeyBoundary: stepSelectedTimelineKeyBoundary,
    onStepFrame: stepTimelineFrame,
    onSetInterpolation: setTimelineInterpolation,
    onDragStarted: beginTimelineDrag,
    onKeyframeMoved: moveTimelineKeyframe,
    onKeyframeValueChanged: moveTimelineKeyframeValue,
    onDragFinished: finishTimelineDrag,
    onSettingsChanged: updateTimelineSettings,
    onTogglePlayback: togglePlay
  });
  window.addEventListener("studio-density-change", () => {
    timelinePanel.update(sceneTimeline, entries.values(), selectedId, transport.playing);
    updatePlayButton();
  });

  seedDefaultScene();
  setSelected(firstEntryId());
  bindEvents();
  updateAllUI();
  showToast("Studio upgraded: JSON save/load, Undo/Redo, telemetry, drag-drop import, tours, and screenshots are ready.", "good");
  animate();

  function seedDefaultScene(): void {
    addPrimitive("cube", new THREE.Vector3(0, 0.02, 0), { color: "#4bd0a0" }, false);
    const torus = addPrimitive("torus", new THREE.Vector3(-3.2, 0.02, -1.6), { color: "#f7bd4b", renderMode: "lines" }, false);
    const sphere = addPrimitive("sphere", new THREE.Vector3(3.2, 0.02, -1.2), { color: "#df6b80", textureName: "checker" }, false);
    bakeObjectAnimationPreset(torus, "spin");
    bakeObjectAnimationPreset(sphere, "pulse");
    rebuildTimelineRuntime();
    timelinePlayer.setTime(sceneTimeline.currentTime);
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
      animation: "none",
      textureName: "none"
    });
    entry.root.position.copy(position);
    entry.basePosition.copy(position);
    rebuildEntryVisual(entry);
    scene.add(entry.root);
    entries.set(entry.id, entry);
    bakeObjectAnimationPreset(entry, "spin");
    rebuildTimelineRuntime();
    timelinePlayer.setTime(sceneTimeline.currentTime);
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
    useSourceMaterials?: boolean;
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
      useSourceMaterials: config.useSourceMaterials ?? false,
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
      if (event.value) {
        pendingDragSnapshot = snapshot();
        const entry = selectedEntry();
        pendingTransformAutoKeySeedValues = entry ? captureTransformValues(entry) : null;
      }
      if (!event.value && pendingDragSnapshot) {
        history.record(pendingDragSnapshot);
        pendingDragSnapshot = null;
        pendingTransformAutoKeySeedValues = null;
        syncHistoryButtons();
        if (sceneTimeline.autoKey) updateAllUI();
      }
      syncSelectedBases();
    });
    transformControls.addEventListener("objectChange", () => {
      if (sceneTimeline.autoKey) {
        const kind = trackKindForTransformMode();
        const entry = selectedEntry();
        if (entry) seedInitialTransformAutoKey(entry, kind, pendingTransformAutoKeySeedValues?.[kind]);
        setTimelineKeyframe(kind, { notify: false, record: false, refresh: false });
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
        entry.useSourceMaterials = false;
        rebuildEntryVisual(entry);
      });
    });

    query<HTMLInputElement>("#object-color").addEventListener("change", (event) => {
      updateSelectedEntry((entry) => {
        const previousValue = timelineValueForEntry(entry, "objectColor");
        entry.color.set((event.target as HTMLInputElement).value);
        applyEntryAppearance(entry);
        if (sceneTimeline.autoKey) {
          seedInitialObjectAutoKey(entry, "objectColor", previousValue);
          setTimelineKeyframe("objectColor", { notify: false, record: false, refresh: false });
        }
      });
    });

    query<HTMLInputElement>("#object-opacity").addEventListener("change", (event) => {
      updateSelectedEntry((entry) => {
        const previousValue = timelineValueForEntry(entry, "objectOpacity");
        entry.opacity = clamp(Number((event.target as HTMLInputElement).value), 0, 1);
        applyEntryAppearance(entry);
        if (sceneTimeline.autoKey) {
          seedInitialObjectAutoKey(entry, "objectOpacity", previousValue);
          setTimelineKeyframe("objectOpacity", { notify: false, record: false, refresh: false });
        }
      });
    });

    query<HTMLInputElement>("#object-roughness").addEventListener("change", (event) => {
      updateSelectedEntry((entry) => {
        const previousValue = timelineValueForEntry(entry, "objectRoughness");
        entry.roughness = clamp(Number((event.target as HTMLInputElement).value), 0, 1);
        applyEntryAppearance(entry);
        if (sceneTimeline.autoKey) {
          seedInitialObjectAutoKey(entry, "objectRoughness", previousValue);
          setTimelineKeyframe("objectRoughness", { notify: false, record: false, refresh: false });
        }
      });
    });

    query<HTMLInputElement>("#object-metalness").addEventListener("change", (event) => {
      updateSelectedEntry((entry) => {
        const previousValue = timelineValueForEntry(entry, "objectMetalness");
        entry.metalness = clamp(Number((event.target as HTMLInputElement).value), 0, 1);
        applyEntryAppearance(entry);
        if (sceneTimeline.autoKey) {
          seedInitialObjectAutoKey(entry, "objectMetalness", previousValue);
          setTimelineKeyframe("objectMetalness", { notify: false, record: false, refresh: false });
        }
      });
    });

    query<HTMLInputElement>("#object-visible").addEventListener("change", (event) => {
      updateSelectedEntry((entry) => {
        const previousValue = timelineValueForEntry(entry, "objectVisibility");
        entry.root.visible = (event.target as HTMLInputElement).checked;
        if (sceneTimeline.autoKey) {
          seedInitialObjectAutoKey(entry, "objectVisibility", previousValue);
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
        const entry = selectedEntry();
        if (!entry) return;
        const mode = button.dataset.animation as AnimationMode;
        recordHistory();
        if (mode === "none") {
          entry.animation = "none";
          showToast("Procedural animation disabled", "good");
        } else {
          bakeObjectAnimationPreset(entry, mode, true);
          query<HTMLSelectElement>("#timeline-track-kind").value = primaryTrackForAnimationMode(mode);
          sceneTimeline.currentTime = sceneTimeline.workStart;
          rebuildTimelineRuntime();
          timelinePlayer.setTime(sceneTimeline.currentTime);
          applyObjectPropertyTimeline();
          showToast(`${capitalize(mode)} baked as visible timeline keyframes`, "good");
        }
        updateAllUI();
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
          const previousValue = timelineValueForEntry(entry, "objectTextureRepeat");
          entry.textureRepeat[axis] = Number(input.value);
          applyEntryTextureTransform(entry);
          if (sceneTimeline.autoKey) {
            seedInitialObjectAutoKey(entry, "objectTextureRepeat", previousValue);
            setTimelineKeyframe("objectTextureRepeat", { notify: false, record: false, refresh: false });
          }
        });
      });
    });

    document.querySelectorAll<HTMLInputElement>(".texture-offset").forEach((input) => {
      input.addEventListener("change", () => {
        updateSelectedEntry((entry) => {
          const axis = input.dataset.axis as "x" | "y";
          const previousValue = timelineValueForEntry(entry, "objectTextureOffset");
          entry.textureOffset[axis] = Number(input.value);
          applyEntryTextureTransform(entry);
          if (sceneTimeline.autoKey) {
            seedInitialObjectAutoKey(entry, "objectTextureOffset", previousValue);
            setTimelineKeyframe("objectTextureOffset", { notify: false, record: false, refresh: false });
          }
        });
      });
    });

    query<HTMLInputElement>("#texture-rotation").addEventListener("change", (event) => {
      updateSelectedEntry((entry) => {
        const previousValue = timelineValueForEntry(entry, "objectTextureRotation");
        entry.textureRotation = THREE.MathUtils.degToRad(Number((event.target as HTMLInputElement).value));
        applyEntryTextureTransform(entry);
        if (sceneTimeline.autoKey) {
          seedInitialObjectAutoKey(entry, "objectTextureRotation", previousValue);
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
    document.querySelectorAll<HTMLButtonElement>("[data-lighting-preset]").forEach((button) => {
      button.addEventListener("click", () => {
        const preset = button.dataset.lightingPreset ? lightingPresetById(button.dataset.lightingPreset) : null;
        if (!preset) return;
        recordHistory();
        applyLightingPreset(lightRig, preset);
        syncLights(lightRig, entries.values());
        updateAllUI();
        showToast(`${preset.label} lighting applied`, "good");
      });
    });

    query<HTMLInputElement>("#light-intensity").addEventListener("change", (event) => {
      recordHistory();
      const trackKind = lightIntensityTrackForKind(lightRig.active);
      const previousValue = timelineValueForLight(trackKind);
      currentLight(lightRig).intensity = Number((event.target as HTMLInputElement).value);
      if (sceneTimeline.autoKey) {
        seedInitialLightAutoKey(trackKind, previousValue);
        setTimelineKeyframe(trackKind, { notify: false, record: false, refresh: false });
      }
      updateAllUI();
    });
    query<HTMLInputElement>("#light-color").addEventListener("change", (event) => {
      recordHistory();
      const trackKind = lightColorTrackForKind(lightRig.active);
      const previousValue = timelineValueForLight(trackKind);
      currentLight(lightRig).color.set((event.target as HTMLInputElement).value);
      if (sceneTimeline.autoKey) {
        seedInitialLightAutoKey(trackKind, previousValue);
        setTimelineKeyframe(trackKind, { notify: false, record: false, refresh: false });
      }
      updateAllUI();
    });
    query<HTMLInputElement>("#ambient-intensity").addEventListener("change", (event) => {
      recordHistory();
      const previousValue = timelineValueForLight("ambientIntensity");
      lightRig.ambient.intensity = Number((event.target as HTMLInputElement).value);
      if (sceneTimeline.autoKey) {
        seedInitialLightAutoKey("ambientIntensity", previousValue);
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
    query<HTMLSelectElement>("#tone-mapping").addEventListener("change", (event) => {
      updateRenderSettings({ toneMapping: (event.target as HTMLSelectElement).value as RenderToneMappingMode });
    });
    query<HTMLInputElement>("#render-exposure").addEventListener("change", (event) => {
      updateRenderSettings({ exposure: Number((event.target as HTMLInputElement).value) });
    });
    query<HTMLSelectElement>("#shadow-quality").addEventListener("change", (event) => {
      updateRenderSettings({ shadowQuality: (event.target as HTMLSelectElement).value as ShadowQuality });
    });
    query<HTMLSelectElement>("#environment-preset").addEventListener("change", (event) => {
      updateRenderSettings({ environment: (event.target as HTMLSelectElement).value as EnvironmentPresetId });
    });
    query<HTMLInputElement>("#post-fxaa-toggle").addEventListener("change", (event) => {
      updatePostProcessingSettings({ fxaa: (event.target as HTMLInputElement).checked });
    });
    query<HTMLInputElement>("#post-bloom-toggle").addEventListener("change", (event) => {
      updatePostProcessingSettings({ bloom: (event.target as HTMLInputElement).checked });
    });
    query<HTMLInputElement>("#post-bloom-strength").addEventListener("change", (event) => {
      updatePostProcessingSettings({ bloomStrength: Number((event.target as HTMLInputElement).value) });
    });
    query<HTMLInputElement>("#post-bloom-threshold").addEventListener("change", (event) => {
      updatePostProcessingSettings({ bloomThreshold: Number((event.target as HTMLInputElement).value) });
    });
    query<HTMLInputElement>("#post-bloom-radius").addEventListener("change", (event) => {
      updatePostProcessingSettings({ bloomRadius: Number((event.target as HTMLInputElement).value) });
    });
    query<HTMLInputElement>("#post-ssao-toggle").addEventListener("change", (event) => {
      updatePostProcessingSettings({ ssao: (event.target as HTMLInputElement).checked });
    });
    query<HTMLInputElement>("#post-ssao-radius").addEventListener("change", (event) => {
      updatePostProcessingSettings({ ssaoRadius: Number((event.target as HTMLInputElement).value) });
    });
    query<HTMLInputElement>("#post-ssao-min").addEventListener("change", (event) => {
      updatePostProcessingSettings({ ssaoMinDistance: Number((event.target as HTMLInputElement).value) });
    });
    query<HTMLInputElement>("#post-ssao-max").addEventListener("change", (event) => {
      updatePostProcessingSettings({ ssaoMaxDistance: Number((event.target as HTMLInputElement).value) });
    });
    query<HTMLInputElement>("#post-vignette-toggle").addEventListener("change", (event) => {
      updatePostProcessingSettings({ vignette: (event.target as HTMLInputElement).checked });
    });
    query<HTMLInputElement>("#post-vignette-darkness").addEventListener("change", (event) => {
      updatePostProcessingSettings({ vignetteDarkness: Number((event.target as HTMLInputElement).value) });
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
    query<HTMLInputElement>("#motion-path-toggle").addEventListener("change", (event) => {
      recordHistory();
      motionPathVisible = (event.target as HTMLInputElement).checked;
      syncMotionPath();
      syncSegmentedButtons();
    });

    canvas.addEventListener("pointerdown", handleCanvasPick);
    window.addEventListener("keydown", handleKeyboard);
    window.addEventListener("resize", resize);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);
    window.addEventListener("beforeunload", () => {
      environmentController.dispose();
      resourceTracker.disposeAll();
    });
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
    syncRenderUI();
    syncHistoryButtons();
    timelinePanel.update(sceneTimeline, entries.values(), selectedId, transport.playing);
    updatePlayButton();
    syncMotionPath();
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
    const grid = query<HTMLDivElement>("#transform-grid");
    renderTransformInspector(grid, selectedEntry(), {
      keyState: transformKeyState,
      onSetKey: (kind) => {
        query<HTMLSelectElement>("#timeline-track-kind").value = kind;
        setTimelineKeyframe(kind);
      },
      onValueChanged: updateTransformValue
    });
  }

  function transformKeyState(kind: TransformProperty): { locked: boolean; hasPlayheadKey: boolean } {
    const track = activeTimelineTrack(kind);
    return {
      locked: Boolean(track?.locked),
      hasPlayheadKey: Boolean(track?.keyframes.some((keyframe) => Math.abs(keyframe.time - sceneTimeline.currentTime) < 0.001))
    };
  }

  function updateTransformValue(prop: TransformProperty, axis: TransformAxis, value: number): void {
    const current = selectedEntry();
    if (!current) return;
    const previousValue = timelineValueForEntry(current, prop);
    recordHistory();
    if (prop === "rotation") current.root.rotation[axis] = THREE.MathUtils.degToRad(value);
    else current.root[prop][axis] = value;
    syncSelectedBases();
    if (sceneTimeline.autoKey) {
      seedInitialTransformAutoKey(current, prop, previousValue);
      setTimelineKeyframe(prop, { notify: false, record: false, refresh: false });
    }
    updateAllUI();
  }

  function captureTransformValues(entry: SceneEntry): Record<TransformProperty, [number, number, number]> {
    return {
      position: timelineValueForEntry(entry, "position"),
      rotation: timelineValueForEntry(entry, "rotation"),
      scale: timelineValueForEntry(entry, "scale")
    };
  }

  function seedInitialTransformAutoKey(entry: SceneEntry, kind: TransformProperty, value = timelineValueForEntry(entry, kind)): void {
    seedInitialObjectAutoKey(entry, kind, value);
  }

  function seedInitialObjectAutoKey(entry: SceneEntry, kind: TimelineTrackKind, value: [number, number, number]): void {
    const seedTime = initialAutoKeySeedTime();
    if (seedTime === null) return;

    const objectTimeline = ensureObjectTimeline(sceneTimeline, entry.id);
    const existingTrack = objectTimeline.tracks.find((candidate) => candidate.kind === kind);
    if (existingTrack?.locked || existingTrack?.keyframes.length) return;

    const track = ensureTimelineTrack(objectTimeline, kind);
    track.keyframes.push(createTimelineKeyframe(seedTime, [...value] as [number, number, number]));
    sortTimelineKeyframes(track);
  }

  function seedInitialCameraAutoKey(kind: TimelineTrackKind, value: [number, number, number]): void {
    const seedTime = initialAutoKeySeedTime();
    if (seedTime === null) return;

    const cameraTimeline = ensureCameraTimeline(sceneTimeline);
    const existingTrack = cameraTimeline.tracks.find((candidate) => candidate.kind === kind);
    if (existingTrack?.locked || existingTrack?.keyframes.length) return;

    const track = ensureTimelineTrack(cameraTimeline, kind);
    track.keyframes.push(createTimelineKeyframe(seedTime, [...value] as [number, number, number]));
    sortTimelineKeyframes(track);
  }

  function seedInitialLightAutoKey(kind: TimelineTrackKind, value: [number, number, number]): void {
    const seedTime = initialAutoKeySeedTime();
    if (seedTime === null) return;

    const lightTimeline = ensureLightTimeline(sceneTimeline);
    const existingTrack = lightTimeline.tracks.find((candidate) => candidate.kind === kind);
    if (existingTrack?.locked || existingTrack?.keyframes.length) return;

    const track = ensureTimelineTrack(lightTimeline, kind);
    track.keyframes.push(createTimelineKeyframe(seedTime, [...value] as [number, number, number]));
    sortTimelineKeyframes(track);
  }

  function initialAutoKeySeedTime(): number | null {
    const currentTime = snapTimelineTime(sceneTimeline, sceneTimeline.currentTime);
    const seedTime = snapTimelineTime(sceneTimeline, clamp(sceneTimeline.workStart, 0, sceneTimeline.duration));
    return currentTime > seedTime + 0.001 ? seedTime : null;
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
        const trackKind = cameraTrackForGroup(group);
        const previousValue = timelineValueForCamera(trackKind);
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
          seedInitialCameraAutoKey(trackKind, previousValue);
          setTimelineKeyframe(trackKind, { notify: false, record: false, refresh: false });
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
    document.querySelectorAll<HTMLButtonElement>(".lighting-preset").forEach((button) => {
      const preset = button.dataset.lightingPreset ? lightingPresetById(button.dataset.lightingPreset) : null;
      button.classList.toggle("active", Boolean(preset && lightRigMatchesPreset(lightRig, preset)));
    });

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
        const trackKind = lightPositionTrackForKind(lightRig.active);
        const previousValue = timelineValueForLight(trackKind);
        currentLight(lightRig).position[axis] = Number(input.value);
        syncLightHelpers(lightRig);
        if (sceneTimeline.autoKey) {
          seedInitialLightAutoKey(trackKind, previousValue);
          setTimelineKeyframe(trackKind, { notify: false, record: false, refresh: false });
        }
        updateAllUI();
      });
    });
  }

  function syncRenderUI(): void {
    query<HTMLSelectElement>("#tone-mapping").value = renderSettings.toneMapping;
    query<HTMLInputElement>("#render-exposure").value = String(renderSettings.exposure);
    query<HTMLSelectElement>("#shadow-quality").value = renderSettings.shadowQuality;
    query<HTMLSelectElement>("#environment-preset").value = renderSettings.environment;
    query<HTMLInputElement>("#post-fxaa-toggle").checked = renderSettings.postProcessing.fxaa;
    query<HTMLInputElement>("#post-bloom-toggle").checked = renderSettings.postProcessing.bloom;
    query<HTMLInputElement>("#post-bloom-strength").value = String(renderSettings.postProcessing.bloomStrength);
    query<HTMLInputElement>("#post-bloom-threshold").value = String(renderSettings.postProcessing.bloomThreshold);
    query<HTMLInputElement>("#post-bloom-radius").value = String(renderSettings.postProcessing.bloomRadius);
    query<HTMLInputElement>("#post-ssao-toggle").checked = renderSettings.postProcessing.ssao;
    query<HTMLInputElement>("#post-ssao-radius").value = String(renderSettings.postProcessing.ssaoRadius);
    query<HTMLInputElement>("#post-ssao-min").value = String(renderSettings.postProcessing.ssaoMinDistance);
    query<HTMLInputElement>("#post-ssao-max").value = String(renderSettings.postProcessing.ssaoMaxDistance);
    query<HTMLInputElement>("#post-vignette-toggle").checked = renderSettings.postProcessing.vignette;
    query<HTMLInputElement>("#post-vignette-darkness").value = String(renderSettings.postProcessing.vignetteDarkness);
    query<HTMLDivElement>("#renderer-mode").textContent = `WebGL raster | ${toneMappingLabel(renderSettings.toneMapping)} | Exposure ${formatNumber(renderSettings.exposure)} | Shadows ${shadowQualityLabel(renderSettings.shadowQuality)} | Environment ${environmentPreset(renderSettings.environment).label} | ${postProcessingLabel(renderSettings.postProcessing)}`;
  }

  function updateRenderSettings(patch: Partial<RenderSettings>): void {
    recordHistory();
    renderSettings = normalizeRenderSettings({ ...renderSettings, ...patch });
    applyRenderSettings(renderer, lightRig, renderSettings);
    environmentController.apply(renderSettings);
    applyPostProcessingSettings(renderPipeline, renderSettings.postProcessing);
    syncRenderUI();
    updateTelemetry();
  }

  function updatePostProcessingSettings(patch: Partial<PostProcessingSettings>): void {
    updateRenderSettings({
      postProcessing: normalizePostProcessingSettings({ ...renderSettings.postProcessing, ...patch })
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
    document.querySelectorAll<HTMLButtonElement>(".material-preset").forEach((button) => {
      const preset = button.dataset.materialPreset ? materialPresetById(button.dataset.materialPreset) : null;
      button.classList.toggle("active", Boolean(entry && preset && entryMatchesMaterialPreset(entry, preset)));
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
    query<HTMLInputElement>("#motion-path-toggle").checked = motionPathVisible;
  }

  function syncMotionPath(): void {
    updateMotionPath(motionPathRig, sceneTimeline, selectedEntry(), motionPathVisible);
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
    entry.useSourceMaterials = false;
    entry.textureName = textureName;
    entry.texture = textureName === "none" ? null : resourceTracker.track(makeTexturePreset(textureName));
    entry.materialMode = entry.materialMode === "normal" ? "standard" : entry.materialMode;
    rebuildEntryVisual(entry);
    updateAllUI();
    showToast(textureName === "none" ? "Texture removed" : `${capitalize(textureName)} texture applied`, "good");
  }

  function applyMaterialPreset(preset: string): void {
    updateSelectedEntry((entry) => {
      const presetConfig = materialPresetById(preset);
      if (!presetConfig) return;
      entry.useSourceMaterials = false;
      applyMaterialPresetValues(entry, presetConfig);
      if (presetConfig.textureName) {
        if (entry.textureName !== presetConfig.textureName) {
          resourceTracker.disposeResource(entry.texture);
          entry.textureName = presetConfig.textureName;
          entry.texture = presetConfig.textureName === "none" ? null : resourceTracker.track(makeTexturePreset(presetConfig.textureName));
        }
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
        entry.useSourceMaterials = false;
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
    const files = Array.from(input.files ?? []);
    if (files.length > 0) await importModelFiles(files);
    input.value = "";
  }

  async function importModelFiles(files: File[]): Promise<void> {
    const file = files.find(isModelFile);
    if (!file) {
      showToast("Choose a GLB, GLTF, OBJ, or STL model file.", "bad");
      return;
    }
    try {
      recordHistory();
      setProgress(`Loading ${file.name}`, 0.05);
      const imported = await loadModelFromFiles(files, (progress) => {
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
        useSourceMaterials: imported.useSourceMaterials,
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
      showToast(imported.warnings[0] ?? `Model imported: ${file.name}`, imported.warnings.length > 0 ? "bad" : "good");
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
    const code = event.code.toLowerCase();
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
    if ((event.ctrlKey || event.metaKey) && key === "f") {
      event.preventDefault();
      timelinePanel.focusRowSearch();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && key === "a") {
      event.preventDefault();
      if (event.altKey) selectVisibleTimelineKeyframes(event.shiftKey);
      else if (event.shiftKey) selectTimelineWorkAreaKeyframes();
      else selectAllActiveTimelineKeyframes();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.altKey && (key === "k" || code === "keyk")) {
      event.preventDefault();
      selectVisibleTimelineTimeKeyframes();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && key === "c") {
      event.preventDefault();
      copyTimelineKeyframes();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && key === "x") {
      event.preventDefault();
      cutTimelineKeyframes();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && key === "v") {
      event.preventDefault();
      pasteTimelineKeyframes();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && key === "d") {
      event.preventDefault();
      splitSelectedLayerAtPlayhead();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && key === "d") {
      event.preventDefault();
      duplicateTimelineKeyframes(timelinePanel.selectedKeyframeIdsList());
      return;
    }
    if ((event.ctrlKey || event.metaKey) && key === "s") {
      event.preventDefault();
      saveScene();
      return;
    }
    if (key === "f9") {
      event.preventDefault();
      setTimelineInterpolation(timelinePanel.selectedKeyframeIdsList(), interpolationFromF9Shortcut(event));
      return;
    }
    if (event.altKey && key === "[") {
      event.preventDefault();
      trimSelectedLayerInPoint();
      return;
    }
    if (event.altKey && key === "]") {
      event.preventDefault();
      trimSelectedLayerOutPoint();
      return;
    }
    if (event.altKey && key === "i") {
      event.preventDefault();
      stepSelectedLayerBoundary("in");
      return;
    }
    if (event.altKey && key === "o") {
      event.preventDefault();
      stepSelectedLayerBoundary("out");
      return;
    }
    if (event.altKey && event.shiftKey && key === "b") {
      event.preventDefault();
      setTimelineWorkAreaToSelectedLayer();
      return;
    }
    if (event.shiftKey && key === "enter") {
      event.preventDefault();
      moveTimelineKeyframesToPlayhead(timelinePanel.selectedKeyframeIdsList());
      return;
    }
    if (event.shiftKey && key === "c") {
      event.preventDefault();
      centerTimelineKeyframesOnPlayhead(timelinePanel.selectedKeyframeIdsList());
      return;
    }
    if (event.shiftKey && key === "v") {
      event.preventDefault();
      roveTimelineKeyframesAcrossTime(timelinePanel.selectedKeyframeIdsList());
      return;
    }
    if (event.shiftKey && key === "r") {
      event.preventDefault();
      reverseTimelineKeyframes(timelinePanel.selectedKeyframeIdsList());
      return;
    }
    if (event.shiftKey && key === "s") {
      event.preventDefault();
      snapTimelineKeyframesToFrames(timelinePanel.selectedKeyframeIdsList());
      return;
    }
    if (event.shiftKey && key === "d") {
      event.preventDefault();
      distributeTimelineKeyframes(timelinePanel.selectedKeyframeIdsList());
      return;
    }
    if (event.shiftKey && key === "f") {
      event.preventDefault();
      fitTimelineKeyframesToWorkArea(timelinePanel.selectedKeyframeIdsList());
      return;
    }
    if (event.shiftKey && key === "g") {
      event.preventDefault();
      if (event.altKey) cascadeTimelineKeyframesFromPlayhead(timelinePanel.selectedKeyframeIdsList());
      else staggerTimelineKeyframesFromPlayhead(timelinePanel.selectedKeyframeIdsList());
      return;
    }
    if (key === "b") {
      event.preventDefault();
      if (event.shiftKey) setTimelineWorkAreaToSelectedKeys();
      else setTimelineWorkAreaEdge("start");
      return;
    }
    if (key === "n") {
      event.preventDefault();
      setTimelineWorkAreaEdge("end");
      return;
    }
    if (key === "i") {
      event.preventDefault();
      setTimelineWorkAreaEdge("start");
      return;
    }
    if (key === "o") {
      event.preventDefault();
      setTimelineWorkAreaEdge("end");
      return;
    }
    if (key === "u") {
      event.preventDefault();
      showToast(`Timeline rows: ${timelinePanel.cycleRowFilter()}`, "good");
      return;
    }
    if (key === "=" || key === "+") {
      event.preventDefault();
      timelinePanel.zoomTimeline(1);
      showToast("Timeline zoomed in", "good");
      return;
    }
    if (key === "-" || key === "_") {
      event.preventDefault();
      timelinePanel.zoomTimeline(-1);
      showToast("Timeline zoomed out", "good");
      return;
    }
    if (key === "0") {
      event.preventDefault();
      timelinePanel.fitTimelineToDuration();
      showToast("Timeline fit to duration", "good");
      return;
    }
    if (key === "m" && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      if (event.altKey && event.shiftKey) deleteTimelineMarker(null);
      else if (event.altKey) stepTimelineMarker(-1);
      else if (event.shiftKey) stepTimelineMarker(1);
      else addTimelineMarker("");
      return;
    }
    if (key === "j") {
      event.preventDefault();
      playTimeline(-1);
      return;
    }
    if (key === "k") {
      event.preventDefault();
      pauseTimeline();
      return;
    }
    if (key === "l") {
      event.preventDefault();
      playTimeline(1);
      return;
    }
    if (key === "t") setTransformMode("translate");
    if (key === "r") setTransformMode("rotate");
    if (key === "s") setTransformMode("scale");
    if (key === " ") {
      event.preventDefault();
      if (event.shiftKey) previewSelectedTimelineKeyRange();
      else togglePlay();
      return;
    }
    if (key === "arrowleft" || key === "arrowright") {
      event.preventDefault();
      if (event.altKey && (event.ctrlKey || event.metaKey)) stepVisibleTimelineKeyframe(key === "arrowright" ? 1 : -1);
      else if (event.altKey) nudgeTimelineKeyframes(key === "arrowright" ? 1 : -1);
      else if (event.shiftKey) stepTimelineKeyframe(key === "arrowright" ? 1 : -1);
      else stepTimelineFrame(key === "arrowright" ? 1 : -1);
      return;
    }
    if (key === "home") {
      event.preventDefault();
      if (event.shiftKey) stepSelectedTimelineKeyBoundary(-1);
      else setTimelineTime(sceneTimeline.workStart);
      return;
    }
    if (key === "end") {
      event.preventDefault();
      if (event.shiftKey) stepSelectedTimelineKeyBoundary(1);
      else setTimelineTime(sceneTimeline.workEnd);
      return;
    }
    if (key === "delete" || key === "backspace") {
      const selectedTimelineKeys = timelinePanel.selectedKeyframeIdsList();
      if (selectedTimelineKeys.length > 0) deleteTimelineKeyframes(selectedTimelineKeys);
      else deleteSelected();
    }
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
    if (transport.playing) pauseTimeline();
    else playTimeline(1, "Timeline running");
  }

  function playTimeline(direction: PlaybackDirection, message = direction > 0 ? "Timeline running forward" : "Timeline running backward"): void {
    const state = transport.play(direction);
    syncPlaybackBoundary();
    timelinePanel.update(sceneTimeline, entries.values(), selectedId, transport.playing);
    updatePlayButton();
    showToast(`${message} ${state.rate}x`, "good");
  }

  function pauseTimeline(message = "Timeline paused"): void {
    transport.pause();
    timelinePanel.update(sceneTimeline, entries.values(), selectedId, transport.playing);
    updatePlayButton();
    showToast(message, "good");
  }

  function syncPlaybackBoundary(): void {
    if (transport.playing && transport.direction > 0 && (sceneTimeline.currentTime < sceneTimeline.workStart || sceneTimeline.currentTime >= sceneTimeline.workEnd)) {
      setTimelineTime(sceneTimeline.workStart);
    }
    if (transport.playing && transport.direction < 0 && (sceneTimeline.currentTime <= sceneTimeline.workStart || sceneTimeline.currentTime > sceneTimeline.workEnd)) {
      setTimelineTime(sceneTimeline.workEnd);
    }
  }

  function startCinematicDemo(): void {
    recordHistory();
    clearSceneEntries();
    sceneTimeline = createDefaultTimeline();
    const cube = addPrimitive("cube", new THREE.Vector3(-4.2, 0.02, 0.8), { color: "#4bd0a0", textureName: "uv" }, false);
    const sphere = addPrimitive("sphere", new THREE.Vector3(-1.4, 0.02, -1.6), { color: "#f7bd4b", textureName: "checker" }, false);
    const teapot = addPrimitive("teapot", new THREE.Vector3(1.55, 0.02, 0.7), { color: "#df6b80", materialMode: "phong" }, false);
    const knot = addPrimitive("torusKnot", new THREE.Vector3(4.2, 0.02, -1.3), { color: "#7c70f4", renderMode: "lines" }, false);
    const surface = addPrimitive("parametric", new THREE.Vector3(0, 0.02, 2.7), { color: "#2fb6c3", renderMode: "points" }, false);
    bakeObjectAnimationPreset(cube, "bounce");
    bakeObjectAnimationPreset(sphere, "pulse");
    bakeObjectAnimationPreset(teapot, "spin");
    bakeObjectAnimationPreset(knot, "spin");
    bakeObjectAnimationPreset(surface, "orbit");
    lightRig.active = "point";
    lightRig.point.intensity = 7;
    lightRig.point.color.set("#fff1c7");
    lightRig.point.position.set(4, 7, 4);
    bakeActiveLightSweepTimeline();
    setCameraPreset("iso");
    setSelected(teapot.id);
    rebuildTimelineRuntime();
    timelinePlayer.setTime(sceneTimeline.currentTime);
    if (!transport.playing) togglePlay();
    updateAllUI();
    showToast("Cinematic demo staged", "good");
  }

  function startEvaluationTour(): void {
    clearEvaluationTourMessages();
    recordHistory();
    clearSceneEntries();
    sceneTimeline = createDefaultTimeline();
    const cube = addPrimitive("cube", new THREE.Vector3(-5, 0.02, -1.3), { color: "#4bd0a0", renderMode: "solid", materialMode: "standard" }, false);
    const sphere = addPrimitive("sphere", new THREE.Vector3(-2.5, 0.02, 1.2), { color: "#df6b80", textureName: "checker" }, false);
    addPrimitive("cone", new THREE.Vector3(0, 0.02, -1.5), { color: "#f7bd4b", renderMode: "points", materialMode: "basic" }, false);
    addPrimitive("cylinder", new THREE.Vector3(2.5, 0.02, 1.2), { color: "#2fb6c3", materialMode: "lambert" }, false);
    const torus = addPrimitive("torus", new THREE.Vector3(5, 0.02, -1.2), { color: "#7c70f4", renderMode: "lines" }, false);
    const teapot = addPrimitive("teapot", new THREE.Vector3(0, 0.02, 3.2), { color: "#f06c4f", materialMode: "phong" }, false);
    addSampleModel(new THREE.Vector3(0, 0.02, -4.1), false);
    bakeObjectAnimationPreset(sphere, "pulse");
    bakeObjectAnimationPreset(torus, "spin");
    bakeObjectAnimationPreset(teapot, "bounce");
    lightRig.active = "spot";
    lightRig.helpers = true;
    lightRig.shadows = true;
    stage.grid.visible = true;
    stage.axes.visible = true;
    frustumHelper.visible = true;
    bakeActiveLightSweepTimeline();
    setCameraPreset("iso");
    setSelected(cube.id);
    rebuildTimelineRuntime();
    timelinePlayer.setTime(sceneTimeline.currentTime);
    if (!transport.playing) togglePlay();
    updateAllUI();
    const steps = [
      "Evaluation Tour: required primitives are visible.",
      "Render modes: Solid cube, Points cone, Lines torus.",
      "Projection: camera FOV, Near, Far and frustum helper are enabled.",
      "Affine transforms: select any object and use Move / Rotate / Scale.",
      "Lighting: ambient, spot light, shadows, helpers, and light sweep are active.",
      "Texture mapping: checker texture is applied to the sphere.",
      "Model loading: built-in sample model demonstrates imported model workflow.",
      "Animation: visible keyframes drive spin, bounce, pulse, and light motion."
    ];
    evaluationTourTimers = steps.map((message, index) =>
      window.setTimeout(() => showToast(message, "good"), index * 1500)
    );
  }

  function resetScene(): void {
    recordHistory();
    clearSceneEntries();
    sceneTimeline = createDefaultTimeline();
    renderSettings = createDefaultRenderSettings();
    applyRenderSettings(renderer, lightRig, renderSettings);
    addPrimitive("cube", new THREE.Vector3(0, 0.02, 0), { color: "#4bd0a0" }, false);
    const sphere = addPrimitive("sphere", new THREE.Vector3(3.2, 0.02, -1.2), { color: "#df6b80", textureName: "checker" }, false);
    bakeObjectAnimationPreset(sphere, "pulse");
    setCameraPreset("reset");
    rebuildTimelineRuntime();
    timelinePlayer.setTime(sceneTimeline.currentTime);
    updateAllUI();
    showToast("Scene reset", "good");
  }

  function clearSceneEntries(): void {
    timelinePlayer.clear();
    transformControls.detach();
    clearMotionPath(motionPathRig);
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
    if (entry.sourceObject) resourceTracker.disposeObject(entry.sourceObject);
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
      playing: transport.playing,
      camera,
      target: controls.target,
      stage,
      statsVisible,
      frustumVisible: frustumHelper.visible,
      motionPathVisible,
      lightRig,
      renderSettings,
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
    stage.grid.visible = document.display?.grid ?? true;
    stage.axes.visible = document.display?.axes ?? true;
    statsVisible = document.display?.stats ?? true;
    frustumHelper.visible = document.display?.frustum ?? false;
    motionPathVisible = document.display?.motionPath ?? true;
    applyLightDocument(document);
    renderSettings = normalizeRenderSettings(document.rendering);
    applyRenderSettings(renderer, lightRig, renderSettings);
    environmentController.apply(renderSettings);
    applyPostProcessingSettings(renderPipeline, renderSettings.postProcessing);
    transport.set(document.playing, 1, 1);
    document.objects.forEach((object) => restoreObject(object));
    sceneTimeline = normalizeTimelineDocument(document.timeline, new Set(entries.keys()));
    bakeLegacyAnimationPresetsWithoutTracks();
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
    applyRenderSettings(renderer, lightRig, renderSettings);
    environmentController.apply(renderSettings);
    applyPostProcessingSettings(renderPipeline, renderSettings.postProcessing);
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
        useSourceMaterials: object.useSourceMaterials ?? false,
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

  function bakeLegacyAnimationPresetsWithoutTracks(): void {
    entries.forEach((entry) => {
      if (entry.animation === "none" || hasObjectTransformTimelineTracks(sceneTimeline, entry.id)) return;
      bakeObjectAnimationPreset(entry, entry.animation);
    });
    if (lightRig.sweep && !hasLightTimelineTracks(sceneTimeline)) bakeActiveLightSweepTimeline();
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
    timelinePanel.setPlaybackTime(sceneTimeline, transport.playing);
    if (hasCameraTimelineTracks(sceneTimeline)) syncCameraUI();
    if (hasLightTimelineTracks(sceneTimeline)) syncLightUI();
    if (hasTimelineTracks(sceneTimeline)) {
      syncTransformUI();
      syncSegmentedButtons();
      syncTextureUI();
      syncSelectionSummary();
    }
    updatePlayButton();
  }

  function advanceTimeline(delta: number): void {
    if (sceneTimeline.duration <= 0) return;
    const workStart = clamp(sceneTimeline.workStart, 0, sceneTimeline.duration);
    const workEnd = clamp(sceneTimeline.workEnd, workStart + 0.001, sceneTimeline.duration);
    const span = Math.max(workEnd - workStart, 0.001);
    let nextTime = sceneTimeline.currentTime + delta;
    if (delta >= 0) {
      if (nextTime < workStart || sceneTimeline.currentTime > workEnd) {
        nextTime = workStart;
      } else if (nextTime > workEnd) {
        if (recordingPreview) {
          nextTime = workEnd;
          transport.pause();
          updatePlayButton();
          window.setTimeout(() => stopPreviewRecording(false), 0);
        } else if (sceneTimeline.loop) {
          nextTime = workStart + ((nextTime - workEnd) % span);
        } else {
          nextTime = workEnd;
          transport.pause();
          updatePlayButton();
        }
      }
    } else {
      if (nextTime > workEnd || sceneTimeline.currentTime < workStart) {
        nextTime = workEnd;
      } else if (nextTime < workStart) {
        if (recordingPreview) {
          nextTime = workStart;
          transport.pause();
          updatePlayButton();
          window.setTimeout(() => stopPreviewRecording(false), 0);
        } else if (sceneTimeline.loop) {
          nextTime = workEnd - ((workStart - nextTime) % span);
          if (Math.abs(nextTime - workEnd) < 0.001) nextTime = workStart;
        } else {
          nextTime = workStart;
          transport.pause();
          updatePlayButton();
        }
      }
    }
    sceneTimeline.currentTime = roundTime(nextTime);
    timelinePlayer.setTime(sceneTimeline.currentTime);
    applyCameraTimeline();
    applyLightTimeline();
    applyObjectPropertyTimeline();
    timelinePanel.setPlaybackTime(sceneTimeline, transport.playing);
    if (hasCameraTimelineTracks(sceneTimeline)) syncCameraUI();
    if (hasLightTimelineTracks(sceneTimeline)) syncLightUI();
    if (hasTimelineTracks(sceneTimeline)) {
      syncTransformUI();
      syncSegmentedButtons();
      syncSelectionSummary();
    }
    updatePlayButton();
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

  function setTimelineWorkAreaEdge(edge: "start" | "end"): void {
    recordHistory();
    const time = snapTimelineTime(sceneTimeline, sceneTimeline.currentTime);
    if (edge === "start") {
      sceneTimeline.workStart = clamp(time, 0, sceneTimeline.duration - 0.001);
      if (sceneTimeline.workEnd <= sceneTimeline.workStart) {
        sceneTimeline.workEnd = Math.min(sceneTimeline.duration, sceneTimeline.workStart + Math.max(sceneTimeline.snapStep, 1 / sceneTimeline.fps, 0.001));
      }
    } else {
      if (time <= sceneTimeline.workStart) {
        sceneTimeline.workStart = Math.max(0, time - Math.max(sceneTimeline.snapStep, 1 / sceneTimeline.fps, 0.001));
      }
      sceneTimeline.workEnd = clamp(time, sceneTimeline.workStart + 0.001, sceneTimeline.duration);
    }
    updateAllUI();
    showToast(`Work ${edge === "start" ? "In" : "Out"} set to ${formatNumber(edge === "start" ? sceneTimeline.workStart : sceneTimeline.workEnd)}s`, "good");
  }

  function selectedTimelineKeyRange(emptyMessage: string): { start: number; end: number; count: number } | null {
    const sources = resolveActiveTimelineKeyframeSources(timelinePanel.selectedKeyframeIdsList());
    if (sources.length === 0) {
      showToast(emptyMessage, "bad");
      return null;
    }
    return selectedResolvedKeyframeRange(sceneTimeline, sources);
  }

  function setTimelineWorkAreaToSelectedKeys(): void {
    const range = selectedTimelineKeyRange("Select timeline keyframes before fitting the work area.");
    if (!range) return;

    recordHistory();
    sceneTimeline.workStart = range.start;
    sceneTimeline.workEnd = range.end;
    updateAllUI();
    showToast(`Work area fit to ${range.count} selected keyframe${range.count === 1 ? "" : "s"}`, "good");
  }

  function previewSelectedTimelineKeyRange(): void {
    const range = selectedTimelineKeyRange("Select timeline keyframes before previewing a range.");
    if (!range) return;

    recordHistory();
    sceneTimeline.workStart = range.start;
    sceneTimeline.workEnd = range.end;
    setTimelineTime(range.start);
    transport.pause();
    playTimeline(1, `Previewing ${range.count} selected keyframe${range.count === 1 ? "" : "s"}`);
  }

  function selectAllActiveTimelineKeyframes(): void {
    const selectedCount = timelinePanel.selectAllActiveTrackKeyframes();
    showToast(selectedCount
      ? `${selectedCount} keyframe${selectedCount === 1 ? "" : "s"} selected on active track`
      : "No keyframes on the active track.",
      selectedCount ? "good" : "bad");
  }

  function selectTimelineWorkAreaKeyframes(): void {
    const selectedCount = timelinePanel.selectActiveTrackKeyframesInWorkArea();
    showToast(selectedCount
      ? `${selectedCount} work-area keyframe${selectedCount === 1 ? "" : "s"} selected on active track`
      : "No active-track keyframes inside the work area.",
      selectedCount ? "good" : "bad");
  }

  function selectVisibleTimelineKeyframes(workAreaOnly = false): void {
    const selectedCount = timelinePanel.selectVisibleRowKeyframes(workAreaOnly);
    const scope = workAreaOnly ? "visible work-area" : "visible-row";
    showToast(selectedCount
      ? `${selectedCount} ${scope} keyframe${selectedCount === 1 ? "" : "s"} selected`
      : workAreaOnly
        ? "No visible-row keyframes inside the work area."
        : "No keyframes on visible timeline rows.",
      selectedCount ? "good" : "bad");
  }

  function selectVisibleTimelineTimeKeyframes(): void {
    const selectedCount = timelinePanel.selectVisibleRowKeyframesAtCurrentTime();
    showToast(selectedCount
      ? `${selectedCount} visible-row keyframe${selectedCount === 1 ? "" : "s"} selected at ${formatNumber(sceneTimeline.currentTime)}s`
      : `No visible-row keyframes at ${formatNumber(sceneTimeline.currentTime)}s.`,
      selectedCount ? "good" : "bad");
  }

  function addTimelineKeyframe(kind: TimelineTrackKind): void {
    setTimelineKeyframe(kind);
  }

  function assertTimelineTrackUnlocked(track: TimelineTrackDocument | null | undefined, action: string): boolean {
    if (!track?.locked) return true;
    showToast(`${track.label} track is locked. Unlock it before ${action}.`, "bad");
    return false;
  }

  function assertTimelineSourcesUnlocked(sources: TimelineKeyframeSource[], action: string): boolean {
    const locked = sources.find((source) => source.track.locked);
    if (!locked) return true;
    showToast(`${locked.track.label} track is locked. Unlock it before ${action}.`, "bad");
    return false;
  }

  function upsertTimelineKeyframe(track: TimelineTrackDocument, time: number, value: [number, number, number]): TimelineKeyframeDocument {
    const existing = track.keyframes.find((keyframe) => Math.abs(keyframe.time - time) < 0.001);
    const keyframe = existing ?? createTimelineKeyframe(time, value);
    keyframe.value = [...value] as [number, number, number];
    if (!existing) track.keyframes.push(keyframe);
    sortTimelineKeyframes(track);
    return keyframe;
  }

  function setTransformTimelineKeyframes(): void {
    const entry = selectedEntry();
    if (!entry) {
      showToast("Select an object before setting transform keyframes.", "bad");
      return;
    }

    const objectTimeline = ensureObjectTimeline(sceneTimeline, entry.id);
    const lockedTransformTrack = objectTimeline.tracks.find((track) => isObjectTransformTrackKind(track.kind) && track.locked);
    if (!assertTimelineTrackUnlocked(lockedTransformTrack, "setting transform keyframes")) return;

    const time = snapTimelineTime(sceneTimeline, sceneTimeline.currentTime);
    const values: Record<"position" | "rotation" | "scale", [number, number, number]> = {
      position: timelineValueForEntry(entry, "position"),
      rotation: timelineValueForEntry(entry, "rotation"),
      scale: timelineValueForEntry(entry, "scale")
    };

    recordHistory();
    (["position", "rotation", "scale"] as const).forEach((kind) => {
      const track = ensureTimelineTrack(objectTimeline, kind);
      upsertTimelineKeyframe(track, time, values[kind]);
    });
    entry.animation = "none";
    sceneTimeline.currentTime = time;
    rebuildTimelineRuntime();
    timelinePlayer.setTime(sceneTimeline.currentTime);
    applyObjectPropertyTimeline();
    updateAllUI();
    showToast(`Position, rotation, and scale keys set at ${formatNumber(time)}s`, "good");
  }

  function setVisibleTimelineKeyframes(rows: TimelineVisibleRowTarget[]): void {
    const targets = dedupeVisibleTimelineTargets(rows);
    if (targets.length === 0) {
      showToast("No visible timeline rows to key.", "bad");
      return;
    }

    let lockedCount = 0;
    const keyableTargets = targets.filter((target) => {
      if (!isCameraTrackKind(target.kind) && !isLightTrackKind(target.kind) && !entries.has(target.targetId)) return false;
      const existingTrack = activeTimelineTrack(target.kind, target.targetId);
      if (!existingTrack?.locked) return true;
      lockedCount += 1;
      return false;
    });

    if (keyableTargets.length === 0) {
      showToast(lockedCount > 0 ? "All visible timeline rows are locked." : "No keyable visible timeline rows.", "bad");
      return;
    }

    const time = snapTimelineTime(sceneTimeline, sceneTimeline.currentTime);
    const keyframeIds: string[] = [];
    let cameraChanged = false;
    let lightChanged = false;
    let objectChanged = false;

    recordHistory();
    keyableTargets.forEach((target) => {
      if (isCameraTrackKind(target.kind)) {
        const track = ensureTimelineTrack(ensureCameraTimeline(sceneTimeline), target.kind);
        keyframeIds.push(upsertTimelineKeyframe(track, time, timelineValueForCamera(target.kind)).id);
        cameraChanged = true;
        return;
      }

      if (isLightTrackKind(target.kind)) {
        const track = ensureTimelineTrack(ensureLightTimeline(sceneTimeline), target.kind);
        keyframeIds.push(upsertTimelineKeyframe(track, time, timelineValueForLight(target.kind)).id);
        lightChanged = true;
        return;
      }

      const entry = entries.get(target.targetId);
      if (!entry) return;
      const track = ensureTimelineTrack(ensureObjectTimeline(sceneTimeline, entry.id), target.kind);
      keyframeIds.push(upsertTimelineKeyframe(track, time, timelineValueForEntry(entry, target.kind)).id);
      if (isObjectTransformTrackKind(target.kind)) entry.animation = "none";
      objectChanged = true;
    });

    sceneTimeline.currentTime = time;
    rebuildTimelineRuntime();
    timelinePlayer.setTime(sceneTimeline.currentTime);
    if (cameraChanged) applyCameraTimeline();
    if (lightChanged) applyLightTimeline();
    if (objectChanged) applyObjectPropertyTimeline();
    updateAllUI();
    timelinePanel.selectKeyframes(keyframeIds);

    const skipped = lockedCount > 0 ? ` (${lockedCount} locked skipped)` : "";
    showToast(`${keyframeIds.length} visible ${keyframeIds.length === 1 ? "key" : "keys"} set at ${formatNumber(time)}s${skipped}`, "good");
  }

  function trimSelectedLayerInPoint(): void {
    trimSelectedLayerVisibility("in");
  }

  function trimSelectedLayerOutPoint(): void {
    trimSelectedLayerVisibility("out");
  }

  function trimSelectedLayerVisibility(edge: "in" | "out"): void {
    const entry = selectedEntry();
    if (!entry) {
      showToast("Select an object before trimming layer timing.", "bad");
      return;
    }
    const existingTrack = activeTimelineTrack("objectVisibility", entry.id);
    if (!assertTimelineTrackUnlocked(existingTrack, "trimming layer timing")) return;

    const time = snapTimelineTime(sceneTimeline, sceneTimeline.currentTime);
    recordHistory();
    const result = edge === "in"
      ? setObjectVisibilityRange(sceneTimeline, entry.id, time, null)
      : setObjectVisibilityRange(sceneTimeline, entry.id, 0, time);
    sceneTimeline.currentTime = time;
    finishLayerVisibilityEdit(result.keyframeIds);
    showToast(`${entry.name} layer ${edge === "in" ? "in" : "out"} set at ${formatNumber(time)}s`, "good");
  }

  function splitSelectedLayerAtPlayhead(): void {
    const entry = selectedEntry();
    if (!entry) {
      showToast("Select an object before splitting a layer.", "bad");
      return;
    }
    const time = snapTimelineTime(sceneTimeline, sceneTimeline.currentTime);
    if (time <= 0.001 || time >= sceneTimeline.duration - 0.001) {
      showToast("Move the playhead inside the timeline before splitting a layer.", "bad");
      return;
    }
    const existingTrack = activeTimelineTrack("objectVisibility", entry.id);
    if (!assertTimelineTrackUnlocked(existingTrack, "splitting the layer")) return;

    recordHistory();
    const copyId = `object-${idCounter++}`;
    const copy = restoreObject({
      ...serializeObjectForDuplicate(entry),
      id: copyId,
      name: `${entry.name} Split`
    });
    copyTimelineObject(sceneTimeline, entry.id, copy.id);
    const before = setObjectVisibilityRange(sceneTimeline, entry.id, 0, time);
    const after = setObjectVisibilityRange(sceneTimeline, copy.id, time, null);
    sceneTimeline.currentTime = time;
    rebuildTimelineRuntime();
    timelinePlayer.setTime(sceneTimeline.currentTime);
    applyObjectPropertyTimeline();
    setSelected(copy.id);
    timelinePanel.selectKeyframes([...before.keyframeIds, ...after.keyframeIds]);
    showToast(`${entry.name} split at ${formatNumber(time)}s`, "good");
  }

  function setTimelineWorkAreaToSelectedLayer(): void {
    const selection = selectedLayerRange();
    if (!selection) return;
    recordHistory();
    sceneTimeline.workStart = selection.range.start;
    sceneTimeline.workEnd = selection.range.end;
    sceneTimeline.currentTime = selection.range.start;
    timelinePlayer.setTime(sceneTimeline.currentTime);
    updateAllUI();
    showToast(`${selection.entry.name} work area ${formatNumber(selection.range.start)}-${formatNumber(selection.range.end)}s`, "good");
  }

  function editTimelineLayerRange(objectId: string, start: number, end: number, shiftKeyframes: boolean): void {
    const entry = entries.get(objectId);
    if (!entry) {
      showToast("Layer object no longer exists.", "bad");
      return;
    }
    const existingTrack = activeTimelineTrack("objectVisibility", entry.id);
    if (!assertTimelineTrackUnlocked(existingTrack, "editing layer timing")) return;

    const duration = Math.max(sceneTimeline.duration, 0.001);
    const safeStart = clamp(Math.min(start, end - 0.001), 0, duration);
    const safeEnd = clamp(Math.max(end, safeStart + 0.001), safeStart + 0.001, duration);
    const previousRange = objectLayerRange(sceneTimeline, entry.id);
    const layerMoveDelta = shiftKeyframes && previousRange ? safeStart - previousRange.start : 0;
    recordHistory();
    const shiftResult = shiftKeyframes ? shiftObjectLayerKeyframes(sceneTimeline, entry.id, layerMoveDelta) : null;
    const result = setObjectVisibilityRange(sceneTimeline, entry.id, safeStart, safeEnd >= duration - 0.001 ? null : safeEnd);
    selectedId = entry.id;
    transformControls.attach(entry.root);
    syncOutline();
    rebuildTimelineRuntime();
    timelinePlayer.setTime(sceneTimeline.currentTime);
    applyObjectPropertyTimeline();
    updateAllUI();
    timelinePanel.selectKeyframes(result.keyframeIds);
    const shifted = shiftResult?.shifted ? `, ${shiftResult.shifted} keys shifted` : "";
    const skipped = shiftResult?.skipped ? ` (${shiftResult.skipped} locked/out-of-range keys skipped)` : "";
    showToast(`${entry.name} layer range ${formatNumber(safeStart)}-${formatNumber(safeEnd)}s${shifted}${skipped}`, "good");
  }

  function stepSelectedLayerBoundary(edge: "in" | "out"): void {
    const selection = selectedLayerRange();
    if (!selection) return;
    const time = edge === "in" ? selection.range.start : selection.range.end;
    setTimelineTime(time);
    showToast(`${selection.entry.name} layer ${edge}: ${formatNumber(time)}s`, "good");
  }

  function selectedLayerRange(): { entry: SceneEntry; range: TimelineLayerRange } | null {
    const entry = selectedEntry();
    if (!entry) {
      showToast("Select an object before using layer range commands.", "bad");
      return null;
    }
    const range = objectLayerRange(sceneTimeline, entry.id);
    if (!range) {
      showToast(`${entry.name} has no visible layer range.`, "bad");
      return null;
    }
    return { entry, range };
  }

  function finishLayerVisibilityEdit(keyframeIds: string[]): void {
    rebuildTimelineRuntime();
    timelinePlayer.setTime(sceneTimeline.currentTime);
    applyObjectPropertyTimeline();
    updateAllUI();
    timelinePanel.selectKeyframes(keyframeIds);
  }

  function dedupeVisibleTimelineTargets(rows: TimelineVisibleRowTarget[]): TimelineVisibleRowTarget[] {
    const targets = new Map<string, TimelineVisibleRowTarget>();
    rows.forEach((row) => {
      const key = `${row.targetId}:${row.kind}`;
      if (!targets.has(key)) targets.set(key, row);
    });
    return [...targets.values()];
  }

  function bakeObjectAnimationPreset(entry: SceneEntry, mode: AnimationMode, clearExisting = true): void {
    if (mode === "none") {
      entry.animation = "none";
      return;
    }

    entry.animation = "none";
    entry.basePosition.copy(entry.root.position);
    entry.baseScale.copy(entry.root.scale);
    const objectTimeline = ensureObjectTimeline(sceneTimeline, entry.id);
    if (clearExisting) {
      objectTimeline.tracks = objectTimeline.tracks.filter((track) => !isObjectTransformTrackKind(track.kind) || track.locked);
    }

    const range = timelineBakeRange();
    const position = entry.root.position.clone();
    const scale = entry.root.scale.clone();
    const rotation = [
      THREE.MathUtils.radToDeg(entry.root.rotation.x),
      THREE.MathUtils.radToDeg(entry.root.rotation.y),
      THREE.MathUtils.radToDeg(entry.root.rotation.z)
    ] as [number, number, number];

    if (mode === "spin") {
      replaceTimelineTrack(objectTimeline, "rotation", [
        { time: range.start, value: rotation },
        { time: range.end, value: [rotation[0] + 45, rotation[1] + 360, rotation[2]] }
      ]);
    } else if (mode === "bounce") {
      replaceTimelineTrack(objectTimeline, "position", [
        { time: range.start, value: [position.x, position.y, position.z], interpolation: "smooth" },
        { time: range.mid, value: [position.x, position.y + 1.25, position.z], interpolation: "smooth" },
        { time: range.end, value: [position.x, position.y, position.z], interpolation: "smooth" }
      ]);
    } else if (mode === "pulse") {
      replaceTimelineTrack(objectTimeline, "scale", [
        { time: range.start, value: [scale.x, scale.y, scale.z], interpolation: "smooth" },
        { time: range.mid, value: [scale.x * 1.28, scale.y * 1.28, scale.z * 1.28], interpolation: "smooth" },
        { time: range.end, value: [scale.x, scale.y, scale.z], interpolation: "smooth" }
      ]);
    } else if (mode === "orbit") {
      const radius = 1.35 + (entry.phase % 1.2);
      replaceTimelineTrack(objectTimeline, "position", [
        { time: range.start, value: [position.x, position.y, position.z], interpolation: "smooth" },
        { time: range.quarter, value: [position.x + radius, position.y, position.z + radius], interpolation: "smooth" },
        { time: range.mid, value: [position.x, position.y, position.z + radius * 2], interpolation: "smooth" },
        { time: range.threeQuarter, value: [position.x - radius, position.y, position.z + radius], interpolation: "smooth" },
        { time: range.end, value: [position.x, position.y, position.z], interpolation: "smooth" }
      ]);
      replaceTimelineTrack(objectTimeline, "rotation", [
        { time: range.start, value: rotation },
        { time: range.end, value: [rotation[0], rotation[1] + 360, rotation[2]] }
      ]);
    }
  }

  function bakeActiveLightSweepTimeline(): void {
    const trackKind = lightPositionTrackForKind(lightRig.active);
    const light = currentLight(lightRig);
    const range = timelineBakeRange();
    const position = light.position.clone();
    replaceTimelineTrack(ensureLightTimeline(sceneTimeline), trackKind, [
      { time: range.start, value: [position.x, position.y, position.z], interpolation: "smooth" },
      { time: range.mid, value: [position.x * -0.7, position.y + 1.2, position.z + 2.4], interpolation: "smooth" },
      { time: range.end, value: [position.x, position.y, position.z], interpolation: "smooth" }
    ]);
    lightRig.sweep = false;
  }

  function replaceTimelineTrack(
    collection: { tracks: TimelineTrackDocument[] },
    kind: TimelineTrackKind,
    keyframes: Array<{ time: number; value: [number, number, number]; interpolation?: TimelineInterpolation }>
  ): void {
    const track = ensureTimelineTrack(collection, kind);
    if (track.locked) return;
    track.enabled = true;
    track.keyframes = keyframes.map((item) => {
      const keyframe = createTimelineKeyframe(item.time, item.value);
      keyframe.interpolation = item.interpolation ?? "linear";
      return keyframe;
    });
    sortTimelineKeyframes(track);
  }

  function timelineBakeRange(): { start: number; quarter: number; mid: number; threeQuarter: number; end: number } {
    const duration = Math.max(sceneTimeline.duration, 0.5);
    const start = roundTime(clamp(sceneTimeline.workStart, 0, duration - 0.001));
    let end = roundTime(clamp(sceneTimeline.workEnd, start + 0.5, duration));
    if (end - start < 0.5) end = roundTime(Math.min(duration, start + 0.5));
    const span = Math.max(end - start, 0.5);
    return {
      start,
      quarter: roundTime(start + span * 0.25),
      mid: roundTime(start + span * 0.5),
      threeQuarter: roundTime(start + span * 0.75),
      end
    };
  }

  function setTimelineKeyframe(
    kind: TimelineTrackKind,
    options: { notify?: boolean; record?: boolean; refresh?: boolean; select?: boolean; time?: number } = {}
  ): void {
    const time = snapTimelineTime(sceneTimeline, options.time ?? sceneTimeline.currentTime);
    if (isCameraTrackKind(kind)) {
      const cameraTimeline = ensureCameraTimeline(sceneTimeline);
      const currentTrack = cameraTimeline.tracks.find((candidate) => candidate.kind === kind);
      if (!assertTimelineTrackUnlocked(currentTrack, "setting a keyframe")) return;
      if (options.record !== false) recordHistory();
      const track = ensureTimelineTrack(cameraTimeline, kind);
      const value = timelineValueForCamera(kind);
      const existing = track.keyframes.find((keyframe) => Math.abs(keyframe.time - time) < 0.001);
      const keyframe = existing ?? createTimelineKeyframe(time, value);
      keyframe.value = value;
      if (!existing) track.keyframes.push(keyframe);
      sortTimelineKeyframes(track);
      sceneTimeline.currentTime = time;
      rebuildTimelineRuntime();
      timelinePlayer.setTime(sceneTimeline.currentTime);
      applyCameraTimeline();
      if (options.refresh !== false) updateAllUI();
      if (options.select !== false) timelinePanel.selectKeyframes([keyframe.id]);
      if (options.notify !== false) showToast(`${cameraTrackLabel(kind)} keyframe set at ${formatNumber(time)}s`, "good");
      return;
    }

    if (isLightTrackKind(kind)) {
      const lightTimeline = ensureLightTimeline(sceneTimeline);
      const currentTrack = lightTimeline.tracks.find((candidate) => candidate.kind === kind);
      if (!assertTimelineTrackUnlocked(currentTrack, "setting a keyframe")) return;
      if (options.record !== false) recordHistory();
      const track = ensureTimelineTrack(lightTimeline, kind);
      const value = timelineValueForLight(kind);
      const existing = track.keyframes.find((keyframe) => Math.abs(keyframe.time - time) < 0.001);
      const keyframe = existing ?? createTimelineKeyframe(time, value);
      keyframe.value = value;
      if (!existing) track.keyframes.push(keyframe);
      sortTimelineKeyframes(track);
      sceneTimeline.currentTime = time;
      rebuildTimelineRuntime();
      timelinePlayer.setTime(sceneTimeline.currentTime);
      applyLightTimeline();
      if (options.refresh !== false) updateAllUI();
      if (options.select !== false) timelinePanel.selectKeyframes([keyframe.id]);
      if (options.notify !== false) showToast(`${lightTrackLabel(kind)} keyframe set at ${formatNumber(time)}s`, "good");
      return;
    }

    const entry = selectedEntry();
    if (!entry) {
      if (options.notify !== false) showToast("Select an object before adding a keyframe.", "bad");
      return;
    }
    const objectTimeline = ensureObjectTimeline(sceneTimeline, entry.id);
    const currentTrack = objectTimeline.tracks.find((candidate) => candidate.kind === kind);
    if (!assertTimelineTrackUnlocked(currentTrack, "setting a keyframe")) return;
    if (options.record !== false) recordHistory();
    const track = ensureTimelineTrack(objectTimeline, kind);
    const value = timelineValueForEntry(entry, kind);
    const existing = track.keyframes.find((keyframe) => Math.abs(keyframe.time - time) < 0.001);
    const keyframe = existing ?? createTimelineKeyframe(time, value);
    keyframe.value = value;
    if (!existing) track.keyframes.push(keyframe);
    sortTimelineKeyframes(track);
    if (isObjectTransformTrackKind(kind)) entry.animation = "none";
    sceneTimeline.currentTime = time;
    rebuildTimelineRuntime();
    timelinePlayer.setTime(sceneTimeline.currentTime);
    applyObjectPropertyTimeline();
    if (options.refresh !== false) updateAllUI();
    if (options.select !== false) timelinePanel.selectKeyframes([keyframe.id]);
    if (options.notify !== false) showToast(`${objectTrackLabel(kind)} keyframe set at ${formatNumber(time)}s`, "good");
  }

  function deleteTimelineKeyframes(keyframeIds: string[], options: { notify?: boolean } = {}): void {
    const sources = resolveActiveTimelineKeyframeSources(keyframeIds);
    if (sources.length === 0) {
      showToast("Select a keyframe, or park the playhead on one in the active track.", "bad");
      return;
    }
    if (!assertTimelineSourcesUnlocked(sources, "deleting keyframes")) return;
    recordHistory();
    const ids = new Set(sources.map((source) => source.keyframe.id));
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
    timelinePanel.selectKeyframes([]);
    if (options.notify !== false) showToast(`${ids.size} keyframe${ids.size === 1 ? "" : "s"} deleted`, "good");
  }

  function copyTimelineKeyframes(keyframeIds: string[] = timelinePanel.selectedKeyframeIdsList(), options: { preserveObjectTargets?: boolean } = {}): void {
    const sources = resolveActiveTimelineKeyframeSources(keyframeIds);
    if (sources.length === 0) {
      showToast("Select a keyframe, or park the playhead on one in the active track.", "bad");
      return;
    }

    timelineClipboard = createTimelineClipboard(sources, options);
    showToast(`${sources.length} keyframe${sources.length === 1 ? "" : "s"} copied`, "good");
  }

  function copyVisibleTimelineTimeKeyframes(): void {
    const selectedCount = timelinePanel.selectVisibleRowKeyframesAtCurrentTime();
    if (selectedCount === 0) {
      showToast(`No visible-row keyframes at ${formatNumber(sceneTimeline.currentTime)}s to copy.`, "bad");
      return;
    }
    copyTimelineKeyframes(timelinePanel.selectedKeyframeIdsList(), { preserveObjectTargets: true });
  }

  function cutTimelineKeyframes(keyframeIds: string[] = timelinePanel.selectedKeyframeIdsList(), options: { preserveObjectTargets?: boolean } = {}): void {
    const sources = resolveActiveTimelineKeyframeSources(keyframeIds);
    if (sources.length === 0) {
      showToast("Select a keyframe, or park the playhead on one in the active track.", "bad");
      return;
    }
    if (!assertTimelineSourcesUnlocked(sources, "cutting keyframes")) return;
    timelineClipboard = createTimelineClipboard(sources, options);
    deleteTimelineKeyframes(sources.map((source) => source.keyframe.id), { notify: false });
    showToast(`${sources.length} keyframe${sources.length === 1 ? "" : "s"} cut`, "good");
  }

  function cutVisibleTimelineTimeKeyframes(): void {
    const selectedCount = timelinePanel.selectVisibleRowKeyframesAtCurrentTime();
    if (selectedCount === 0) {
      showToast(`No visible-row keyframes at ${formatNumber(sceneTimeline.currentTime)}s to cut.`, "bad");
      return;
    }
    cutTimelineKeyframes(timelinePanel.selectedKeyframeIdsList(), { preserveObjectTargets: true });
  }

  function pasteTimelineKeyframes(): void {
    if (!timelineClipboard || timelineClipboard.keyframes.length === 0) {
      showToast("Copy timeline keyframes before pasting.", "bad");
      return;
    }

    const baseTime = snapTimelineTime(sceneTimeline, sceneTimeline.currentTime);
    recordHistory();
    const result = pasteTimelineClipboard(sceneTimeline, timelineClipboard, selectedEntry()?.id ?? null, baseTime, {
      validObjectIds: new Set(entries.keys())
    });
    clearPresetAnimationsForTimelineObjects(result.changedTransformObjectIds);

    if (result.pasted === 0) {
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
    timelinePanel.selectKeyframes(result.keyframeIds);
    showToast(`${result.pasted} keyframe${result.pasted === 1 ? "" : "s"} pasted${result.skipped ? `, ${result.skipped} skipped` : ""}`, "good");
  }

  function duplicateTimelineKeyframes(keyframeIds: string[]): void {
    const sources = resolveActiveTimelineKeyframeSources(keyframeIds);
    if (sources.length === 0) {
      showToast("Select a keyframe, or park the playhead on one in the active track.", "bad");
      return;
    }
    if (!assertTimelineSourcesUnlocked(sources, "duplicating keyframes")) return;

    recordHistory();
    const result = duplicateResolvedKeyframes(sceneTimeline, sources);
    clearPresetAnimationsForTimelineObjects(result.changedTransformObjectIds);

    if (result.created === 0) {
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
    timelinePanel.selectKeyframes(result.keyframeIds);
    showToast(`${result.created} keyframe${result.created === 1 ? "" : "s"} duplicated`, "good");
  }

  function duplicateVisibleTimelineTimeKeyframes(): void {
    const selectedCount = timelinePanel.selectVisibleRowKeyframesAtCurrentTime();
    if (selectedCount === 0) {
      showToast(`No visible-row keyframes at ${formatNumber(sceneTimeline.currentTime)}s to duplicate.`, "bad");
      return;
    }
    duplicateTimelineKeyframes(timelinePanel.selectedKeyframeIdsList());
  }

  function deleteVisibleTimelineTimeKeyframes(): void {
    const selectedCount = timelinePanel.selectVisibleRowKeyframesAtCurrentTime();
    if (selectedCount === 0) {
      showToast(`No visible-row keyframes at ${formatNumber(sceneTimeline.currentTime)}s to delete.`, "bad");
      return;
    }
    deleteTimelineKeyframes(timelinePanel.selectedKeyframeIdsList());
  }

  function nudgeTimelineKeyframes(direction: -1 | 1, keyframeIds: string[] = timelinePanel.selectedKeyframeIdsList()): void {
    const sources = resolveActiveTimelineKeyframeSources(keyframeIds);
    if (sources.length === 0) {
      showToast("Select a keyframe, or park the playhead on one in the active track.", "bad");
      return;
    }
    if (!assertTimelineSourcesUnlocked(sources, "nudging keyframes")) return;

    recordHistory();
    const result = nudgeResolvedKeyframes(sceneTimeline, sources, direction);
    if (result.nudged === 0) {
      showToast("No room to nudge selected keyframes.", "bad");
      return;
    }

    clearPresetAnimationsForTimelineObjects(result.changedTransformObjectIds);
    sceneTimeline.currentTime = clamp(result.currentTime, 0, sceneTimeline.duration);
    rebuildTimelineRuntime();
    timelinePlayer.setTime(sceneTimeline.currentTime);
    applyCameraTimeline();
    applyLightTimeline();
    applyObjectPropertyTimeline();
    updateAllUI();
    showToast(`${result.nudged} keyframe${result.nudged === 1 ? "" : "s"} nudged ${direction > 0 ? "right" : "left"}${result.skipped ? `, ${result.skipped} skipped` : ""}`, "good");
  }

  function finishTimelineKeyframeEdit(
    sources: TimelineKeyframeSource[],
    result: EditTimelineResult,
    noChangeMessage: string | ((result: EditTimelineResult) => string),
    successMessage: string | ((result: EditTimelineResult) => string)
  ): boolean {
    if (result.edited === 0) {
      updateAllUI();
      showToast(typeof noChangeMessage === "function" ? noChangeMessage(result) : noChangeMessage, "bad");
      return false;
    }

    clearPresetAnimationsForTimelineObjects(result.changedTransformObjectIds);
    sceneTimeline.currentTime = clamp(result.currentTime, 0, sceneTimeline.duration);
    rebuildTimelineRuntime();
    timelinePlayer.setTime(sceneTimeline.currentTime);
    applyCameraTimeline();
    applyLightTimeline();
    applyObjectPropertyTimeline();
    updateAllUI();
    timelinePanel.selectKeyframes(sources.map((source) => source.keyframe.id));
    showToast(typeof successMessage === "function" ? successMessage(result) : successMessage, "good");
    return true;
  }

  function moveTimelineKeyframesToPlayhead(keyframeIds: string[] = timelinePanel.selectedKeyframeIdsList()): void {
    const sources = resolveActiveTimelineKeyframeSources(keyframeIds);
    if (keyframeIds.length === 0 || sources.length === 0) {
      showToast("Select keyframes before moving them to the playhead.", "bad");
      return;
    }
    if (!assertTimelineSourcesUnlocked(sources, "moving keyframes")) return;

    const playheadTime = sceneTimeline.currentTime;
    recordHistory();
    const result = moveResolvedKeyframesToTime(sceneTimeline, sources, playheadTime);
    finishTimelineKeyframeEdit(
      sources,
      result,
      "No keyframe timing changed.",
      (editResult) => `${editResult.edited} keyframe${editResult.edited === 1 ? "" : "s"} moved to ${formatNumber(playheadTime)}s${editResult.skipped ? `, ${editResult.skipped} skipped` : ""}`
    );
  }

  function centerTimelineKeyframesOnPlayhead(keyframeIds: string[] = timelinePanel.selectedKeyframeIdsList()): void {
    const sources = resolveActiveTimelineKeyframeSources(keyframeIds);
    if (keyframeIds.length === 0 || sources.length === 0) {
      showToast("Select keyframes before centering them on the playhead.", "bad");
      return;
    }
    if (!assertTimelineSourcesUnlocked(sources, "centering keyframes")) return;

    const playheadTime = sceneTimeline.currentTime;
    recordHistory();
    const result = centerResolvedKeyframesOnTime(sceneTimeline, sources, playheadTime);
    finishTimelineKeyframeEdit(
      sources,
      result,
      "No keyframe timing changed.",
      (editResult) => `${editResult.edited} keyframe${editResult.edited === 1 ? "" : "s"} centered on ${formatNumber(playheadTime)}s${editResult.skipped ? `, ${editResult.skipped} skipped` : ""}`
    );
  }

  function roveTimelineKeyframesAcrossTime(keyframeIds: string[] = timelinePanel.selectedKeyframeIdsList()): void {
    const sources = resolveActiveTimelineKeyframeSources(keyframeIds);
    if (keyframeIds.length < 3 || sources.length < 3) {
      showToast("Select at least three keyframes before roving timing.", "bad");
      return;
    }
    if (!assertTimelineSourcesUnlocked(sources, "roving keyframes")) return;

    recordHistory();
    const result = roveResolvedKeyframesAcrossTime(sceneTimeline, sources);
    finishTimelineKeyframeEdit(
      sources,
      result,
      (editResult) => editResult.skipped ? `No keyframe roved, ${editResult.skipped} skipped.` : "Selected keyframes are already evenly roved.",
      (editResult) => `${editResult.edited} keyframe${editResult.edited === 1 ? "" : "s"} roved across time${editResult.skipped ? `, ${editResult.skipped} skipped` : ""}`
    );
  }

  function reverseTimelineKeyframes(keyframeIds: string[] = timelinePanel.selectedKeyframeIdsList()): void {
    const sources = resolveActiveTimelineKeyframeSources(keyframeIds);
    if (keyframeIds.length < 2 || sources.length < 2) {
      showToast("Select at least two keyframes before reversing timing.", "bad");
      return;
    }
    if (!assertTimelineSourcesUnlocked(sources, "reversing keyframes")) return;

    recordHistory();
    const result = reverseResolvedKeyframes(sceneTimeline, sources);
    finishTimelineKeyframeEdit(
      sources,
      result,
      "No keyframe timing changed.",
      (editResult) => `${editResult.edited} keyframe${editResult.edited === 1 ? "" : "s"} time-reversed${editResult.skipped ? `, ${editResult.skipped} skipped` : ""}`
    );
  }

  function snapTimelineKeyframesToFrames(keyframeIds: string[] = timelinePanel.selectedKeyframeIdsList()): void {
    const sources = resolveActiveTimelineKeyframeSources(keyframeIds);
    if (keyframeIds.length === 0 || sources.length === 0) {
      showToast("Select keyframes before snapping them to frames.", "bad");
      return;
    }
    if (!assertTimelineSourcesUnlocked(sources, "snapping keyframes")) return;

    recordHistory();
    const result = snapResolvedKeyframesToFrames(sceneTimeline, sources);
    finishTimelineKeyframeEdit(
      sources,
      result,
      (editResult) => editResult.skipped ? `No keyframe snapped, ${editResult.skipped} skipped.` : "Selected keyframes are already on frames.",
      (editResult) => `${editResult.edited} keyframe${editResult.edited === 1 ? "" : "s"} snapped to frames${editResult.skipped ? `, ${editResult.skipped} skipped` : ""}`
    );
  }

  function distributeTimelineKeyframes(keyframeIds: string[] = timelinePanel.selectedKeyframeIdsList()): void {
    const sources = resolveActiveTimelineKeyframeSources(keyframeIds);
    if (keyframeIds.length < 2 || sources.length < 2) {
      showToast("Select at least two keyframes before distributing timing.", "bad");
      return;
    }
    if (!assertTimelineSourcesUnlocked(sources, "distributing keyframes")) return;

    recordHistory();
    const result = distributeResolvedKeyframesAcrossRange(sceneTimeline, sources, sceneTimeline.workStart, sceneTimeline.workEnd);
    finishTimelineKeyframeEdit(
      sources,
      result,
      (editResult) => editResult.skipped ? `No keyframe distributed, ${editResult.skipped} skipped.` : "Selected keyframes already match the work area spacing.",
      (editResult) => `${editResult.edited} keyframe${editResult.edited === 1 ? "" : "s"} distributed across Work In/Out${editResult.skipped ? `, ${editResult.skipped} skipped` : ""}`
    );
  }

  function fitTimelineKeyframesToWorkArea(keyframeIds: string[] = timelinePanel.selectedKeyframeIdsList()): void {
    const sources = resolveActiveTimelineKeyframeSources(keyframeIds);
    if (keyframeIds.length < 2 || sources.length < 2) {
      showToast("Select at least two keyframes before fitting timing.", "bad");
      return;
    }
    if (!assertTimelineSourcesUnlocked(sources, "fitting keyframes")) return;

    recordHistory();
    const result = fitResolvedKeyframesToRange(sceneTimeline, sources, sceneTimeline.workStart, sceneTimeline.workEnd);
    finishTimelineKeyframeEdit(
      sources,
      result,
      (editResult) => editResult.skipped ? `No keyframe fitted, ${editResult.skipped} skipped.` : "Selected keyframes already fit Work In/Out.",
      (editResult) => `${editResult.edited} keyframe${editResult.edited === 1 ? "" : "s"} fitted to Work In/Out${editResult.skipped ? `, ${editResult.skipped} skipped` : ""}`
    );
  }

  function staggerTimelineKeyframesFromPlayhead(keyframeIds: string[] = timelinePanel.selectedKeyframeIdsList()): void {
    const sources = resolveActiveTimelineKeyframeSources(keyframeIds);
    if (keyframeIds.length < 2 || sources.length < 2) {
      showToast("Select at least two keyframes before staggering timing.", "bad");
      return;
    }
    if (!assertTimelineSourcesUnlocked(sources, "staggering keyframes")) return;

    const step = Math.max(sceneTimeline.snapEnabled ? sceneTimeline.snapStep : 1 / sceneTimeline.fps, 0.001);
    const playheadTime = sceneTimeline.currentTime;
    recordHistory();
    const result = staggerResolvedKeyframesFromTime(sceneTimeline, sources, playheadTime, step);
    finishTimelineKeyframeEdit(
      sources,
      result,
      (editResult) => editResult.skipped ? `No keyframe staggered, ${editResult.skipped} skipped.` : "Selected keyframes are already staggered from the playhead.",
      (editResult) => `${editResult.edited} keyframe${editResult.edited === 1 ? "" : "s"} staggered from ${formatNumber(playheadTime)}s${editResult.skipped ? `, ${editResult.skipped} skipped` : ""}`
    );
  }

  function cascadeTimelineKeyframesFromPlayhead(keyframeIds: string[] = timelinePanel.selectedKeyframeIdsList()): void {
    const sources = resolveActiveTimelineKeyframeSources(keyframeIds);
    if (keyframeIds.length < 2 || sources.length < 2) {
      showToast("Select at least two keyframes before cascading timing.", "bad");
      return;
    }
    if (!assertTimelineSourcesUnlocked(sources, "cascading keyframes")) return;

    const step = Math.max(sceneTimeline.snapEnabled ? sceneTimeline.snapStep : 1 / sceneTimeline.fps, 0.001);
    const playheadTime = sceneTimeline.currentTime;
    recordHistory();
    const result = cascadeResolvedKeyframesByTargetFromTime(sceneTimeline, sources, playheadTime, step);
    finishTimelineKeyframeEdit(
      sources,
      result,
      (editResult) => editResult.skipped ? `No keyframe cascaded, ${editResult.skipped} skipped.` : "Selected keyframes already cascade from the playhead.",
      (editResult) => `${editResult.edited} keyframe${editResult.edited === 1 ? "" : "s"} cascaded from ${formatNumber(playheadTime)}s${editResult.skipped ? `, ${editResult.skipped} skipped` : ""}`
    );
  }

  function editTimelineKeyframes(keyframeIds: string[], patch: TimelineKeyframeEditPatch): void {
    const sources = resolveActiveTimelineKeyframeSources(keyframeIds);
    if (sources.length === 0) {
      showToast("Select a keyframe, or park the playhead on one in the active track.", "bad");
      return;
    }
    if (!assertTimelineSourcesUnlocked(sources, "editing keyframes")) return;

    recordHistory();
    const result = editResolvedKeyframes(sceneTimeline, sources, patch);
    finishTimelineKeyframeEdit(
      sources,
      result,
      "No keyframe value changed.",
      (editResult) => `${editResult.edited} keyframe${editResult.edited === 1 ? "" : "s"} edited${editResult.skipped ? `, ${editResult.skipped} skipped` : ""}`
    );
  }

  function addTimelineMarker(label: string, color?: string): void {
    const time = snapTimelineTime(sceneTimeline, sceneTimeline.currentTime);
    const existing = timelineMarkerAt(time);
    const markerLabel = label.trim() || existing?.label || `Marker ${sceneTimeline.markers.length + 1}`;
    const nextColor = normalizeMarkerColor(color) ?? existing?.color ?? markerColor(sceneTimeline.markers.length);
    recordHistory();
    if (existing) {
      existing.label = markerLabel.slice(0, 48);
      existing.color = nextColor;
      sceneTimeline.currentTime = existing.time;
      showToast(`Marker updated: ${existing.label}`, "good");
    } else {
      const marker = createTimelineMarker(time, markerLabel.slice(0, 48), nextColor);
      sceneTimeline.markers.push(marker);
      sortTimelineMarkers(sceneTimeline);
      sceneTimeline.currentTime = marker.time;
      showToast(`Marker added: ${marker.label}`, "good");
    }
    timelinePlayer.setTime(sceneTimeline.currentTime);
    updateAllUI();
  }

  function deleteTimelineMarker(markerId: string | null): void {
    const marker = markerId
      ? sceneTimeline.markers.find((candidate) => candidate.id === markerId)
      : timelineMarkerAt(sceneTimeline.currentTime);
    if (!marker) {
      showToast("Move to a marker before deleting it.", "bad");
      return;
    }
    recordHistory();
    sceneTimeline.markers = sceneTimeline.markers.filter((candidate) => candidate.id !== marker.id);
    updateAllUI();
    showToast(`Marker deleted: ${marker.label}`, "good");
  }

  function renameTimelineMarker(markerId: string, label: string): void {
    const marker = sceneTimeline.markers.find((candidate) => candidate.id === markerId);
    const nextLabel = label.trim().slice(0, 48);
    if (!marker || !nextLabel || nextLabel === marker.label) return;
    recordHistory();
    marker.label = nextLabel;
    updateAllUI();
    showToast(`Marker renamed: ${marker.label}`, "good");
  }

  function setTimelineMarkerColor(markerId: string, color: string): void {
    const marker = sceneTimeline.markers.find((candidate) => candidate.id === markerId);
    const nextColor = normalizeMarkerColor(color);
    if (!marker || !nextColor || nextColor === marker.color) return;
    recordHistory();
    marker.color = nextColor;
    updateAllUI();
    showToast(`Marker color updated: ${marker.label}`, "good");
  }

  function stepTimelineMarker(direction: -1 | 1): void {
    if (sceneTimeline.markers.length === 0) {
      showToast("No timeline markers to navigate.", "bad");
      return;
    }
    const current = sceneTimeline.currentTime;
    const epsilon = 0.001;
    const target = direction > 0
      ? sceneTimeline.markers.find((marker) => marker.time > current + epsilon)
      : [...sceneTimeline.markers].reverse().find((marker) => marker.time < current - epsilon);
    if (!target) {
      showToast(direction > 0 ? "No later marker." : "No earlier marker.", "bad");
      return;
    }
    setTimelineTime(target.time);
    showToast(`Marker: ${target.label}`, "good");
  }

  function setTimelineInterpolation(keyframeIds: string[], interpolation: TimelineInterpolation): void {
    const sources = resolveInterpolationTimelineKeyframeSources(keyframeIds);
    if (sources.length === 0) {
      showToast("Select a keyframe, or park the playhead on one in the active track.", "bad");
      return;
    }
    if (!assertTimelineSourcesUnlocked(sources, "changing interpolation")) return;

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
    showToast(`${timelineInterpolationLabel(interpolation)} interpolation applied`, "good");
  }

  function interpolationFromF9Shortcut(event: KeyboardEvent): TimelineInterpolation {
    if ((event.ctrlKey || event.metaKey) && event.shiftKey) return "easeOut";
    if (event.ctrlKey || event.metaKey) return "easeIn";
    if (event.shiftKey) return "linear";
    if (event.altKey) return "hold";
    return "smooth";
  }

  function timelineInterpolationLabel(interpolation: TimelineInterpolation): string {
    if (interpolation === "easeIn") return "Ease In";
    if (interpolation === "easeOut") return "Ease Out";
    if (interpolation === "smooth") return "Easy Ease";
    return capitalize(interpolation);
  }

  function resolveInterpolationTimelineKeyframeSources(keyframeIds: string[]) {
    if (keyframeIds.length > 0) return resolveActiveTimelineKeyframeSources(keyframeIds);
    return resolveActiveTimelineKeyframeSources([]);
  }

  function clearTimelineTrack(kind: TimelineTrackKind): void {
    if (isCameraTrackKind(kind)) {
      const track = sceneTimeline.camera.tracks.find((candidate) => candidate.kind === kind);
      if (!track || track.keyframes.length === 0) {
        showToast(`${cameraTrackLabel(kind)} track has no keyframes.`, "bad");
        return;
      }
      if (!assertTimelineTrackUnlocked(track, "clearing it")) return;
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
      if (!assertTimelineTrackUnlocked(track, "clearing it")) return;
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
    if (!assertTimelineTrackUnlocked(track, "clearing it")) return;
    recordHistory();
    objectTimeline.tracks = objectTimeline.tracks.filter((candidate) => candidate.kind !== kind);
    pruneEmptyTimelineTracks(sceneTimeline);
    rebuildTimelineRuntime();
    timelinePlayer.setTime(sceneTimeline.currentTime);
    applyObjectPropertyTimeline();
    updateAllUI();
    showToast(`${objectTrackLabel(kind)} track cleared`, "good");
  }

  function toggleTimelineTrack(kind: TimelineTrackKind, targetId?: string): void {
    const track = activeTimelineTrack(kind, targetId);
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

  function toggleTimelineTrackLock(kind: TimelineTrackKind, targetId?: string): void {
    const track = activeTimelineTrack(kind, targetId);
    if (!track || track.keyframes.length === 0) {
      showToast("Add keyframes to the active track before locking it.", "bad");
      return;
    }

    recordHistory();
    track.locked = !track.locked;
    updateAllUI();
    showToast(`${track.label} track ${track.locked ? "locked" : "unlocked"}`, "good");
  }

  function toggleTimelineTrackSolo(kind: TimelineTrackKind, targetId?: string): void {
    const track = activeTimelineTrack(kind, targetId);
    if (!track || track.keyframes.length === 0) {
      showToast("Add keyframes to the active track before soloing it.", "bad");
      return;
    }

    recordHistory();
    track.solo = !track.solo;
    rebuildTimelineRuntime();
    timelinePlayer.setTime(sceneTimeline.currentTime);
    applyCameraTimeline();
    applyLightTimeline();
    applyObjectPropertyTimeline();
    updateAllUI();
    showToast(`${track.label} track ${track.solo ? "soloed" : "unsoloed"}`, "good");
  }

  function selectTimelineTrackLabel(targetId: string, _kind: TimelineTrackKind): void {
    if (entries.has(targetId)) {
      setSelected(targetId);
      return;
    }
    updateAllUI();
  }

  function activeTimelineTrack(kind: TimelineTrackKind, targetId?: string): TimelineTrackDocument | null {
    if (isCameraTrackKind(kind)) {
      return sceneTimeline.camera.tracks.find((candidate) => candidate.kind === kind) ?? null;
    }
    if (isLightTrackKind(kind)) {
      return sceneTimeline.lights.tracks.find((candidate) => candidate.kind === kind) ?? null;
    }
    const objectId = targetId && entries.has(targetId) ? targetId : selectedEntry()?.id;
    const objectTimeline = objectId ? sceneTimeline.objects.find((candidate) => candidate.objectId === objectId) : null;
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

  function stepVisibleTimelineKeyframe(direction: -1 | 1): void {
    const times = timelinePanel.visibleRowKeyframeTimes();
    if (times.length === 0) {
      showToast("No visible-row keyframes to navigate.", "bad");
      return;
    }

    const current = sceneTimeline.currentTime;
    const epsilon = 0.001;
    const target = direction > 0
      ? times.find((time) => time > current + epsilon)
      : [...times].reverse().find((time) => time < current - epsilon);
    if (target === undefined) {
      showToast(direction > 0 ? "No later visible-row keyframe." : "No earlier visible-row keyframe.", "bad");
      return;
    }

    setTimelineTime(target);
    showToast(`Jumped to visible-row keyframe at ${formatNumber(target)}s`, "good");
  }

  function stepSelectedTimelineKeyBoundary(direction: -1 | 1): void {
    const sources = resolveActiveTimelineKeyframeSources(timelinePanel.selectedKeyframeIdsList());
    if (sources.length === 0) {
      showToast("Select timeline keyframes before jumping to a selection boundary.", "bad");
      return;
    }
    const times = sources.map((source) => source.keyframe.time);
    const target = direction > 0 ? Math.max(...times) : Math.min(...times);
    setTimelineTime(target);
    showToast(direction > 0 ? "Jumped to last selected keyframe." : "Jumped to first selected keyframe.", "good");
  }

  function stepTimelineFrame(direction: -1 | 1): void {
    const step = 1 / Math.max(sceneTimeline.fps, 1);
    setTimelineTime(sceneTimeline.currentTime + direction * step);
  }

  function beginTimelineDrag(): void {
    if (!pendingTimelineDragSnapshot) pendingTimelineDragSnapshot = snapshot();
  }

  function moveTimelineKeyframe(keyframeId: string, time: number): void {
    const match = findTimelineKeyframe(keyframeId);
    if (!match) return;
    if (match.track.locked) return;
    if (!pendingTimelineDragSnapshot) pendingTimelineDragSnapshot = snapshot();
    match.keyframe.time = snapTimelineTime(sceneTimeline, clamp(time, 0, sceneTimeline.duration));
    sortTimelineKeyframes(match.track);
    rebuildTimelineRuntime();
    timelinePlayer.setTime(sceneTimeline.currentTime);
    applyCameraTimeline();
    applyLightTimeline();
    applyObjectPropertyTimeline();
    if (hasTimelineTracks(sceneTimeline)) syncTransformUI();
    syncMotionPath();
  }

  function moveTimelineKeyframeValue(keyframeId: string, axis: "x" | "y" | "z", value: number): void {
    const match = findTimelineKeyframe(keyframeId);
    if (!match || !Number.isFinite(value)) return;
    if (match.track.locked) return;
    if (!pendingTimelineDragSnapshot) pendingTimelineDragSnapshot = snapshot();
    const axisIndex = axis === "x" ? 0 : axis === "y" ? 1 : 2;
    match.keyframe.value[axisIndex] = value;
    if (match.objectId && isObjectTransformTrackKind(match.track.kind)) clearPresetAnimationsForTimelineObjects([match.objectId]);
    rebuildTimelineRuntime();
    timelinePlayer.setTime(sceneTimeline.currentTime);
    applyCameraTimeline();
    applyLightTimeline();
    applyObjectPropertyTimeline();
    if (hasTimelineTracks(sceneTimeline)) syncTransformUI();
    syncMotionPath();
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

  function findTimelineKeyframe(keyframeId: string): { keyframe: TimelineKeyframeDocument; track: TimelineTrackDocument; objectId: string | null } | null {
    for (const track of sceneTimeline.camera.tracks) {
      const keyframe = track.keyframes.find((candidate) => candidate.id === keyframeId);
      if (keyframe) return { keyframe, track, objectId: null };
    }
    for (const track of sceneTimeline.lights.tracks) {
      const keyframe = track.keyframes.find((candidate) => candidate.id === keyframeId);
      if (keyframe) return { keyframe, track, objectId: null };
    }
    for (const objectTimeline of sceneTimeline.objects) {
      for (const track of objectTimeline.tracks) {
        const keyframe = track.keyframes.find((candidate) => candidate.id === keyframeId);
        if (keyframe) return { keyframe, track, objectId: objectTimeline.objectId };
      }
    }
    return null;
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
    const soloActive = hasSoloTimelineTracks(sceneTimeline);
    let projectionChanged = false;
    sceneTimeline.camera.tracks.forEach((track) => {
      if (!isTimelineTrackRuntimeActive(track, soloActive)) return;
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
    const soloActive = hasSoloTimelineTracks(sceneTimeline);
    sceneTimeline.lights.tracks.forEach((track) => {
      if (!isTimelineTrackRuntimeActive(track, soloActive)) return;
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
    const soloActive = hasSoloTimelineTracks(sceneTimeline);
    sceneTimeline.objects.forEach((objectTimeline) => {
      const entry = entries.get(objectTimeline.objectId);
      if (!entry) return;
      let appearanceChanged = false;
      let textureChanged = false;
      objectTimeline.tracks.forEach((track) => {
        if (!isObjectPropertyTrackKind(track.kind)) return;
        if (!isTimelineTrackRuntimeActive(track, soloActive)) return;
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

  function resolveActiveTimelineKeyframeSources(keyframeIds: string[]) {
    return resolveTimelineKeyframeSources(sceneTimeline, keyframeIds, {
      selectedTrackKind: timelinePanel.selectedTrackKind(),
      selectedObjectId: entries.has(selectedId) ? selectedId : null,
      currentTime: sceneTimeline.currentTime
    });
  }

  function clearPresetAnimationsForTimelineObjects(objectIds: string[]): void {
    objectIds.forEach((objectId) => {
      const entry = entries.get(objectId);
      if (entry) entry.animation = "none";
    });
  }

  function timelineMarkerAt(time: number) {
    return sceneTimeline.markers.find((marker) => Math.abs(marker.time - time) < 0.001) ?? null;
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

  function trackKindForTransformMode(): TransformProperty {
    const mode = transformControls.getMode();
    if (mode === "rotate") return "rotation";
    if (mode === "scale") return "scale";
    return "position";
  }

  function lightForTrackKind(kind: TimelineTrackKind): THREE.DirectionalLight | THREE.PointLight | THREE.SpotLight | null {
    if (kind.startsWith("directional")) return lightRig.directional;
    if (kind.startsWith("point")) return lightRig.point;
    if (kind.startsWith("spot")) return lightRig.spot;
    return null;
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
    const workStart = clamp(sceneTimeline.workStart, 0, sceneTimeline.duration);
    const workEnd = clamp(sceneTimeline.workEnd, workStart + 0.001, sceneTimeline.duration);
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
    previewRecordingRange = { start: workStart, end: workEnd };
    updateRecordingButton();
    setTimelineTime(workStart);
    transport.set(true, 1, 1);
    timelinePanel.update(sceneTimeline, entries.values(), selectedId, transport.playing);
    updatePlayButton();
    previewRecorder.start(250);
    showToast("Recording work area to WebM", "good");
  }

  function stopPreviewRecording(manual: boolean): void {
    if (!recordingPreview && !previewRecorder) return;
    recordingPreview = false;
    previewRecordingRange = null;
    if (manual) {
      transport.pause();
      timelinePanel.update(sceneTimeline, entries.values(), selectedId, transport.playing);
      updatePlayButton();
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
    const files = Array.from(event.dataTransfer?.files ?? []);
    const file = files[0];
    if (!file) return;
    if (files.some(isModelFile)) void importModelFiles(files);
    else if (file.type.startsWith("image/")) void importTextureFile(file);
    else showToast("Drop a model file or image texture.", "bad");
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

    if (transport.playing) {
      const playbackDelta = transport.playbackDelta(delta);
      advanceTimeline(playbackDelta);
      entries.forEach((entry) => {
        if (!hasObjectTransformTimelineTracks(sceneTimeline, entry.id)) updateEntryAnimation(entry, playbackDelta, elapsed);
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
      ["Tone", toneMappingLabel(renderSettings.toneMapping)],
      ["Exposure", formatNumber(renderSettings.exposure)],
      ["Shadow", shadowQualityLabel(renderSettings.shadowQuality)],
      ["Environment", environmentPreset(renderSettings.environment).label],
      ["Post", postProcessingLabel(renderSettings.postProcessing)],
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
    query<HTMLDivElement>("#status-line").textContent = recordingPreview ? recordingStatusLabel() : transport.statusLabel();
    const label = transport.buttonLabel();
    const iconName = transport.iconName();
    const button = query<HTMLButtonElement>("#play-toggle");
    button.innerHTML = `<span data-icon="${iconName}"></span><span>${label}</span>`;
    hydrateIcons(button);
    const timelineButton = query<HTMLButtonElement>("#timeline-play-toggle");
    timelineButton.innerHTML = `<span data-icon="${iconName}"></span><span>${label}</span>`;
    hydrateIcons(timelineButton);
    if (recordingPreview) updateRecordingButton();
  }

  function updateRecordingButton(): void {
    const button = query<HTMLButtonElement>("#record-video-btn");
    button.classList.toggle("strong", recordingPreview);
    button.innerHTML = `<span data-icon="${recordingPreview ? "Square" : "Video"}"></span><span>${recordingPreview ? `Stop ${recordingProgressPercent()}%` : "Record WebM"}</span>`;
    hydrateIcons(button);
  }

  function recordingProgressPercent(): number {
    const range = previewRecordingRange ?? { start: sceneTimeline.workStart, end: sceneTimeline.workEnd };
    const span = Math.max(range.end - range.start, 0.001);
    return Math.round(clamp((sceneTimeline.currentTime - range.start) / span, 0, 1) * 100);
  }

  function recordingStatusLabel(): string {
    const range = previewRecordingRange ?? { start: sceneTimeline.workStart, end: sceneTimeline.workEnd };
    const elapsed = clamp(sceneTimeline.currentTime - range.start, 0, Math.max(range.end - range.start, 0));
    return `Recording WebM ${recordingProgressPercent()}% | ${formatNumber(elapsed)}s / ${formatNumber(Math.max(range.end - range.start, 0))}s`;
  }

  function serializeObjectForDuplicate(entry: SceneEntry): SerializedObject {
    return {
      id: entry.id,
      name: entry.name,
      kind: entry.kind,
      type: entry.type,
      renderMode: entry.renderMode,
      materialMode: entry.materialMode,
      useSourceMaterials: entry.useSourceMaterials,
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

function markerColor(index: number): string {
  const colors = ["#f4ad2f", "#df6b80", "#4f8df7", "#20bfa9", "#7c70f4"];
  return colors[index % colors.length];
}

function normalizeMarkerColor(value: string | undefined): string | null {
  if (!value) return null;
  return /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : null;
}

function numericObjectId(id: string): number {
  const match = id.match(/^object-(\d+)$/);
  return match ? Number(match[1]) : 0;
}

function isModelFile(file: File): boolean {
  return /\.(glb|gltf|obj|stl)$/i.test(file.name);
}
