# Auto-Orient Along Path

## Purpose

After Effects includes an Auto-Orient Along Path assistant so a layer can face
the direction of its motion. Geometry Studio now adds the same idea for selected
3D objects: Position keyframes can generate editable Rotation keyframes.

## Behavior

- Run `Auto-Orient Along Path` from the Command Palette.
- The selected object must have at least two Position keyframes.
- The command writes Rotation keyframes at the same times as the Position keys.
- Direction is calculated from neighboring Position keys:
  - first key uses the direction toward the next moving key,
  - middle keys use the direction from previous to next,
  - last key uses the direction from the previous moving key.
- Static duplicate-position keys are skipped only if no usable neighboring
  movement can be found.
- Existing Rotation keys at the same times are updated instead of duplicated.
- Rotation remains ordinary timeline data, so users can edit, ease, delete,
  copy, paste, and save it like any other keyframe.

## Architecture

The path-to-rotation math lives in `Source/src/animation/autoOrient.ts`.
`main.ts` only handles selected-object validation, Undo/Redo, UI refresh,
timeline runtime rebuild, and toast feedback.

This keeps a keyframe assistant out of the editor shell and makes it easier to
test or extend later, for example with optional roll control or custom forward
axis presets.

## Validation

- Browser test creates Position keys, runs `Auto-Orient Along Path` from the
  Command Palette, saves JSON, and verifies Rotation keys were generated at the
  matching times.
- Build must pass because the helper is compiled with the rest of the
  TypeScript source.
