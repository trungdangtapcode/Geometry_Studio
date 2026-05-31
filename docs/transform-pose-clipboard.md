# Transform Pose Clipboard

## Purpose

Pose-to-pose animation is faster when the user can copy a complete transform
pose and reuse it at another time or on another object. Geometry Studio now has
an object transform pose clipboard for Position, Rotation, and Scale values.

## Behavior

- `Copy Pose` stores the selected object's current Position, Rotation, and
  Scale values.
- `Paste Pose` applies the copied Position, Rotation, and Scale to the selected
  object.
- If Auto-Key is off, paste only changes the selected object transform.
- If Auto-Key is on, paste also writes Position, Rotation, and Scale keyframes
  at the current playhead time and selects the three keys.
- If any transform track is locked while Auto-Key is on, paste is blocked before
  changing the object.
- The command palette exposes `Copy Transform Pose` and `Paste Transform Pose`
  so the workflow remains keyboard-searchable.

## Architecture

The pose clipboard is editor UI state in `main.ts`, not saved scene data. It
stores readable transform values:

- Position in scene units.
- Rotation in degrees, matching the transform inspector and timeline JSON.
- Scale as raw X/Y/Z scale factors.

`Paste Pose` reuses existing editor operations: it records one undo snapshot,
updates the selected object root, synchronizes transform base values, and, when
Auto-Key is active, uses the same timeline track helpers as `Set Pose`.

## Validation

Automated browser coverage lives in
`Source/tests/transform-pose-clipboard.spec.ts`. The test verifies disabled
paste state, copying a cube pose, pasting it onto the sphere, and Auto-Key paste
creating three selected transform keyframes.
