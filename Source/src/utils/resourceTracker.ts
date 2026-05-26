import * as THREE from "three";

export class ResourceTracker {
  private readonly resources = new Set<{ dispose: () => void }>();
  private readonly objectUrls = new Set<string>();

  track<T extends { dispose?: () => void } | null | undefined>(resource: T): T {
    if (resource && typeof resource.dispose === "function") {
      this.resources.add(resource as { dispose: () => void });
    }
    return resource;
  }

  trackUrl(url: string): string {
    this.objectUrls.add(url);
    return url;
  }

  revokeUrl(url: string): void {
    if (this.objectUrls.delete(url)) {
      URL.revokeObjectURL(url);
    }
  }

  disposeResource(resource: { dispose?: () => void } | null | undefined): void {
    if (resource && typeof resource.dispose === "function") {
      resource.dispose();
      this.resources.delete(resource as { dispose: () => void });
    }
  }

  disposeObject(root: THREE.Object3D): void {
    [...root.children].forEach((child) => {
      child.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) this.disposeResource(mesh.geometry);
        const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
        materials.forEach((material) => this.disposeResource(material));
      });
      root.remove(child);
    });
  }

  disposeAll(): void {
    this.resources.forEach((resource) => resource.dispose());
    this.resources.clear();
    this.objectUrls.forEach((url) => URL.revokeObjectURL(url));
    this.objectUrls.clear();
  }
}
