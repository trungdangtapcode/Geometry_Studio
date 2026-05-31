export type RemoteAssetProviderId =
  | "campus"
  | "khronos"
  | "os3a"
  | "smithsonian"
  | "nasa"
  | "polyhaven"
  | "ambientcg"
  | "sketchfab";

export type AssetProviderIntegration = "static-catalog" | "generated-manifest" | "public-api" | "oauth-api" | "external";

export interface RemoteAssetProviderDefinition {
  id: RemoteAssetProviderId;
  label: string;
  shortLabel: string;
  description: string;
  homepageUrl: string;
  integration: AssetProviderIntegration;
  directImport: boolean;
  requiresAuth: boolean;
  licenseSummary: string;
  implementationStatus: "active" | "planned" | "reference";
}

export const REMOTE_ASSET_PROVIDERS: RemoteAssetProviderDefinition[] = [
  {
    id: "campus",
    label: "Local Campus Project",
    shortLabel: "Campus",
    description: "Copied GLB assets from the user's existing school campus scene project.",
    homepageUrl: "assets/campus/README.txt",
    integration: "static-catalog",
    directImport: true,
    requiresAuth: false,
    licenseSummary: "Local coursework project assets copied into this release.",
    implementationStatus: "active"
  },
  {
    id: "khronos",
    label: "Khronos glTF Sample Assets",
    shortLabel: "Khronos",
    description: "Renderer-reference GLB assets for PBR, transmission, animation, and glTF validation demos.",
    homepageUrl: "https://github.com/KhronosGroup/glTF-Sample-Assets",
    integration: "static-catalog",
    directImport: true,
    requiresAuth: false,
    licenseSummary: "Per-model license metadata; current curated entries are license-checked.",
    implementationStatus: "active"
  },
  {
    id: "os3a",
    label: "OpenSource3DAssets / Polygonal Mind",
    shortLabel: "OS3A",
    description: "Lightweight CC0 GLB props with preview images and GitHub-hosted JSON/catalog structure.",
    homepageUrl: "https://github.com/ToxSam/open-source-3D-assets",
    integration: "static-catalog",
    directImport: true,
    requiresAuth: false,
    licenseSummary: "Mostly CC0; keep per-asset source metadata visible.",
    implementationStatus: "active"
  },
  {
    id: "smithsonian",
    label: "Smithsonian Open Access",
    shortLabel: "Smithsonian",
    description: "Educational cultural-history and science models with CC0 open-access records.",
    homepageUrl: "https://3d-api.si.edu/api-docs/",
    integration: "public-api",
    directImport: false,
    requiresAuth: false,
    licenseSummary: "Use only records/files marked CC0 or otherwise clearly reusable.",
    implementationStatus: "planned"
  },
  {
    id: "nasa",
    label: "NASA 3D Resources",
    shortLabel: "NASA",
    description: "Space, rover, satellite, and mission assets for high-impact showcase scenes.",
    homepageUrl: "https://science.nasa.gov/3d-resources/",
    integration: "static-catalog",
    directImport: false,
    requiresAuth: false,
    licenseSummary: "Free to download/use; preserve source links and NASA usage-guideline reference.",
    implementationStatus: "planned"
  },
  {
    id: "polyhaven",
    label: "Poly Haven",
    shortLabel: "Poly Haven",
    description: "CC0 HDRIs, textures, and realistic models; best via generated manifest or proxy.",
    homepageUrl: "https://polyhaven.com",
    integration: "generated-manifest",
    directImport: false,
    requiresAuth: false,
    licenseSummary: "CC0 assets; API usage has separate requirements.",
    implementationStatus: "planned"
  },
  {
    id: "ambientcg",
    label: "ambientCG",
    shortLabel: "ambientCG",
    description: "CC0 material and texture library; better for material/HDRI browsing than model import.",
    homepageUrl: "https://ambientcg.com",
    integration: "public-api",
    directImport: false,
    requiresAuth: false,
    licenseSummary: "CC0 downloadable assets and preview renders.",
    implementationStatus: "planned"
  },
  {
    id: "sketchfab",
    label: "Sketchfab Download API",
    shortLabel: "Sketchfab",
    description: "Large Creative Commons model catalog; direct download requires user OAuth and attribution.",
    homepageUrl: "https://sketchfab.com/developers/download-api",
    integration: "oauth-api",
    directImport: false,
    requiresAuth: true,
    licenseSummary: "Show Creative Commons license and creator attribution for each imported model.",
    implementationStatus: "reference"
  }
];

export function remoteAssetProviderById(id: RemoteAssetProviderId): RemoteAssetProviderDefinition {
  const provider = REMOTE_ASSET_PROVIDERS.find((item) => item.id === id);
  if (provider) return provider;
  const fallback = REMOTE_ASSET_PROVIDERS[0];
  if (!fallback) throw new Error("No remote asset providers are configured.");
  return fallback;
}
