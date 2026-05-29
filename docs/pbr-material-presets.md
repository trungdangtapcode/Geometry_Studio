# PBR Material Presets

## Status

The Render Mode panel now includes evaluator-visible material presets for common
physically based looks. The presets use the existing `MeshStandardMaterial`
workflow where appropriate, so they work with tone mapping, exposure, lights,
shadows, and saved scene JSON.

## Presets

- `Ceramic`: light warm surface, low metalness, medium-low roughness.
- `Metal`: high metalness with low roughness for stronger specular response.
- `Plastic`: saturated color with moderate roughness and almost no metalness.
- `Glass`: transparent blue surface with low roughness.
- `Clay`: matte high-roughness surface for shape inspection.
- `Texture`: switches to Standard material and applies the UV texture preset.
- `Basic`, `Lambert`, and `Phong`: legacy material models retained for course
  comparison.

## Architecture

`scene/materialPresets.ts` stores preset definitions and the small application
helpers. `main.ts` remains responsible for history snapshots, resource disposal,
texture creation, visual rebuilds, and UI refresh.

Texture-changing presets dispose the old texture resource when needed. PBR
presets that specify `textureName: "none"` remove textures so the material
response is easy to inspect.

## Testing

The Playwright core smoke test verifies that Ceramic, Metal, and Glass controls
are reachable. It applies Metal and Glass, then checks that roughness,
metalness, opacity, and active preset state update through the inspector.
