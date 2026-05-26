import * as THREE from "three";
import type { LightKind, LightRig, SceneEntry, StageRig } from "../editor/types";

export function createStage(): StageRig {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 120),
    new THREE.ShadowMaterial({ color: "#1f2529", opacity: 0.2 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  ground.name = "Shadow Ground";

  const grid = new THREE.GridHelper(40, 40, "#6a737d", "#c3c9cf");
  grid.position.y = 0.01;
  grid.name = "Grid";

  const axes = new THREE.AxesHelper(4);
  axes.position.y = 0.03;
  axes.name = "Axes";

  return { ground, grid, axes };
}

export function createLights(scene: THREE.Scene): LightRig {
  const ambient = new THREE.AmbientLight("#ffffff", 0.45);
  const directional = new THREE.DirectionalLight("#fff8e8", 4);
  directional.position.set(6, 9, 5);
  directional.castShadow = true;
  directional.shadow.mapSize.set(2048, 2048);
  directional.shadow.camera.near = 0.5;
  directional.shadow.camera.far = 60;
  directional.shadow.camera.left = -18;
  directional.shadow.camera.right = 18;
  directional.shadow.camera.top = 18;
  directional.shadow.camera.bottom = -18;

  const point = new THREE.PointLight("#fff1c7", 4, 50);
  point.position.set(-4, 5.5, 4);
  point.castShadow = true;
  point.shadow.mapSize.set(1024, 1024);

  const spot = new THREE.SpotLight("#ffffff", 5, 45, Math.PI / 5, 0.45, 1.2);
  spot.position.set(4, 7, 4);
  spot.target.position.set(0, 0, 0);
  spot.castShadow = true;
  spot.shadow.mapSize.set(1024, 1024);

  const directionalHelper = new THREE.DirectionalLightHelper(directional, 1.2);
  const pointHelper = new THREE.PointLightHelper(point, 0.45);
  const spotHelper = new THREE.SpotLightHelper(spot);
  pointHelper.visible = false;
  spotHelper.visible = false;

  scene.add(ambient, directional, point, spot, spot.target, directionalHelper, pointHelper, spotHelper);
  return {
    ambient,
    directional,
    point,
    spot,
    directionalHelper,
    pointHelper,
    spotHelper,
    active: "directional",
    helpers: true,
    shadows: true,
    sweep: false
  };
}

export function currentLight(lightRig: LightRig): THREE.DirectionalLight | THREE.PointLight | THREE.SpotLight {
  return lightRig[lightRig.active];
}

export function setActiveLight(lightRig: LightRig, kind: LightKind): void {
  lightRig.active = kind;
  syncLightHelpers(lightRig);
}

export function syncLights(lightRig: LightRig, entries: Iterable<SceneEntry>): void {
  lightRig.directional.castShadow = lightRig.shadows;
  lightRig.point.castShadow = lightRig.shadows;
  lightRig.spot.castShadow = lightRig.shadows;
  for (const entry of entries) setEntryShadow(entry, lightRig.shadows);
  syncLightHelpers(lightRig);
}

export function syncLightHelpers(lightRig: LightRig): void {
  lightRig.directionalHelper.visible = lightRig.helpers && lightRig.active === "directional";
  lightRig.pointHelper.visible = lightRig.helpers && lightRig.active === "point";
  lightRig.spotHelper.visible = lightRig.helpers && lightRig.active === "spot";
  lightRig.directionalHelper.update();
  lightRig.pointHelper.update();
  lightRig.spotHelper.update();
}

export function updateLightSweep(lightRig: LightRig, elapsed: number): void {
  const radius = 7;
  lightRig.point.position.set(Math.cos(elapsed * 0.8) * radius, 5.5 + Math.sin(elapsed * 1.3), Math.sin(elapsed * 0.8) * radius);
  lightRig.spot.position.copy(lightRig.point.position);
  lightRig.directional.position.set(Math.cos(elapsed * 0.45) * 8, 10, Math.sin(elapsed * 0.45) * 8);
  syncLightHelpers(lightRig);
}

export function setEntryShadow(entry: SceneEntry, enabled: boolean): void {
  entry.root.traverse((object) => {
    if ((object as THREE.Mesh).isMesh) {
      const mesh = object as THREE.Mesh;
      mesh.castShadow = enabled;
      mesh.receiveShadow = enabled;
    }
  });
}
