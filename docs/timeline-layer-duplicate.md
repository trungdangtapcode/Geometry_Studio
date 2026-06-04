# Timeline Layer Duplicate

Layer Duplicate is an After Effects style selected-layer command for cloning an
object layer together with its animation tracks.

It reuses the existing object duplication and `copyTimelineObject` workflow, so
the duplicate keeps the same geometry, material settings, parent relationship,
and keyframed tracks while receiving fresh object, track, and keyframe IDs.

## User Workflow

1. Select an object layer in the viewport, outliner, or timeline.
2. Create or edit keyframes on that object.
3. Click `Layer Dup` in the timeline toolbar, run `Duplicate Selected Layer`
   from the Command Palette, or press `Ctrl+Alt+D`.
4. The new layer is selected. If it has copied Position keys, it follows the
   same keyed path as the source; otherwise the duplicated object is offset so
   it is visible immediately.

The outliner `Duplicate` button remains available for object-centric editing;
the timeline button exists so animation editing can stay inside the dope-sheet
workflow.

## Behavior

- Duplicates the selected object.
- Copies timeline tracks from the source object to the duplicate.
- Generates new track and keyframe IDs to avoid editing collisions.
- Keeps keyframe times, values, interpolation, easing, enable, solo, and lock
  flags.
- Selects the duplicate layer after creation.
- Offsets static duplicates in X/Z; copied Position tracks can intentionally
  drive the duplicate back onto the same animated path as the source.

## Implementation

- `ui/template.ts` adds the `Layer Dup` timeline toolbar button.
- `ui/timelinePanel.ts` routes the button through `onDuplicateLayer`.
- `main.ts` maps the callback, Command Palette command, tooltip binding, and
  `Ctrl+Alt+D` shortcut to the existing `duplicateSelected` implementation.
- `animation/timelineSchema.ts` already owns `copyTimelineObject`, which creates
  fresh IDs for copied tracks and keyframes.

## Validation

`Source/tests/timeline-layer-duplicate.spec.ts` creates Position, Rotation, and
Scale pose keys, duplicates the selected layer from the timeline toolbar, saves
the scene JSON, and verifies that the selected duplicate has copied transform
tracks while the source layer remains intact.
