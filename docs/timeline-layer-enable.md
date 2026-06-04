# Timeline Layer Enable

Layer Enable is an After Effects style object-layer switch that mutes or
restores every keyed track on one object layer at once.

It uses the existing per-track `enabled` flag. No scene schema change is needed.

## User Workflow

1. Select an object.
2. Create at least one keyframe on that object.
3. Click the enable switch on the object's timeline group row.
4. Scrub or play the timeline to compare the scene with that layer's keyed
   animation muted.
5. Click the switch again to restore that layer's keyed animation.

The switch appears only after the object layer has keyed tracks. Disabling a
layer track group does not delete keyframes, hide the object, lock editing, or
mark the layer shy.

## Behavior

- Disables all keyed tracks for the object layer.
- Enables all keyed tracks if any keyed track is currently disabled.
- Leaves unkeyed tracks unchanged.
- Reuses the existing timeline runtime rule that disabled tracks do not
  evaluate during scrubbing or playback.
- Persists through scene JSON because track enable state is already serialized.
- Works independently from layer solo, lock, and shy switches.

## Implementation

- `ui/timelinePanel.ts` renders the group-level enable switch beside solo, lock,
  shy, and pose controls on keyed object layer rows.
- `main.ts` records undo history, flips keyed track enable state, rebuilds the
  timeline runtime, reapplies camera/light/object property timeline values, and
  exposes the command palette action `Toggle Selected Layer Tracks`.
- `styles.css` uses auto-flow group columns so keyed layer rows can carry enable,
  solo, lock, shy, and pose controls without hardcoded width cases.

## Validation

`Source/tests/timeline-layer-enable.spec.ts` creates Position, Rotation, and
Scale keys on the default object, disables the object group, verifies the three
transform rows are marked disabled, saves scene JSON, and confirms the transform
tracks serialize with `enabled: false`.
