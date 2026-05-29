import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import type { EnvironmentPresetId, RenderSettings } from "../editor/types";

export interface EnvironmentPreset {
  id: EnvironmentPresetId;
  label: string;
  background: string;
  fogNear: number;
  fogFar: number;
  intensity: number;
  rotationY: number;
}

export interface EnvironmentController {
  apply: (settings: RenderSettings) => void;
  dispose: () => void;
}

const ENVIRONMENT_PRESETS: Record<EnvironmentPresetId, EnvironmentPreset> = {
  off: {
    id: "off",
    label: "Off",
    background: "#e9edf0",
    fogNear: 28,
    fogFar: 90,
    intensity: 0,
    rotationY: 0
  },
  studio: {
    id: "studio",
    label: "Studio",
    background: "#e9edf0",
    fogNear: 28,
    fogFar: 90,
    intensity: 0.9,
    rotationY: 0
  },
  gallery: {
    id: "gallery",
    label: "Gallery",
    background: "#f4f5f2",
    fogNear: 34,
    fogFar: 110,
    intensity: 1.25,
    rotationY: 0.35
  },
  warm: {
    id: "warm",
    label: "Warm Studio",
    background: "#f1ede5",
    fogNear: 30,
    fogFar: 96,
    intensity: 1,
    rotationY: 0.9
  },
  cool: {
    id: "cool",
    label: "Cool Lab",
    background: "#e6edf4",
    fogNear: 30,
    fogFar: 100,
    intensity: 1.08,
    rotationY: -0.75
  }
};

export function createEnvironmentController(renderer: THREE.WebGLRenderer, scene: THREE.Scene): EnvironmentController {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const roomEnvironment = new RoomEnvironment();
  const roomTarget = pmrem.fromScene(roomEnvironment, 0.04);
  roomEnvironment.dispose();
  pmrem.dispose();

  return {
    apply(settings) {
      const preset = environmentPreset(settings.environment);
      scene.background = new THREE.Color(preset.background);
      scene.fog = new THREE.Fog(preset.background, preset.fogNear, preset.fogFar);
      scene.environment = preset.id === "off" ? null : roomTarget.texture;
      scene.environmentIntensity = preset.intensity;
      scene.environmentRotation.set(0, preset.rotationY, 0);
    },
    dispose() {
      roomTarget.dispose();
    }
  };
}

export function environmentPreset(id: EnvironmentPresetId): EnvironmentPreset {
  return ENVIRONMENT_PRESETS[id] ?? ENVIRONMENT_PRESETS.studio;
}

export function isEnvironmentPreset(value: unknown): value is EnvironmentPresetId {
  return value === "off" || value === "studio" || value === "gallery" || value === "warm" || value === "cool";
}
