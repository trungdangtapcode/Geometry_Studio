import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { cleanFileName } from "../utils/dom";
import { normalizedGeometry } from "./primitives";

export interface ImportedModel {
  name: string;
  object: THREE.Object3D;
}

export interface ImportProgress {
  label: string;
  loaded: number;
  total: number;
  ratio: number;
}

export async function loadModelFromFile(file: File, onProgress: (progress: ImportProgress) => void): Promise<ImportedModel> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !["glb", "gltf", "obj", "stl"].includes(extension)) {
    throw new Error("Unsupported model type. Please use GLB, GLTF, OBJ, or STL.");
  }
  if (file.size > 80 * 1024 * 1024) {
    throw new Error("Model is larger than 80 MB. Use a smaller or optimized model for the browser demo.");
  }

  const manager = new THREE.LoadingManager();
  manager.onProgress = (url, loaded, total) => {
    onProgress({
      label: url.split("/").pop() ?? file.name,
      loaded,
      total,
      ratio: total > 0 ? loaded / total : 0.5
    });
  };

  const url = URL.createObjectURL(file);
  try {
    let object: THREE.Object3D;
    if (extension === "glb" || extension === "gltf") {
      object = await new Promise<THREE.Object3D>((resolve, reject) => {
        new GLTFLoader(manager).load(url, (gltf) => resolve(gltf.scene), progressEvent(file.name, onProgress), reject);
      });
    } else if (extension === "obj") {
      object = await new Promise<THREE.Object3D>((resolve, reject) => {
        new OBJLoader(manager).load(url, resolve, progressEvent(file.name, onProgress), reject);
      });
    } else {
      const geometry = await new Promise<THREE.BufferGeometry>((resolve, reject) => {
        new STLLoader(manager).load(url, resolve, progressEvent(file.name, onProgress), reject);
      });
      object = new THREE.Mesh(normalizedGeometry(geometry), new THREE.MeshStandardMaterial({ color: "#d8dadf", roughness: 0.45 }));
    }
    onProgress({ label: file.name, loaded: file.size, total: file.size, ratio: 1 });
    return { name: cleanFileName(file.name), object: normalizeImportedObject(object) };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function normalizeImportedObject(object: THREE.Object3D): THREE.Object3D {
  const wrapper = new THREE.Group();
  wrapper.add(object);
  object.traverse((node) => {
    if ((node as THREE.Mesh).isMesh) {
      const mesh = node as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
  });
  wrapper.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(wrapper);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxSize = Math.max(size.x, size.y, size.z) || 1;
  const scale = 3.6 / maxSize;
  object.scale.multiplyScalar(scale);
  wrapper.updateMatrixWorld(true);
  const scaledBox = new THREE.Box3().setFromObject(wrapper);
  const scaledCenter = new THREE.Vector3();
  scaledBox.getCenter(scaledCenter);
  object.position.x -= scaledCenter.x;
  object.position.y -= scaledBox.min.y;
  object.position.z -= scaledCenter.z;
  return wrapper;
}

function progressEvent(fileName: string, onProgress: (progress: ImportProgress) => void): (event: ProgressEvent) => void {
  return (event) => {
    onProgress({
      label: fileName,
      loaded: event.loaded,
      total: event.total,
      ratio: event.total > 0 ? event.loaded / event.total : 0.5
    });
  };
}
