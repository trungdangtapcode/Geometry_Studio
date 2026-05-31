import * as THREE from "three";
import type { SceneEntry, SerializedObject } from "../editor/types";

export function canParentEntry(entry: SceneEntry, parent: SceneEntry | null, entries: ReadonlyMap<string, SceneEntry>): boolean {
  if (!parent) return true;
  if (entry.id === parent.id) return false;

  let current: SceneEntry | undefined = parent;
  const visited = new Set<string>();
  while (current?.parentId) {
    if (current.parentId === entry.id) return false;
    if (visited.has(current.parentId)) return false;
    visited.add(current.parentId);
    current = entries.get(current.parentId);
  }
  return true;
}

export function setEntryParentPreserveWorld(
  entry: SceneEntry,
  parent: SceneEntry | null,
  scene: THREE.Scene,
  entries: ReadonlyMap<string, SceneEntry>
): boolean {
  if (!canParentEntry(entry, parent, entries)) return false;
  const nextParentId = parent?.id ?? null;
  if (entry.parentId === nextParentId) return true;

  scene.updateMatrixWorld(true);
  entry.root.updateMatrixWorld(true);
  if (parent) {
    parent.root.updateMatrixWorld(true);
    parent.root.attach(entry.root);
  } else {
    scene.attach(entry.root);
  }
  entry.parentId = nextParentId;
  entry.basePosition.copy(entry.root.position);
  entry.baseScale.copy(entry.root.scale);
  return true;
}

export function attachEntryToStoredParent(
  entry: SceneEntry,
  parent: SceneEntry,
  entries: ReadonlyMap<string, SceneEntry>
): boolean {
  if (!canParentEntry(entry, parent, entries)) return false;
  parent.root.add(entry.root);
  entry.parentId = parent.id;
  entry.basePosition.copy(entry.root.position);
  entry.baseScale.copy(entry.root.scale);
  return true;
}

export function detachChildrenFromParent(parentId: string, entries: ReadonlyMap<string, SceneEntry>, scene: THREE.Scene): void {
  scene.updateMatrixWorld(true);
  entries.forEach((entry) => {
    if (entry.parentId !== parentId) return;
    scene.attach(entry.root);
    entry.parentId = null;
    entry.basePosition.copy(entry.root.position);
    entry.baseScale.copy(entry.root.scale);
  });
}

export function detachAllParents(entries: ReadonlyMap<string, SceneEntry>, scene: THREE.Scene): void {
  scene.updateMatrixWorld(true);
  entries.forEach((entry) => {
    if (!entry.parentId) return;
    scene.attach(entry.root);
    entry.parentId = null;
  });
}

export function validStoredParentId(object: SerializedObject, objects: SerializedObject[]): string | null {
  const parentId = object.parentId ?? null;
  if (!parentId || parentId === object.id) return null;

  const byId = new Map(objects.map((item) => [item.id, item]));
  let currentId: string | null | undefined = parentId;
  const visited = new Set<string>([object.id]);
  while (currentId) {
    if (visited.has(currentId)) return null;
    visited.add(currentId);
    currentId = byId.get(currentId)?.parentId ?? null;
  }
  return byId.has(parentId) ? parentId : null;
}
