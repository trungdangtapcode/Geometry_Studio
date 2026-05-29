import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { cleanFileName } from "../utils/dom";
import { normalizedGeometry } from "./primitives";

export interface ImportedModel {
  name: string;
  object: THREE.Object3D;
  useSourceMaterials: boolean;
  warnings: string[];
}

export interface ImportProgress {
  label: string;
  loaded: number;
  total: number;
  ratio: number;
}

export async function loadModelFromFile(file: File, onProgress: (progress: ImportProgress) => void): Promise<ImportedModel> {
  return loadModelFromFiles([file], onProgress);
}

export async function loadModelFromFiles(files: File[], onProgress: (progress: ImportProgress) => void): Promise<ImportedModel> {
  const file = primaryModelFile(files);
  const extension = extensionFor(file.name);
  if (!extension || !["glb", "gltf", "obj", "stl"].includes(extension)) {
    throw new Error("Unsupported model type. Please use GLB, GLTF, OBJ, or STL.");
  }
  if (file.size > 80 * 1024 * 1024) {
    throw new Error("Model is larger than 80 MB. Use a smaller or optimized model for the browser demo.");
  }
  const totalSize = files.reduce((sum, item) => sum + item.size, 0);
  if (totalSize > 160 * 1024 * 1024) {
    throw new Error("Import set is larger than 160 MB. Use fewer or optimized model assets.");
  }

  const manager = new THREE.LoadingManager();
  const urls = objectUrlMap(files);
  const urlLabels = new Map(files.map((item) => [urls.get(fileKey(item.name)) ?? "", item.name]));
  manager.setURLModifier((url) => urls.get(fileKey(url)) ?? url);
  manager.onProgress = (url, loaded, total) => {
    onProgress({
      label: urlLabels.get(url) ?? url.split("/").pop() ?? file.name,
      loaded,
      total,
      ratio: total > 0 ? loaded / total : 0.5
    });
  };

  const url = urls.get(fileKey(file.name));
  if (!url) throw new Error("Could not create an import URL.");

  try {
    let object: THREE.Object3D;
    const warnings: string[] = [];
    if (extension === "glb" || extension === "gltf") {
      object = await new Promise<THREE.Object3D>((resolve, reject) => {
        new GLTFLoader(manager).load(url, (gltf) => resolve(gltf.scene), progressEvent(file.name, onProgress), reject);
      });
    } else if (extension === "obj") {
      const loader = new OBJLoader(manager);
      const mtlFile = await matchingMtlFile(files, file);
      if (mtlFile) {
        const materials = new MTLLoader(manager).parse(await mtlFile.text(), "");
        materials.preload();
        loader.setMaterials(materials);
      } else {
        const referenced = await referencedMtlNames(file);
        if (referenced.length > 0) warnings.push(`Missing MTL file: ${referenced.join(", ")}`);
      }
      object = await new Promise<THREE.Object3D>((resolve, reject) => {
        loader.load(url, resolve, progressEvent(file.name, onProgress), reject);
      });
    } else {
      const geometry = await new Promise<THREE.BufferGeometry>((resolve, reject) => {
        new STLLoader(manager).load(url, resolve, progressEvent(file.name, onProgress), reject);
      });
      object = new THREE.Mesh(normalizedGeometry(geometry), new THREE.MeshStandardMaterial({ color: "#d8dadf", roughness: 0.45 }));
    }
    onProgress({ label: file.name, loaded: file.size, total: file.size, ratio: 1 });
    return { name: cleanFileName(file.name), object: normalizeImportedObject(object), useSourceMaterials: extension !== "stl", warnings };
  } finally {
    urls.forEach(revokeObjectUrlLater);
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

function primaryModelFile(files: File[]): File {
  const file = files.find((item) => {
    const extension = extensionFor(item.name);
    return extension === "glb" || extension === "gltf" || extension === "obj" || extension === "stl";
  });
  if (!file) throw new Error("Drop or choose a GLB, GLTF, OBJ, or STL model file.");
  return file;
}

async function matchingMtlFile(files: File[], objFile: File): Promise<File | undefined> {
  const mtlFiles = files.filter((file) => extensionFor(file.name) === "mtl");
  if (mtlFiles.length === 0) return undefined;
  const referenced = await referencedMtlNames(objFile);
  return referenced.length > 0
    ? mtlFiles.find((file) => referenced.includes(fileKey(file.name))) ?? mtlFiles[0]
    : mtlFiles[0];
}

async function referencedMtlNames(file: File): Promise<string[]> {
  const text = await file.text();
  return text
    .split(/\r?\n/)
    .map((line) => line.trim().match(/^mtllib\s+(.+)$/i)?.[1])
    .filter((value): value is string => Boolean(value))
    .flatMap((value) => value.split(/\s+/))
    .map(fileKey);
}

function objectUrlMap(files: File[]): Map<string, string> {
  return new Map(files.map((file) => [fileKey(file.name), URL.createObjectURL(file)]));
}

function revokeObjectUrlLater(url: string): void {
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

function extensionFor(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function fileKey(path: string): string {
  const withoutQuery = path.split(/[?#]/)[0] ?? path;
  const normalized = withoutQuery.replace(/\\/g, "/");
  const baseName = normalized.split("/").pop() ?? normalized;
  try {
    return decodeURIComponent(baseName).toLowerCase();
  } catch {
    return baseName.toLowerCase();
  }
}
