# Timeline Ease Strength

## Purpose

Geometry Studio now stores incoming and outgoing strength values on each
keyframe. This is a small but important step toward a professional graph
editor: the app can change how strongly a selected interpolation curve affects
playback without replacing the keyframe value or time.

This is not a full After Effects velocity-handle system yet. It is a clean,
versioned field pair that can later become the compatibility layer for true
Bezier velocity handles.

## User Behavior

- Select one or more keyframes.
- Choose an interpolation mode such as `Ease In`, `Ease Out`, `Ease`, `Back In`,
  or `Back Out`.
- Edit `Ease %` in the keyframe detail strip to set both sides together.
- Edit `In %` or `Out %` when the incoming and outgoing side need different
  influence.
- Or open the Graph panel, switch to `Speed`, select speed keys, and press
  Up/Down or drag vertically to adjust `Ease %`.
- In Speed graph mode, choose `Both`, `In`, or `Out` before dragging/nudging to
  decide which ease side is edited.
- `0` makes the segment behave like linear timing.
- `100` is the normal interpolation curve.
- `200` exaggerates the selected curve.

The evaluator uses the left keyframe's interpolation, the left keyframe's
outgoing strength, and the right keyframe's incoming strength for each segment.
For example, if Position has keys at `0s` and `2s`, the key at `0s` controls
the outgoing side and the key at `2s` controls the incoming side.

## Data Model

Timeline schema v13 adds `easeInStrength` and `easeOutStrength` to every
`TimelineKeyframeDocument`. The older `easeStrength` field remains as a summary
and migration fallback:

```ts
interface TimelineKeyframeDocument {
  id: string;
  time: number;
  value: [number, number, number];
  interpolation: TimelineInterpolation;
  easeStrength: number;
  easeInStrength: number;
  easeOutStrength: number;
}
```

Scene loading normalizes missing values to `1`, so older saved scenes continue
to load with normal easing. Version 12 scenes that only contain `easeStrength`
load by copying that scalar into both side-specific fields.

## Runtime Rule

The evaluator computes the selected interpolation curve, then blends from linear
timing toward that curve:

```ts
sideStrength = lerp(left.easeOutStrength, right.easeInStrength, linearT)
weight = linearT + (curvedT - linearT) * sideStrength;
```

This keeps `Ease % = 0` predictable for classroom demos and makes the feature
safe for every existing track type.

## Speed Graph Editing

Speed graph markers are no longer inspection-only. For editable track types:

- Horizontal drag retimes the keyframe.
- Vertical drag adjusts the selected ease side between `0` and `200`.
- Up/Down nudges the selected ease side by `5`.
- Shift+Up/Down nudges by `25`.
- Alt+Up/Down nudges by `1`.

This keeps graph editing direct while the keyframe editor still exposes separate
incoming and outgoing values for asymmetric timing.

## Next Step

The next graph-editor upgrade should replace numeric side fields with draggable
incoming/outgoing tangent handles while preserving `easeStrength` as a migration
fallback for simple scenes.
