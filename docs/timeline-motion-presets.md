# Timeline Motion Presets

## Purpose

Motion presets provide After Effects style starting points without hiding
animation in procedural code. Each preset writes ordinary timeline tracks and
keyframes, so the result can be selected, retimed, eased, copied, deleted, saved,
and inspected like hand-authored animation.

## Commands

Use the Command Palette and search `motion preset`.

- `Apply Turntable Motion Preset` creates a full 360 degree Rotation track.
- `Apply Float Loop Motion Preset` creates a looping Position float with a small
  Rotation drift.
- `Apply Pop Intro Motion Preset` creates a scale overshoot plus a small
  Position settle.
- `Apply Product Reveal Motion Preset` creates Position, Rotation, Scale, and
  Opacity keyframes for a product-style entrance.

The existing Animation panel buttons still use the same baking path:

- `Spin` creates Rotation keys.
- `Orbit` creates Position and Rotation keys.
- `Bounce` creates Position keys.
- `Pulse` creates Scale keys.

## Behavior

- Presets use the current Work In/Out range as their timing span.
- Existing unlocked transform tracks on the selected object are replaced so the
  preset is predictable.
- Locked tracks are preserved.
- The selected object's procedural animation mode is set to `none` after
  baking.
- The active timeline track switches to the preset's primary track.
- Newly created keyframes are selected when the preset is applied through the
  Command Palette.

## Architecture

`Source/src/animation/motionPresets.ts` owns preset definitions. It receives the
selected object's current Position, Rotation, Scale, opacity, phase, and the
timeline bake range, then returns plain track/keyframe definitions.

`Source/src/main.ts` owns editor-side coordination: history, locked-track
behavior, replacing timeline tracks, runtime rebuild, playhead reset, and
selection updates.

This keeps preset math out of the main editor shell while avoiding a second
animation runtime or a separate preset persistence format.

## Validation

Browser coverage lives in `Source/tests/timeline-motion-presets.spec.ts`.
The tests verify that a Command Palette preset creates editable saved scene
tracks and that the existing Animation panel buttons still bake through the
shared path.
