import * as THREE from "three";
import type { SceneEntry } from "../editor/types";
import type { ResourceTracker } from "../utils/resourceTracker";
import { cloneReadableSourceMaterial, cloneToonSourceMaterial, createToonMaterial, createToonOutlineMesh } from "./stylizedMaterials";

export function createMaterial(entry: SceneEntry, tracker?: ResourceTracker): THREE.Material {
  const materialParams: THREE.MeshBasicMaterialParameters = {
    color: entry.color,
    side: THREE.DoubleSide,
    transparent: entry.opacity < 1,
    opacity: entry.opacity
  };

  syncTextureTransform(entry);
  if (entry.texture) materialParams.map = entry.texture;

  if (entry.materialMode === "normal") {
    const params = { side: THREE.DoubleSide, transparent: entry.opacity < 1, opacity: entry.opacity };
    return tracker?.track(new THREE.MeshNormalMaterial(params)) ?? new THREE.MeshNormalMaterial(params);
  }
  if (entry.materialMode === "toon") {
    return createToonMaterial(entry, tracker);
  }
  if (entry.materialMode === "basic") {
    return tracker?.track(new THREE.MeshBasicMaterial(materialParams)) ?? new THREE.MeshBasicMaterial(materialParams);
  }
  if (entry.materialMode === "phong") {
    const params: THREE.MeshPhongMaterialParameters = { ...materialParams, shininess: 70 };
    return tracker?.track(new THREE.MeshPhongMaterial(params)) ?? new THREE.MeshPhongMaterial(params);
  }
  if (entry.materialMode === "lambert") {
    return tracker?.track(new THREE.MeshLambertMaterial(materialParams)) ?? new THREE.MeshLambertMaterial(materialParams);
  }
  const material = new THREE.MeshStandardMaterial({
    ...materialParams,
    roughness: entry.roughness,
    metalness: entry.metalness
  });
  return tracker?.track(material) ?? material;
}

export function buildGeometryVisual(entry: SceneEntry, tracker?: ResourceTracker): THREE.Object3D {
  const geometry = tracker?.track(entry.sourceGeometry!.clone()) ?? entry.sourceGeometry!.clone();
  geometry.computeVertexNormals();

  if (entry.renderMode === "points") {
    const material = tracker?.track(new THREE.PointsMaterial({
      color: entry.color,
      size: 0.08,
      sizeAttenuation: true,
      transparent: entry.opacity < 1,
      opacity: entry.opacity
    })) ?? new THREE.PointsMaterial({ color: entry.color, size: 0.08, sizeAttenuation: true, transparent: entry.opacity < 1, opacity: entry.opacity });
    return new THREE.Points(geometry, material);
  }

  if (entry.renderMode === "lines") {
    const wireGeometry = tracker?.track(new THREE.WireframeGeometry(geometry)) ?? new THREE.WireframeGeometry(geometry);
    const material = tracker?.track(new THREE.LineBasicMaterial({
      color: entry.color,
      transparent: true,
      opacity: entry.opacity * 0.95
    })) ?? new THREE.LineBasicMaterial({ color: entry.color, transparent: true, opacity: entry.opacity * 0.95 });
    return new THREE.LineSegments(wireGeometry, material);
  }

  const mesh = new THREE.Mesh(geometry, createMaterial(entry, tracker));
  if (entry.materialMode !== "toon") return mesh;
  const group = new THREE.Group();
  group.add(createToonOutlineMesh(geometry, tracker), mesh);
  return group;
}

