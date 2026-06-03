# Timeline Shy Rows

Shy rows are an After Effects style layer-management tool for dense scenes.
They hide selected object layers from the timeline without deleting objects,
disabling playback, muting tracks, or changing viewport visibility.

## User Workflow

1. Select an object layer.
2. Click `Shy` in the timeline toolbar, or click the shy switch on the object
   group row.
3. Click `Hide Shy` to hide all shy object layers from the timeline.
4. Click `Show Shy` to bring them back.

The selected object remains visible in the timeline even when it is shy, so it
can be unmarked without leaving the current selection context.

## Behavior

- Shy affects object layer rows and the object layer range strip only.
- Shy does not hide the object in the 3D viewport.
- Shy does not disable, mute, lock, solo, or remove timeline tracks.
- Camera and light rows are not shy layers.
- Pinned rows are still a local editor preference. Shy object IDs and the
  `Hide Shy` toggle are saved in scene JSON.

## Data Model

Timeline schema version `14` adds:

```json
{
  "hideShyObjects": false,
  "shyObjectIds": []
}
```

Older scene files normalize to `hideShyObjects: false` and an empty
`shyObjectIds` list. Invalid object IDs are pruned when a scene is loaded.

## Implementation

- `animation/timelineSchema.ts` owns schema defaults, normalization, cloning,
  object deletion pruning, and shy toggle helpers.
- `ui/timelinePanel.ts` owns the toolbar buttons, object group shy switches,
  shy filtering, and active button state.
- `main.ts` records undo history and mutates the timeline document.

## Validation

`Source/tests/timeline-shy-rows.spec.ts` verifies that a layer can be marked shy,
hidden from timeline rows, and persisted in exported scene JSON.
