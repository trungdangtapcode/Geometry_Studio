# UI Density Control

## Goal

The editor supports a professional dense layout for repeated 3D editing work.
The default density is `Blender`, which keeps the same feature set visible while
reducing the footprint of the inspector, tool rail, timeline dock, buttons,
inputs, icons, labels, and viewport overlays.

## Modes

- `Comfortable`: original presentation size for demos and large screens.
- `Compact`: moderate reduction for laptops.
- `Blender`: dense production layout inspired by Blender-style control density.

## Implementation

- `ui/density.ts` owns density loading, validation, local-storage persistence,
  and the `data-density` attribute applied to the root studio shell.
- `styles.css` uses density-scoped CSS variables instead of one-off overrides.
  Panel width, button height, icon size, timeline height, track row height, and
  spacing stay synchronized.
- `ui/template.ts` exposes the selector in the inspector header as `Density` so
  it is visible without scrolling.

## Design Rule

Density changes layout metrics without removing functionality. All controls
remain reachable in each mode, and the dense mode favors smaller spacing over
hiding important editor actions.
