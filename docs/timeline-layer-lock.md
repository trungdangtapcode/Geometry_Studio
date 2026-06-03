# Timeline Layer Lock

Layer Lock is an After Effects style object-layer switch that protects every
keyed track on one object layer at once.

It uses the existing track `locked` flag. No new schema field is needed.

## User Workflow

1. Select an object.
2. Create at least one keyframe on that object.
3. Click the lock switch on the object's timeline group row.
4. Click it again to unlock the layer tracks.

The switch is disabled until the layer has keyed tracks. Locking a layer does
not hide it, mute it, solo it, or remove keyframes.

## Behavior

- Locks all keyed tracks for the object layer.
- Unlocks all keyed tracks if every keyed track is already locked.
- Leaves unkeyed tracks unchanged.
- Preserves existing per-track lock semantics, including disabled row diamonds
  and locked graph keys.
- Persists through scene JSON because track lock state is already serialized.

## Implementation

- `ui/timelinePanel.ts` renders the group-level lock switch and dispatches the
  object ID.
- `main.ts` records undo history, flips the keyed track lock state, updates UI,
  and exposes the command palette action `Toggle Selected Layer Lock`.
- `styles.css` adds compact group-switch styling matching shy and pose controls.

## Validation

`Source/tests/timeline-layer-lock.spec.ts` sets Position, Rotation, and Scale
keys on the default object, locks the object group, verifies the three transform
rows are locked, saves scene JSON, and confirms the transform tracks serialize
with `locked: true`.
