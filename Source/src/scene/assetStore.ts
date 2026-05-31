import type { EnvironmentPresetId, PrimitiveType, RenderMode, RenderToneMappingMode, ShadowQuality } from "../editor/types";
import type { LightingPresetId } from "./lightingPresets";
import type { MaterialPresetId } from "./materialPresets";

export type AssetStoreKind = "material" | "texture" | "primitive" | "model" | "look";
export type TexturePresetId = "none" | "checker" | "uv" | "grid" | "bricks" | "wood" | "carbon" | "blueprint" | "halftone";
export type AssetLookPresetId = "product" | "anime" | "showcase";

export interface AssetStoreItem {
  id: string;
  label: string;
  kind: AssetStoreKind;
  badge: string;
  description: string;
  source: string;
  materialPreset?: MaterialPresetId;
  textureName?: TexturePresetId;
  primitiveType?: PrimitiveType;
  renderMode?: RenderMode;
  color?: string;
  lookPreset?: AssetLookPresetId;
}

export interface AssetLookPreset {
  id: AssetLookPresetId;
  label: string;
  lighting?: LightingPresetId;
  toneMapping?: RenderToneMappingMode;
  exposure?: number;
  shadowQuality?: ShadowQuality;
  environment?: EnvironmentPresetId;
  postProcessing?: {
    fxaa?: boolean;
    dof?: boolean;
    bloom?: boolean;
    bloomStrength?: number;
    bloomRadius?: number;
    bloomThreshold?: number;
    ssao?: boolean;
    ssaoRadius?: number;
    vignette?: boolean;
    vignetteDarkness?: number;
    halftone?: boolean;
    halftoneRadius?: number;
    halftoneScatter?: number;
  };
}

export const ASSET_STORE_ITEMS: AssetStoreItem[] = [
  {
    id: "look-product",
    label: "Product Look",
    kind: "look",
    badge: "Look",
    description: "ACES, ultra shadows, SSAO, and product lighting.",
    source: "Inspired by Poly Haven HDRI/product workflows",
    lookPreset: "product"
  },
  {
    id: "look-anime",
    label: "Anime Look",
    kind: "look",
    badge: "Look",
    description: "Soft light, toon material, outline-friendly comic halftone.",
    source: "Built-in stylized shading",
    materialPreset: "anime",
    lookPreset: "anime"
  },
  {
    id: "look-showcase",
    label: "Showcase Scene",
    kind: "look",
    badge: "Demo",
    description: "Reference-style wire sphere, shadow study, and camera framing.",
    source: "Built-in coursework demo",
    lookPreset: "showcase"
  },
  {
    id: "texture-bricks",
    label: "PBR Bricks",
    kind: "texture",
    badge: "Texture",
    description: "Procedural brick map for clear texture-mapping evidence.",
    source: "ambientCG-style CC0 material pattern",
    textureName: "bricks"
  },
  {
    id: "texture-wood",
    label: "Wood Grain",
    kind: "texture",
    badge: "Texture",
    description: "Warm procedural wood with visible UV direction.",
    source: "ambientCG-style CC0 material pattern",
    textureName: "wood"
  },
  {
    id: "texture-carbon",
    label: "Carbon Fiber",
    kind: "texture",
    badge: "Texture",
    description: "Dark woven technical material for models and drones.",
    source: "Procedural local asset",
    textureName: "carbon"
  },
  {
    id: "texture-blueprint",
    label: "Blueprint Grid",
    kind: "texture",
    badge: "Texture",
    description: "Engineering grid texture for geometry demonstrations.",
    source: "Procedural local asset",
    textureName: "blueprint"
  },
  {
    id: "texture-halftone",
    label: "Comic Dots",
    kind: "texture",
    badge: "Texture",
    description: "Halftone texture that supports comic/anime screenshots.",
    source: "Procedural local asset",
    textureName: "halftone"
  },
  {
    id: "material-glass",
    label: "Glass Material",
    kind: "material",
    badge: "Material",
    description: "Transparent standard material for lighting and shadow tests.",
    source: "Built-in material preset",
    materialPreset: "glass"
  },
  {
    id: "material-metal",
    label: "Brushed Metal",
    kind: "material",
    badge: "Material",
    description: "High-metalness surface for specular highlight grading.",
    source: "Built-in material preset",
    materialPreset: "metal"
  },
  {
    id: "material-anime",
    label: "Anime Toon",
    kind: "material",
    badge: "Material",
    description: "Toon shader with outline mesh for character-like objects.",
    source: "Built-in stylized material",
    materialPreset: "anime"
  },
  {
    id: "primitive-teapot",
    label: "Teapot",
    kind: "primitive",
    badge: "Model",
    description: "Classic geometry benchmark, useful as a cup-like object.",
    source: "Three.js TeapotGeometry",
    primitiveType: "teapot",
    color: "#f2eee6"
  },
  {
    id: "primitive-knot",
    label: "Torus Knot",
    kind: "primitive",
    badge: "Model",
    description: "Complex surface that makes lighting and wireframes obvious.",
    source: "Three.js geometry primitive",
    primitiveType: "torusKnot",
    color: "#20bfa9",
    renderMode: "lines"
  },
  {
    id: "model-drone",
    label: "Sample Drone",
    kind: "model",
    badge: "Model",
    description: "Built-in multi-part model for import/workflow demos.",
    source: "Procedural local model"
  }
];

export const ASSET_LOOK_PRESETS: AssetLookPreset[] = [
  {
    id: "product",
    label: "Product Look",
    lighting: "product",
    toneMapping: "aces",
    exposure: 1.14,
    shadowQuality: "ultra",
    environment: "studio",
    postProcessing: {
      fxaa: true,
      ssao: true,
      ssaoRadius: 7,
      bloom: true,
      bloomStrength: 0.16,
      bloomRadius: 0.25,
      bloomThreshold: 0.84,
      vignette: true,
      vignetteDarkness: 0.42,
      halftone: false,
      dof: false
    }
  },
  {
    id: "anime",
    label: "Anime Look",
    lighting: "soft",
    toneMapping: "aces",
    exposure: 1.08,
    shadowQuality: "high",
    environment: "cool",
    postProcessing: {
      fxaa: true,
      ssao: false,
      bloom: false,
      vignette: true,
      vignetteDarkness: 0.25,
      halftone: true,
      halftoneRadius: 3.2,
      halftoneScatter: 0.18,
      dof: false
    }
  }
];

export function assetStoreItemById(id: string): AssetStoreItem | null {
  return ASSET_STORE_ITEMS.find((item) => item.id === id) ?? null;
}

export function assetLookPresetById(id: AssetLookPresetId): AssetLookPreset | null {
  return ASSET_LOOK_PRESETS.find((preset) => preset.id === id) ?? null;
}
