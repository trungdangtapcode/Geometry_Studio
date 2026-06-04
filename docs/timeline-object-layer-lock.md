# Timeline Object Layer Lock

## Purpose

Object Layer Lock protects the selected scene object from accidental edits. It
is separate from the existing timeline layer track lock.

Use it when a layer is visually correct and should stay in place while editing
nearby objects, keyframes, lights, or camera moves.

## Controls

| Action | Control |
| --- | --- |
| Toggle object layer lock | Command Palette `Toggle Selected Object Layer Lock` |
| Unlock a locked layer | Run the same command again |
| Track/key lock | Timeline object group lock switch |

Locked object layers remain selectable from the Outliner and Timeline so they
can be unlocked. They show `Locked` in the selection summary, Outliner, and
Timeline group row.

## Behavior

When an object layer is locked, Geometry Studio blocks common object edits:

- Rename.
- Delete.
- Duplicate / duplicate at playhead.
- Transform reset and transform inspector edits.
- Transform-control changes.
- Parenting and parent-to-null changes.
- Material, render mode, texture, animation preset, motion preset, and object
  property key creation.

The lock is serialized as `locked: true` in saved scene JSON and round-trips
through load, duplicate, release build, and deployment.

## Difference From Track Lock

| Feature | Protects |
| --- | --- |
| Object Layer Lock | The scene object/layer itself |
| Layer Track Lock | All keyed tracks on that object layer |
| Row Track Lock | One timeline property row |

This separation keeps the editor flexible. You can lock a finished object
without needing it to have keyframes, or lock only a specific animated property
while keeping the object editable.

## Test Coverage

`Source/tests/timeline-object-layer-lock.spec.ts` verifies:

- Command Palette toggles object-layer lock.
- Outliner, timeline, and selection summary show locked state.
- Saved scene JSON includes `locked: true`.
- Rename and delete are blocked while locked.
- Unlocking restores normal rename behavior and serializes `locked: false`.
