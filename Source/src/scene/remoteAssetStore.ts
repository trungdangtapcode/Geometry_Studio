import { remoteAssetProviderById, type RemoteAssetProviderId } from "./assetProviders";

export type RemoteAssetProvider = "Campus" | "Khronos" | "OS3A";

export interface RemoteAssetItem {
  id: string;
  label: string;
  badge: string;
  description: string;
  providerId: RemoteAssetProviderId;
  provider: RemoteAssetProvider;
  providerLabel: string;
  fileName: string;
  sizeLabel: string;
  license: string;
  attribution: string;
  tags: string[];
  capabilities: {
    pbr?: boolean;
    transmission?: boolean;
    lowPoly?: boolean;
    animation?: boolean;
  };
  previewUrl: string;
  sourceUrl: string;
  downloadUrl: string;
}

const KHRONOS_MODEL_BASE = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models";
const KHRONOS_PROVIDER = remoteAssetProviderById("khronos");
const OS3A_MODEL_BASE = "https://raw.githubusercontent.com/ToxSam/cc0-models-Polygonal-Mind/main/projects";
const OS3A_PROVIDER = remoteAssetProviderById("os3a");
const CAMPUS_ASSET_BASE = "assets/campus";
const CAMPUS_PROVIDER = remoteAssetProviderById("campus");

