# Timeline Layer Solo

Layer Solo is an After Effects style object-layer switch that isolates the
keyed tracks on one object layer during timeline playback.

It uses the existing per-track `solo` flag. No scene schema change is needed.

## User Workflow

1. Select an object.
2. Create at least one keyframe on that object.
3. Click the solo switch on the object's timeline group row.
4. Scrub or play the timeline to review only that layer's keyed motion.
5. Click the solo switch again to return the keyed tracks to normal playback.

The switch appears only after the object layer has keyed tracks. Soloing a layer
does not hide it, lock it, mark it shy, or delete keyframes.

## Behavior

- Solos all keyed tracks for the object layer.
- Unsolos all keyed tracks if every keyed track is already soloed.
- Leaves unkeyed tracks unchanged.
- Reuses the existing solo runtime rule: when any keyed track is soloed, only
  enabled soloed tracks evaluate until solo is cleared.
- Persists through scene JSON because track solo state is already serialized.
- Plays through the same timeline runtime as row-level solo, so camera, light,
  material, texture, and transform track evaluation remain consistent.

## Implementation

- `ui/timelinePanel.ts` renders the group-level solo switch beside the lock,
  shy, and pose controls on keyed object layer rows.
- `main.ts` records undo history, flips the keyed track solo state, rebuilds the
  timeline runtime, reapplies camera/light/object property timeline values, and
  exposes the command palette action `Toggle Selected Layer Solo`.
- `styles.css` adds compact group-switch styling and a `solo-layer` state class
  for the object group row.

## Validation

`Source/tests/timeline-layer-solo.spec.ts` creates Position, Rotation, and Scale
keys on the default object, solos the object group, verifies the three transform
rows are marked as soloed, saves scene JSON, and confirms the transform tracks
serialize with `solo: true`.