export function buildModelVisual(entry: SceneEntry, tracker?: ResourceTracker): THREE.Object3D {
  const clone = entry.sourceObject!.clone(true);

  clone.traverse((object) => {
    if (!(object as THREE.Mesh).isMesh) return;
    const mesh = object as THREE.Mesh;
    mesh.geometry = tracker?.track(mesh.geometry.clone()) ?? mesh.geometry.clone();
    if (entry.renderMode === "solid") {
      mesh.material = modelSolidMaterial(mesh.material, entry, tracker);
      if (entry.materialMode === "toon") mesh.add(createToonOutlineMesh(mesh.geometry, tracker));
      return;
    }

    mesh.visible = false;
    if (entry.renderMode === "lines") {
      const wireGeometry = tracker?.track(new THREE.WireframeGeometry(mesh.geometry)) ?? new THREE.WireframeGeometry(mesh.geometry);
      const lineMaterial = tracker?.track(new THREE.LineBasicMaterial({ color: entry.color, transparent: entry.opacity < 1, opacity: entry.opacity })) ??
        new THREE.LineBasicMaterial({ color: entry.color, transparent: entry.opacity < 1, opacity: entry.opacity });
      mesh.add(new THREE.LineSegments(wireGeometry, lineMaterial));
    } else {
      const pointGeometry = tracker?.track(mesh.geometry.clone()) ?? mesh.geometry.clone();
      const pointMaterial = tracker?.track(new THREE.PointsMaterial({
        color: entry.color,
        size: 0.06,
        transparent: entry.opacity < 1,
        opacity: entry.opacity
      })) ?? new THREE.PointsMaterial({ color: entry.color, size: 0.06, transparent: entry.opacity < 1, opacity: entry.opacity });
      mesh.add(new THREE.Points(pointGeometry, pointMaterial));
    }
  });

  return clone;
}

function modelSolidMaterial(
  material: THREE.Material | THREE.Material[] | undefined,
  entry: SceneEntry,
  tracker?: ResourceTracker
): THREE.Material | THREE.Material[] {
  if (entry.materialMode === "toon") {
    return material
      ? mapSourceMaterials(material, (item) => cloneToonSourceMaterial(item, entry, tracker))
      : createToonMaterial(entry, tracker);
  }
  if (entry.useSourceMaterials && material) {
    return mapSourceMaterials(material, (item) => cloneReadableSourceMaterial(item, tracker));
  }
  return createMaterial(entry, tracker);
}

function mapSourceMaterials(
  material: THREE.Material | THREE.Material[],
  mapper: (material: THREE.Material) => THREE.Material
): THREE.Material | THREE.Material[] {
  return Array.isArray(material)
    ? material.map((item) => mapper(item))
    : mapper(material);
}

export function makeTexturePreset(name: string): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas textures are unavailable.");

  if (name === "checker") {
    drawCheckerTexture(ctx, canvas.width);
  } else if (name === "uv") {
    drawUvTexture(ctx, canvas.width);
  } else if (name === "bricks") {
    drawBrickTexture(ctx, canvas.width);
  } else if (name === "wood") {
    drawWoodTexture(ctx, canvas.width);
  } else if (name === "carbon") {
    drawCarbonTexture(ctx, canvas.width);
  } else if (name === "blueprint") {
    drawBlueprintTexture(ctx, canvas.width);
  } else if (name === "halftone") {
    drawHalftoneTexture(ctx, canvas.width);
  } else {
    drawGridTexture(ctx, canvas.width);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

function drawCheckerTexture(ctx: CanvasRenderingContext2D, size: number): void {
  const cells = 8;
  const cellSize = size / cells;
  for (let y = 0; y < cells; y += 1) {
    for (let x = 0; x < cells; x += 1) {
      ctx.fillStyle = (x + y) % 2 === 0 ? "#f9fafb" : "#273036";
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }
}

function drawUvTexture(ctx: CanvasRenderingContext2D, size: number): void {
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "#7c70f4");
  gradient.addColorStop(0.45, "#20bfa9");
  gradient.addColorStop(1, "#f7bd4b");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 4;
  for (let i = 0; i <= size; i += 64) {
    line(ctx, i, 0, i, size);
    line(ctx, 0, i, size, i);
  }
  ctx.fillStyle = "rgba(17,24,39,0.82)";
  ctx.font = "bold 72px Inter, sans-serif";
  ctx.fillText("UV", 190, 280);
}

function drawGridTexture(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.fillStyle = "#eef2f4";
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "#2fb6c3";
  ctx.lineWidth = 2;
  for (let i = 0; i <= size; i += 32) {
    line(ctx, i, 0, i, size);
    line(ctx, 0, i, size, i);
  }
  ctx.strokeStyle = "#df6b80";
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, size - 8, size - 8);
}