export const REMOTE_3D_ASSETS: RemoteAssetItem[] = [
  {
    id: "khronos-avocado",
    label: "Avocado",
    badge: "GLB",
    description: "Textured food/product model for lighting, material, and scale checks.",
    providerId: "khronos",
    provider: "Khronos",
    providerLabel: KHRONOS_PROVIDER.label,
    fileName: "Avocado.glb",
    sizeLabel: "7.7 MB",
    license: "CC0 1.0",
    attribution: "Microsoft for Everything",
    tags: ["product", "texture", "pbr"],
    capabilities: { pbr: true },
    previewUrl: `${KHRONOS_MODEL_BASE}/Avocado/screenshot/screenshot.jpg`,
    sourceUrl: "https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Avocado",
    downloadUrl: `${KHRONOS_MODEL_BASE}/Avocado/glTF-Binary/Avocado.glb`
  },
  {
    id: "khronos-boombox",
    label: "Boom Box",
    badge: "GLB",
    description: "Classic PBR sample with strong materials and emissive details.",
    providerId: "khronos",
    provider: "Khronos",
    providerLabel: KHRONOS_PROVIDER.label,
    fileName: "BoomBox.glb",
    sizeLabel: "10.1 MB",
    license: "CC0 1.0",
    attribution: "Microsoft for Everything",
    tags: ["pbr", "emissive", "product"],
    capabilities: { pbr: true },
    previewUrl: `${KHRONOS_MODEL_BASE}/BoomBox/screenshot/screenshot_large.jpg`,
    sourceUrl: "https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/BoomBox",
    downloadUrl: `${KHRONOS_MODEL_BASE}/BoomBox/glTF-Binary/BoomBox.glb`
  },
  {
    id: "khronos-teacup",
    label: "Transmission Teacup",
    badge: "GLB",
    description: "Teacup asset for glass/transmission and shadow readability tests.",
    providerId: "khronos",
    provider: "Khronos",
    providerLabel: KHRONOS_PROVIDER.label,
    fileName: "DiffuseTransmissionTeacup.glb",
    sizeLabel: "4.6 MB",
    license: "CC0 1.0",
    attribution: "Polyhaven.com and Eric Chadwick",
    tags: ["teacup", "glass", "transmission"],
    capabilities: { pbr: true, transmission: true },
    previewUrl: `${KHRONOS_MODEL_BASE}/DiffuseTransmissionTeacup/screenshot/screenshot_Large.jpg`,
    sourceUrl: "https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/DiffuseTransmissionTeacup",
    downloadUrl: `${KHRONOS_MODEL_BASE}/DiffuseTransmissionTeacup/glTF-Binary/DiffuseTransmissionTeacup.glb`
  },
  {
    id: "khronos-lantern",
    label: "Lantern",
    badge: "GLB",
    description: "Detailed prop for shadow, environment, and stylized outline screenshots.",
    providerId: "khronos",
    provider: "Khronos",
    providerLabel: KHRONOS_PROVIDER.label,
    fileName: "Lantern.glb",
    sizeLabel: "9.1 MB",
    license: "CC0 1.0",
    attribution: "Microsoft, sbtron, and Frank Galligan",
    tags: ["prop", "pbr", "lighting"],
    capabilities: { pbr: true },
    previewUrl: `${KHRONOS_MODEL_BASE}/Lantern/screenshot/screenshot.jpg`,
    sourceUrl: "https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Lantern",
    downloadUrl: `${KHRONOS_MODEL_BASE}/Lantern/glTF-Binary/Lantern.glb`
  },
  {
    id: "campus-e-hall",
    label: "Campus E Hall",
    badge: "GLB",
    description: "Optimized copy of the main school campus landscape from the existing campus project.",
    providerId: "campus",
    provider: "Campus",
    providerLabel: CAMPUS_PROVIDER.label,
    fileName: "e-hall.glb",
    sizeLabel: "41.4 MB",
    license: "Local coursework asset",
    attribution: "CS105-Computer_Graphics/project",
    tags: ["campus", "school", "building", "local", "e hall"],
    capabilities: { pbr: true },
    previewUrl: `${CAMPUS_ASSET_BASE}/campus-preview.png`,
    sourceUrl: `${CAMPUS_ASSET_BASE}/README.txt`,
    downloadUrl: `${CAMPUS_ASSET_BASE}/e-hall.glb`
  },
  {
    id: "campus-main-gate",
    label: "Campus Main Gate",
    badge: "GLB",
    description: "Copied campus gate structure for entrance and exterior scene examples.",
    providerId: "campus",
    provider: "Campus",
    providerLabel: CAMPUS_PROVIDER.label,
    fileName: "campus-main-gate-right.glb",
    sizeLabel: "39 MB",
    license: "Local coursework asset",
    attribution: "CS105-Computer_Graphics/project",
    tags: ["campus", "school", "gate", "architecture", "local"],
    capabilities: { pbr: true },
    previewUrl: `${CAMPUS_ASSET_BASE}/campus-preview.png`,
    sourceUrl: `${CAMPUS_ASSET_BASE}/README.txt`,
    downloadUrl: `${CAMPUS_ASSET_BASE}/campus-main-gate-right.glb`
  },
  {
    id: "campus-tree",
    label: "Campus Tree",
    badge: "GLB",
    description: "Copied tree model from the campus project for exterior dressing.",
    providerId: "campus",
    provider: "Campus",
    providerLabel: CAMPUS_PROVIDER.label,
    fileName: "campus-tree-01.glb",
    sizeLabel: "7.7 MB",
    license: "Local coursework asset",
    attribution: "CS105-Computer_Graphics/project",
    tags: ["campus", "tree", "environment", "local"],
    capabilities: { pbr: true },
    previewUrl: `${CAMPUS_ASSET_BASE}/campus-preview.png`,
    sourceUrl: `${CAMPUS_ASSET_BASE}/README.txt`,
    downloadUrl: `${CAMPUS_ASSET_BASE}/campus-tree-01.glb`
  },
  {
    id: "campus-drone",
    label: "Campus Drone",
    badge: "GLB",
    description: "Copied drone character model from the existing campus walkthrough project.",
    providerId: "campus",
    provider: "Campus",
    providerLabel: CAMPUS_PROVIDER.label,
    fileName: "campus-drone.glb",
    sizeLabel: "2.0 MB",
    license: "Local coursework asset",
    attribution: "CS105-Computer_Graphics/project",
    tags: ["campus", "drone", "character", "local"],
    capabilities: { pbr: true },
    previewUrl: `${CAMPUS_ASSET_BASE}/campus-preview.png`,
    sourceUrl: `${CAMPUS_ASSET_BASE}/README.txt`,
    downloadUrl: `${CAMPUS_ASSET_BASE}/campus-drone.glb`
  },
  {
    id: "os3a-momuspark-bench",
    label: "Park Bench",
    badge: "GLB",
    description: "Lightweight CC0 environment prop from the MomusPark collection.",
    providerId: "os3a",
    provider: "OS3A",
    providerLabel: OS3A_PROVIDER.label,
    fileName: "Bench_01_Art.glb",
    sizeLabel: "858 KB",
    license: "CC0 1.0",
    attribution: "Polygonal Mind via OpenSource3DAssets",
    tags: ["cc0", "environment", "park", "prop", "low poly"],
    capabilities: { lowPoly: true },
    previewUrl: `${OS3A_MODEL_BASE}/MomusPark/Bench_01_Art_thumbnail.png`,
    sourceUrl: "https://github.com/ToxSam/cc0-models-Polygonal-Mind/tree/main/projects/MomusPark",
    downloadUrl: `${OS3A_MODEL_BASE}/MomusPark/Bench_01_Art.glb`
  },
  {
    id: "os3a-medieval-barrel",
    label: "Medieval Barrel",
    badge: "GLB",
    description: "Small CC0 prop for scene dressing, shadows, outlines, and material tests.",
    providerId: "os3a",
    provider: "OS3A",
    providerLabel: OS3A_PROVIDER.label,
    fileName: "Barrel.glb",
    sizeLabel: "909 KB",
    license: "CC0 1.0",
    attribution: "Polygonal Mind via OpenSource3DAssets",
    tags: ["cc0", "medieval", "container", "prop", "low poly"],
    capabilities: { lowPoly: true },
    previewUrl: `${OS3A_MODEL_BASE}/medieval-fair/Barrel_thumbnail.png`,
    sourceUrl: "https://github.com/ToxSam/cc0-models-Polygonal-Mind/tree/main/projects/medieval-fair",
    downloadUrl: `${OS3A_MODEL_BASE}/medieval-fair/Barrel.glb`
  },
  {
    id: "os3a-medieval-balloon-red",
    label: "Red Fair Balloon",
    badge: "GLB",
    description: "Compact CC0 color prop for animation/timeline and composition demos.",
    providerId: "os3a",
    provider: "OS3A",
    providerLabel: OS3A_PROVIDER.label,
    fileName: "Balloon_Interactible_Red.glb",
    sizeLabel: "427 KB",
    license: "CC0 1.0",
    attribution: "Polygonal Mind via OpenSource3DAssets",
    tags: ["cc0", "medieval", "fair", "color", "prop"],
    capabilities: { lowPoly: true },
    previewUrl: `${OS3A_MODEL_BASE}/medieval-fair/Balloon_Interactible_Red_thumbnail.png`,
    sourceUrl: "https://github.com/ToxSam/cc0-models-Polygonal-Mind/tree/main/projects/medieval-fair",
    downloadUrl: `${OS3A_MODEL_BASE}/medieval-fair/Balloon_Interactible_Red.glb`
  },
  {
    id: "os3a-momuspark-bush",
    label: "Park Bush",
    badge: "GLB",
    description: "Compact plant prop for building outdoor compositions and toon/shadow tests.",
    providerId: "os3a",
    provider: "OS3A",
    providerLabel: OS3A_PROVIDER.label,
    fileName: "Bush_01_Art.glb",
    sizeLabel: "928 KB",
    license: "CC0 1.0",
    attribution: "Polygonal Mind via OpenSource3DAssets",
    tags: ["cc0", "environment", "park", "plant", "low poly"],
    capabilities: { lowPoly: true },
    previewUrl: `${OS3A_MODEL_BASE}/MomusPark/Bush_01_Art_thumbnail.png`,
    sourceUrl: "https://github.com/ToxSam/cc0-models-Polygonal-Mind/tree/main/projects/MomusPark",
    downloadUrl: `${OS3A_MODEL_BASE}/MomusPark/Bush_01_Art.glb`
  },
  {
    id: "os3a-momuspark-butterfly",
    label: "Butterfly",
    badge: "GLB",
    description: "Small colorful prop for scale, camera framing, and motion-path examples.",
    providerId: "os3a",
    provider: "OS3A",
    providerLabel: OS3A_PROVIDER.label,
    fileName: "Butterfly.glb",
    sizeLabel: "277 KB",
    license: "CC0 1.0",
    attribution: "Polygonal Mind via OpenSource3DAssets",
    tags: ["cc0", "park", "creature", "color", "low poly"],
    capabilities: { lowPoly: true },
    previewUrl: `${OS3A_MODEL_BASE}/MomusPark/Butterfly_thumbnail.png`,
    sourceUrl: "https://github.com/ToxSam/cc0-models-Polygonal-Mind/tree/main/projects/MomusPark",
    downloadUrl: `${OS3A_MODEL_BASE}/MomusPark/Butterfly.glb`
  },
  {
    id: "os3a-momuspark-floating-island",
    label: "Floating Island",
    badge: "GLB",
    description: "Stylized environment base for showcase scenes, shadows, and composition demos.",
    providerId: "os3a",
    provider: "OS3A",
    providerLabel: OS3A_PROVIDER.label,
    fileName: "Floating_Island_01_Art.glb",
    sizeLabel: "1.2 MB",
    license: "CC0 1.0",
    attribution: "Polygonal Mind via OpenSource3DAssets",
    tags: ["cc0", "environment", "island", "park", "low poly"],
    capabilities: { lowPoly: true },
    previewUrl: `${OS3A_MODEL_BASE}/MomusPark/Floating_Island_01_Art_thumbnail.png`,
    sourceUrl: "https://github.com/ToxSam/cc0-models-Polygonal-Mind/tree/main/projects/MomusPark",
    downloadUrl: `${OS3A_MODEL_BASE}/MomusPark/Floating_Island_01_Art.glb`
  },
  {
    id: "os3a-medieval-balloon-yellow",
    label: "Yellow Fair Balloon",
    badge: "GLB",
    description: "Lightweight color prop for duplicate-object and keyframed motion examples.",
    providerId: "os3a",
    provider: "OS3A",
    providerLabel: OS3A_PROVIDER.label,
    fileName: "Balloon_Interactible_Yellow.glb",
    sizeLabel: "427 KB",
    license: "CC0 1.0",
    attribution: "Polygonal Mind via OpenSource3DAssets",
    tags: ["cc0", "medieval", "fair", "color", "prop"],
    capabilities: { lowPoly: true },
    previewUrl: `${OS3A_MODEL_BASE}/medieval-fair/Balloon_Interactible_Yellow_thumbnail.png`,
    sourceUrl: "https://github.com/ToxSam/cc0-models-Polygonal-Mind/tree/main/projects/medieval-fair",
    downloadUrl: `${OS3A_MODEL_BASE}/medieval-fair/Balloon_Interactible_Yellow.glb`
  },
  {
    id: "os3a-medieval-beer",
    label: "Medieval Beer",
    badge: "GLB",
    description: "Small table prop for material, scale, and scene-dressing demonstrations.",
    providerId: "os3a",
    provider: "OS3A",
    providerLabel: OS3A_PROVIDER.label,
    fileName: "Beer.glb",
    sizeLabel: "241 KB",
    license: "CC0 1.0",
    attribution: "Polygonal Mind via OpenSource3DAssets",
    tags: ["cc0", "medieval", "food", "prop", "low poly"],
    capabilities: { lowPoly: true },
    previewUrl: `${OS3A_MODEL_BASE}/medieval-fair/Beer_thumbnail.png`,
    sourceUrl: "https://github.com/ToxSam/cc0-models-Polygonal-Mind/tree/main/projects/medieval-fair",
    downloadUrl: `${OS3A_MODEL_BASE}/medieval-fair/Beer.glb`
  },
  {
    id: "os3a-medieval-food-booth",
    label: "Food Booth",
    badge: "GLB",
    description: "Larger fair prop for scene composition, camera framing, and lighting demos.",
    providerId: "os3a",
    provider: "OS3A",
    providerLabel: OS3A_PROVIDER.label,
    fileName: "Booth_Food01.glb",
    sizeLabel: "3.8 MB",
    license: "CC0 1.0",
    attribution: "Polygonal Mind via OpenSource3DAssets",
    tags: ["cc0", "medieval", "fair", "booth", "environment", "low poly"],
    capabilities: { lowPoly: true },
    previewUrl: `${OS3A_MODEL_BASE}/medieval-fair/Booth_Food01_thumbnail.png`,
    sourceUrl: "https://github.com/ToxSam/cc0-models-Polygonal-Mind/tree/main/projects/medieval-fair",
    downloadUrl: `${OS3A_MODEL_BASE}/medieval-fair/Booth_Food01.glb`
  },
  {
    id: "os3a-medieval-cart",
    label: "Medieval Cart",
    badge: "GLB",
    description: "Scene-dressing vehicle prop for shadows, outlines, and camera navigation demos.",
    providerId: "os3a",
    provider: "OS3A",
    providerLabel: OS3A_PROVIDER.label,
    fileName: "Cart.glb",
    sizeLabel: "914 KB",
    license: "CC0 1.0",
    attribution: "Polygonal Mind via OpenSource3DAssets",
    tags: ["cc0", "medieval", "vehicle", "prop", "low poly"],
    capabilities: { lowPoly: true },
    previewUrl: `${OS3A_MODEL_BASE}/medieval-fair/Cart_thumbnail.png`,
    sourceUrl: "https://github.com/ToxSam/cc0-models-Polygonal-Mind/tree/main/projects/medieval-fair",
    downloadUrl: `${OS3A_MODEL_BASE}/medieval-fair/Cart.glb`
  },
  {
    id: "os3a-transit-platform",
    label: "Transit Platform",
    badge: "GLB",
    description: "Retro transit environment piece for scale and architectural composition tests.",
    providerId: "os3a",
    provider: "OS3A",
    providerLabel: OS3A_PROVIDER.label,
    fileName: "Platform_01_Art.glb",
    sizeLabel: "941 KB",
    license: "CC0 1.0",
    attribution: "Polygonal Mind via OpenSource3DAssets",
    tags: ["cc0", "transit", "architecture", "platform", "low poly"],
    capabilities: { lowPoly: true },
    previewUrl: `${OS3A_MODEL_BASE}/transit/Platform_01_Art_thumbnail.png`,
    sourceUrl: "https://github.com/ToxSam/cc0-models-Polygonal-Mind/tree/main/projects/transit",
    downloadUrl: `${OS3A_MODEL_BASE}/transit/Platform_01_Art.glb`
  },
  {
    id: "os3a-transit-station",
    label: "Transit Tower Station",
    badge: "GLB",
    description: "Large architecture model for camera/frustum, shadow, and composition screenshots.",
    providerId: "os3a",
    provider: "OS3A",
    providerLabel: OS3A_PROVIDER.label,
    fileName: "Tower_Station_01_Art.glb",
    sizeLabel: "8.4 MB",
    license: "CC0 1.0",
    attribution: "Polygonal Mind via OpenSource3DAssets",
    tags: ["cc0", "transit", "architecture", "station", "low poly"],
    capabilities: { lowPoly: true },
    previewUrl: `${OS3A_MODEL_BASE}/transit/Tower_Station_01_Art_thumbnail.png`,
    sourceUrl: "https://github.com/ToxSam/cc0-models-Polygonal-Mind/tree/main/projects/transit",
    downloadUrl: `${OS3A_MODEL_BASE}/transit/Tower_Station_01_Art.glb`
  },
  {
    id: "os3a-transit-plant",
    label: "Transit Plant",
    badge: "GLB",
    description: "Stylized plant prop for environment dressing and outline readability checks.",
    providerId: "os3a",
    provider: "OS3A",
    providerLabel: OS3A_PROVIDER.label,
    fileName: "Plant_01_Art.glb",
    sizeLabel: "2.4 MB",
    license: "CC0 1.0",
    attribution: "Polygonal Mind via OpenSource3DAssets",
    tags: ["cc0", "transit", "plant", "environment", "low poly"],
    capabilities: { lowPoly: true },
    previewUrl: `${OS3A_MODEL_BASE}/transit/Plant_01_Art_thumbnail.png`,
    sourceUrl: "https://github.com/ToxSam/cc0-models-Polygonal-Mind/tree/main/projects/transit",
    downloadUrl: `${OS3A_MODEL_BASE}/transit/Plant_01_Art.glb`
  }
];

export function remoteAssetById(id: string): RemoteAssetItem | null {
  return REMOTE_3D_ASSETS.find((asset) => asset.id === id) ?? null;
}
