import * as THREE from "three";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";

const DEFAULT_CAMERA_TARGET = new THREE.Vector3(0, 1.2, 0);

const CAMERA_PRESET_POSITIONS: Record<string, THREE.Vector3> = {
  front: new THREE.Vector3(0, 3.5, 12),
  top: new THREE.Vector3(0, 14, 0.01),
  iso: new THREE.Vector3(8, 6, 8),
  reset: new THREE.Vector3(7.5, 5.5, 9)
};

export function applyCameraPreset(camera: THREE.PerspectiveCamera, controls: OrbitControls, view: string): void {
  const position = CAMERA_PRESET_POSITIONS[view] ?? CAMERA_PRESET_POSITIONS.reset;
  camera.position.copy(position);
  controls.target.copy(DEFAULT_CAMERA_TARGET);
  camera.lookAt(controls.target);
  controls.update();
}

export function boxForObjects(objects: THREE.Object3D[]): THREE.Box3 | null {
  const box = new THREE.Box3();
  let hasBounds = false;
  objects.forEach((object) => {
    const objectBox = new THREE.Box3().setFromObject(object);
    if (objectBox.isEmpty()) return;
    box.union(objectBox);
    hasBounds = true;
  });
  return hasBounds ? box : null;
}

export function frameCameraToBox(camera: THREE.PerspectiveCamera, controls: OrbitControls, box: THREE.Box3): void {
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const radius = Math.max(sphere.radius, 0.5);
  const direction = new THREE.Vector3().subVectors(camera.position, controls.target);
  if (direction.lengthSq() < 0.0001) direction.set(0.65, 0.45, 0.62);
  direction.normalize();

  const verticalFov = THREE.MathUtils.degToRad(camera.fov);
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * Math.max(camera.aspect, 0.001));
  const fitDistance = Math.max(
    radius / Math.sin(verticalFov / 2),
    radius / Math.sin(horizontalFov / 2)
  ) * 1.18;
  const distanceToTarget = Math.max(controls.minDistance, fitDistance);
  if (distanceToTarget > controls.maxDistance) controls.maxDistance = distanceToTarget * 1.5;

  controls.target.copy(sphere.center);
  camera.position.copy(sphere.center).addScaledVector(direction, distanceToTarget);
  camera.lookAt(controls.target);
  controls.update();
}
