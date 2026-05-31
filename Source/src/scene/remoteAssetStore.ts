export type RemoteAssetProvider = "Khronos";

export interface RemoteAssetItem {
  id: string;
  label: string;
  badge: string;
  description: string;
  provider: RemoteAssetProvider;
  fileName: string;
  sizeLabel: string;
  license: string;
  tags: string[];
  sourceUrl: string;
  downloadUrl: string;
}

const KHRONOS_MODEL_BASE = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models";

export const REMOTE_3D_ASSETS: RemoteAssetItem[] = [
  {
    id: "khronos-avocado",
    label: "Avocado",
    badge: "GLB",
    description: "Textured food/product model for lighting, material, and scale checks.",
    provider: "Khronos",
    fileName: "Avocado.glb",
    sizeLabel: "7.7 MB",
    license: "CC0 1.0",
    tags: ["product", "texture", "pbr"],
    sourceUrl: "https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Avocado",
    downloadUrl: `${KHRONOS_MODEL_BASE}/Avocado/glTF-Binary/Avocado.glb`
  },
  {
    id: "khronos-boombox",
    label: "Boom Box",
    badge: "GLB",
    description: "Classic PBR sample with strong materials and emissive details.",
    provider: "Khronos",
    fileName: "BoomBox.glb",
    sizeLabel: "10.1 MB",
    license: "CC0 1.0",
    tags: ["pbr", "emissive", "product"],
    sourceUrl: "https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/BoomBox",
    downloadUrl: `${KHRONOS_MODEL_BASE}/BoomBox/glTF-Binary/BoomBox.glb`
  },
  {
    id: "khronos-teacup",
    label: "Transmission Teacup",
    badge: "GLB",
    description: "Teacup asset for glass/transmission and shadow readability tests.",
    provider: "Khronos",
    fileName: "DiffuseTransmissionTeacup.glb",
    sizeLabel: "4.6 MB",
    license: "CC0 1.0",
    tags: ["teacup", "glass", "transmission"],
    sourceUrl: "https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/DiffuseTransmissionTeacup",
    downloadUrl: `${KHRONOS_MODEL_BASE}/DiffuseTransmissionTeacup/glTF-Binary/DiffuseTransmissionTeacup.glb`
  },
  {
    id: "khronos-lantern",
    label: "Lantern",
    badge: "GLB",
    description: "Detailed prop for shadow, environment, and stylized outline screenshots.",
    provider: "Khronos",
    fileName: "Lantern.glb",
    sizeLabel: "9.1 MB",
    license: "CC0 1.0",
    tags: ["prop", "pbr", "lighting"],
    sourceUrl: "https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Lantern",
    downloadUrl: `${KHRONOS_MODEL_BASE}/Lantern/glTF-Binary/Lantern.glb`
  }
];

export function remoteAssetById(id: string): RemoteAssetItem | null {
  return REMOTE_3D_ASSETS.find((asset) => asset.id === id) ?? null;
}
