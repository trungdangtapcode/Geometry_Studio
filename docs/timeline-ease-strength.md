# Timeline Ease Strength

## Purpose

Geometry Studio now stores a numeric strength value on each keyframe. This is a
small but important step toward a professional graph editor: the app can change
how strongly a selected interpolation curve affects playback without replacing
the keyframe value or time.

This is not a full After Effects velocity-handle system yet. It is a clean,
versioned field that can later become the compatibility layer for incoming and
outgoing Bezier velocity handles.

## User Behavior

- Select one or more keyframes.
- Choose an interpolation mode such as `Ease In`, `Ease Out`, `Ease`, `Back In`,
  or `Back Out`.
- Edit `Ease %` in the keyframe detail strip.
- `0` makes the segment behave like linear timing.
- `100` is the normal interpolation curve.
- `200` exaggerates the selected curve.

The evaluator uses the left keyframe's interpolation and ease strength for the
segment that starts at that keyframe. For example, if Position has keys at
`0s` and `2s`, the key at `0s` controls the timing curve between `0s` and `2s`.

## Data Model

Timeline schema v12 adds `easeStrength` to every `TimelineKeyframeDocument`:

```ts
interface TimelineKeyframeDocument {
  id: string;
  time: number;
  value: [number, number, number];
  interpolation: TimelineInterpolation;
  easeStrength: number;
}
```

Scene loading normalizes missing values to `1`, so older saved scenes continue
to load with normal easing.

## Runtime Rule

The evaluator computes the selected interpolation curve, then blends from linear
timing toward that curve:

```ts
weight = linearT + (curvedT - linearT) * easeStrength;
```

This keeps `Ease % = 0` predictable for classroom demos and makes the feature
safe for every existing track type.

## Next Step

The next graph-editor upgrade should replace the scalar field with editable
incoming/outgoing tangent handles while preserving `easeStrength` as a migration
fallback for simple scenes.