function drawBrickTexture(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.fillStyle = "#7a2f27";
  ctx.fillRect(0, 0, size, size);
  const brickW = 128;
  const brickH = 64;
  for (let y = 0; y < size + brickH; y += brickH) {
    const offset = (y / brickH) % 2 === 0 ? 0 : -brickW / 2;
    for (let x = offset; x < size + brickW; x += brickW) {
      const hue = 36 + ((x + y) % 5) * 3;
      ctx.fillStyle = `hsl(${hue} 58% ${34 + ((x + y) % 4) * 3}%)`;
      ctx.fillRect(x + 4, y + 4, brickW - 8, brickH - 8);
    }
  }
  ctx.strokeStyle = "#d8c3ac";
  ctx.lineWidth = 5;
  for (let y = 0; y <= size; y += brickH) line(ctx, 0, y, size, y);
}

function drawWoodTexture(ctx: CanvasRenderingContext2D, size: number): void {
  const gradient = ctx.createLinearGradient(0, 0, size, 0);
  gradient.addColorStop(0, "#8f5a2c");
  gradient.addColorStop(0.48, "#d09a52");
  gradient.addColorStop(1, "#6f411f");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 18) {
    const wobble = Math.sin(y * 0.045) * 20;
    ctx.strokeStyle = y % 36 === 0 ? "rgba(61,34,16,0.44)" : "rgba(255,231,176,0.28)";
    ctx.lineWidth = y % 36 === 0 ? 4 : 2;
    ctx.beginPath();
    for (let x = 0; x <= size; x += 20) {
      const yy = y + Math.sin(x * 0.04 + y * 0.02) * 8 + wobble * Math.sin(x * 0.01);
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(61,34,16,0.34)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(332, 250, 74, 32, -0.18, 0, Math.PI * 2);
  ctx.stroke();
}

function drawCarbonTexture(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.fillStyle = "#161b20";
  ctx.fillRect(0, 0, size, size);
  const tile = 32;
  for (let y = -tile; y < size + tile; y += tile) {
    for (let x = -tile; x < size + tile; x += tile) {
      ctx.fillStyle = (x / tile + y / tile) % 2 === 0 ? "#2c333a" : "#0f1418";
      ctx.save();
      ctx.translate(x + tile / 2, y + tile / 2);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-tile * 0.65, -tile * 0.18, tile * 1.3, tile * 0.36);
      ctx.restore();
    }
  }
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= size; i += tile) {
    line(ctx, i, 0, i, size);
    line(ctx, 0, i, size, i);
  }
}

function drawBlueprintTexture(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.fillStyle = "#173d78";
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(190,230,255,0.28)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= size; i += 16) {
    line(ctx, i, 0, i, size);
    line(ctx, 0, i, size, i);
  }
  ctx.strokeStyle = "rgba(238,249,255,0.68)";
  ctx.lineWidth = 3;
  for (let i = 0; i <= size; i += 64) {
    line(ctx, i, 0, i, size);
    line(ctx, 0, i, size, i);
  }
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 5;
  ctx.strokeRect(82, 118, 338, 248);
  line(ctx, 82, 118, 420, 366);
  line(ctx, 420, 118, 82, 366);
}

function drawHalftoneTexture(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.fillStyle = "#fff7df";
  ctx.fillRect(0, 0, size, size);
  for (let y = 18; y < size; y += 30) {
    for (let x = 18; x < size; x += 30) {
      const radius = 4 + ((x + y) % 90) / 12;
      ctx.fillStyle = (x + y) % 60 === 0 ? "#df6b80" : "#1f252b";
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.strokeStyle = "#1f252b";
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, size - 20, size - 20);
}

function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

export function syncTextureTransform(entry: SceneEntry): void {
  if (!entry.texture) return;
  entry.texture.wrapS = THREE.RepeatWrapping;
  entry.texture.wrapT = THREE.RepeatWrapping;
  entry.texture.repeat.copy(entry.textureRepeat);
  entry.texture.offset.copy(entry.textureOffset);
  entry.texture.center.set(0.5, 0.5);
  entry.texture.rotation = entry.textureRotation;
  entry.texture.colorSpace = THREE.SRGBColorSpace;
  entry.texture.needsUpdate = true;
}
