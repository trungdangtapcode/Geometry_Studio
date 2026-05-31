# UI Scale

## Purpose

Chrome zoom at `75%` makes Geometry Studio feel closer to Blender because the
whole editor scales down consistently. The app now exposes that behavior as a
first-class persisted setting, so users do not need to change browser zoom.

## Controls

The inspector header has two separate controls:

- `Density`: switches layout spacing presets: Comfortable, Compact, Blender.
- `Scale`: applies whole-editor scale: 75%, 85%, 100%, 110%, 125%.

Recommended compact setup: `Density = Blender`, `Scale = 75%`.

## Implementation

`Source/src/ui/density.ts` owns both settings:

- density persists in `geometry-studio-ui-density`,
- scale persists in `geometry-studio-ui-scale`,
- the shell receives `data-scale` for tests and `--ui-scale` for CSS.

`Source/src/styles.css` applies the scale with CSS `zoom` and expands the shell
layout box by `calc(100% / var(--ui-scale))`. That preserves full-window
coverage while producing the same compact visual effect as browser zoom.

## Test

`Source/tests/ui-scale.spec.ts` verifies that 75% scale can be selected, stored
in local storage, and restored after reload.
