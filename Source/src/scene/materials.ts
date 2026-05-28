import * as THREE from "three";
import type { SceneEntry } from "../editor/types";
import type { ResourceTracker } from "../utils/resourceTracker";

export function createMaterial(entry: SceneEntry, tracker?: ResourceTracker): THREE.Material {
  const materialParams = {
    color: entry.color,
    map: entry.texture ?? undefined,
    side: THREE.DoubleSide,
    transparent: entry.opacity < 1,
    opacity: entry.opacity
  };

  if (entry.texture) {
    entry.texture.wrapS = THREE.RepeatWrapping;
    entry.texture.wrapT = THREE.RepeatWrapping;
    entry.texture.repeat.copy(entry.textureRepeat);
    entry.texture.colorSpace = THREE.SRGBColorSpace;
    entry.texture.needsUpdate = true;
  }

  if (entry.materialMode === "normal") {
    const params = { side: THREE.DoubleSide, transparent: entry.opacity < 1, opacity: entry.opacity };
    return tracker?.track(new THREE.MeshNormalMaterial(params)) ?? new THREE.MeshNormalMaterial(params);
  }
  if (entry.materialMode === "basic") {
    return tracker?.track(new THREE.MeshBasicMaterial(materialParams)) ?? new THREE.MeshBasicMaterial(materialParams);
  }
  if (entry.materialMode === "phong") {
    return tracker?.track(new THREE.MeshPhongMaterial({ ...materialParams, shininess: 70 })) ?? new THREE.MeshPhongMaterial({ ...materialParams, shininess: 70 });
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

  return new THREE.Mesh(geometry, createMaterial(entry, tracker));
}

export function buildModelVisual(entry: SceneEntry, tracker?: ResourceTracker): THREE.Object3D {
  const clone = entry.sourceObject!.clone(true);

  clone.traverse((object) => {
    if (!(object as THREE.Mesh).isMesh) return;
    const mesh = object as THREE.Mesh;
    mesh.geometry = tracker?.track(mesh.geometry.clone()) ?? mesh.geometry.clone();
    if (entry.renderMode === "solid") {
      mesh.material = createMaterial(entry, tracker);
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

export function makeTexturePreset(name: string): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas textures are unavailable.");

  if (name === "checker") {
    const cells = 8;
    const size = canvas.width / cells;
    for (let y = 0; y < cells; y += 1) {
      for (let x = 0; x < cells; x += 1) {
        ctx.fillStyle = (x + y) % 2 === 0 ? "#f9fafb" : "#273036";
        ctx.fillRect(x * size, y * size, size, size);
      }
    }
  } else if (name === "uv") {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#7c70f4");
    gradient.addColorStop(0.45, "#20bfa9");
    gradient.addColorStop(1, "#f7bd4b");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 4;
    for (let i = 0; i <= 512; i += 64) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(17,24,39,0.82)";
    ctx.font = "bold 72px Inter, sans-serif";
    ctx.fillText("UV", 190, 280);
  } else {
    ctx.fillStyle = "#eef2f4";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#2fb6c3";
    ctx.lineWidth = 2;
    for (let i = 0; i <= 512; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }
    ctx.strokeStyle = "#df6b80";
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, 504, 504);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}
