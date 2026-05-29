# Timeline Markers

## Purpose

Timeline markers provide named cue points for animation beats, camera moves,
lighting changes, and demo/report walkthroughs. They are saved in scene JSON so
the evaluator can reload a scene and keep its timeline annotations.

## Behavior

- `Marker` adds a marker at the snapped playhead time.
- The marker label field names a new marker or renames the marker at the
  playhead.
- Previous/next marker buttons jump between marker cue points.
- Marker chips in the marker strip jump the playhead when clicked.
- Deleting removes the marker at the playhead.

## Keyboard Workflow

- `M` adds a marker at the snapped playhead time, or updates the marker already
  at that time.
- `Shift+M` jumps to the next marker.
- `Alt+M` jumps to the previous marker.

Keyboard marker commands are ignored while a text field or select menu has
focus, so typing marker names does not trigger timeline navigation.

## Schema

Timeline schema v9 adds:

```ts
markers: Array<{
  id: string;
  time: number;
  label: string;
  color: string;
}>;
```

Older scene files are migrated with an empty marker list.
