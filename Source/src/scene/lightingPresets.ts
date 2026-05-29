import * as THREE from "three";
import type { LightKind, LightRig } from "../editor/types";
import { syncLightHelpers } from "./lights";

export type LightingPresetId = "studio" | "product" | "dramatic" | "soft" | "night";

export interface LightingPreset {
  id: LightingPresetId;
  label: string;
  active: LightKind;
  shadows: boolean;
  ambientIntensity: number;
  directional: PresetLight;
  point: PresetLight;
  spot: PresetLight;
}

interface PresetLight {
  color: string;
  intensity: number;
  position: [number, number, number];
}

const LIGHTING_PRESETS: LightingPreset[] = [
  {
    id: "studio",
    label: "Studio",
    active: "directional",
    shadows: true,
    ambientIntensity: 0.45,
    directional: { color: "#fff8e8", intensity: 4, position: [6, 9, 5] },
    point: { color: "#fff1c7", intensity: 4, position: [-4, 5.5, 4] },
    spot: { color: "#ffffff", intensity: 5, position: [4, 7, 4] }
  },
  {
    id: "product",
    label: "Product",
    active: "directional",
    shadows: true,
    ambientIntensity: 0.32,
    directional: { color: "#ffffff", intensity: 5.4, position: [5, 8, 6] },
    point: { color: "#cfe8ff", intensity: 2.4, position: [-5.5, 4.5, 3] },
    spot: { color: "#fff1d2", intensity: 7.2, position: [2.5, 6.5, -5] }
  },
  {
    id: "dramatic",
    label: "Dramatic",
    active: "spot",
    shadows: true,
    ambientIntensity: 0.18,
    directional: { color: "#ffdeb2", intensity: 3.2, position: [7, 8, 2] },
    point: { color: "#7db2ff", intensity: 1.4, position: [-6, 3.5, 5] },
    spot: { color: "#fff3dc", intensity: 9.5, position: [2, 8, -4.5] }
  },
  {
    id: "soft",
    label: "Soft",
    active: "point",
    shadows: true,
    ambientIntensity: 0.86,
    directional: { color: "#fffaf2", intensity: 2.1, position: [4, 10, 6] },
    point: { color: "#e9f6ff", intensity: 2.8, position: [-4, 5, 4] },
    spot: { color: "#ffffff", intensity: 2.2, position: [5, 7, -3] }
  },
  {
    id: "night",
    label: "Night",
    active: "point",
    shadows: true,
    ambientIntensity: 0.12,
    directional: { color: "#a8c7ff", intensity: 1.3, position: [-5, 7, -4] },
    point: { color: "#45d7ff", intensity: 5.8, position: [-3, 4, 4.5] },
    spot: { color: "#ffd9a2", intensity: 4.4, position: [4.5, 5.5, 2] }
  }
];

export function lightingPresetById(id: string): LightingPreset | null {
  return LIGHTING_PRESETS.find((preset) => preset.id === id) ?? null;
}

export function applyLightingPreset(lightRig: LightRig, preset: LightingPreset): void {
  lightRig.ambient.intensity = preset.ambientIntensity;
  applyPresetLight(lightRig.directional, preset.directional);
  applyPresetLight(lightRig.point, preset.point);
  applyPresetLight(lightRig.spot, preset.spot);
  lightRig.spot.target.position.set(0, 0, 0);
  lightRig.active = preset.active;
  lightRig.shadows = preset.shadows;
  lightRig.sweep = false;
  syncLightHelpers(lightRig);
}

export function lightRigMatchesPreset(lightRig: LightRig, preset: LightingPreset): boolean {
  return (
    lightRig.active === preset.active &&
    lightRig.shadows === preset.shadows &&
    close(lightRig.ambient.intensity, preset.ambientIntensity) &&
    lightMatchesPreset(lightRig.directional, preset.directional) &&
    lightMatchesPreset(lightRig.point, preset.point) &&
    lightMatchesPreset(lightRig.spot, preset.spot)
  );
}

function applyPresetLight(light: THREE.DirectionalLight | THREE.PointLight | THREE.SpotLight, preset: PresetLight): void {
  light.color.set(preset.color);
  light.intensity = preset.intensity;
  light.position.fromArray(preset.position);
}

function lightMatchesPreset(light: THREE.DirectionalLight | THREE.PointLight | THREE.SpotLight, preset: PresetLight): boolean {
  const presetPosition = new THREE.Vector3().fromArray(preset.position);
  return (
    `#${light.color.getHexString()}` === preset.color &&
    close(light.intensity, preset.intensity) &&
    light.position.distanceTo(presetPosition) < 0.001
  );
}

function close(left: number, right: number): boolean {
  return Math.abs(left - right) < 0.001;
}
