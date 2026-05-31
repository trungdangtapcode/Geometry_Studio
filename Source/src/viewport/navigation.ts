import * as THREE from "three";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";

const ORBIT_POLE_MARGIN = 0.01;

export function configureViewportNavigation(controls: OrbitControls): void {
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = true;
  controls.enableRotate = true;
  controls.enableZoom = true;
  controls.rotateSpeed = 0.9;
  controls.panSpeed = 0.95;
  controls.zoomSpeed = 0.9;
  controls.keyPanSpeed = 10;
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.ROTATE,
    RIGHT: THREE.MOUSE.PAN
  };
  controls.touches = {
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_PAN
  };
  controls.screenSpacePanning = true;
  controls.zoomToCursor = true;
  controls.minPolarAngle = ORBIT_POLE_MARGIN;
  controls.maxPolarAngle = Math.PI - ORBIT_POLE_MARGIN;
  controls.minDistance = 0.6;
  controls.maxDistance = 120;
}

export function syncBlenderNavigationMouseButton(controls: OrbitControls, event: PointerEvent): void {
  if (event.button !== 1) return;
  controls.mouseButtons.MIDDLE = event.ctrlKey ? THREE.MOUSE.DOLLY : THREE.MOUSE.ROTATE;
}

export function resetBlenderNavigationMouseButton(controls: OrbitControls): void {
  controls.mouseButtons.MIDDLE = THREE.MOUSE.ROTATE;
}
