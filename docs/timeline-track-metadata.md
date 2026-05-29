# Timeline Track Metadata

## Status

Implemented as a small architecture cleanup. Timeline track groups, labels,
colors, axis-expansion rules, and track type guards now live in
`Source/src/ui/timelineTrackMetadata.ts` instead of inside
`timelinePanel.ts`.

## Why This Matters

The timeline panel is the busiest editor surface in the app. As the project
adds AE-like features, the panel should coordinate UI state and delegate stable
metadata to focused modules. Keeping track metadata separate makes it easier to:

- add new object, camera, or light tracks without scanning the full panel;
- reuse labels/colors in future graph, dope-sheet, and inspector modules;
- keep `timelinePanel.ts` focused on rendering and interaction flow;
- reduce merge risk when multiple timeline features are added.

## Module Boundary

`timelineTrackMetadata.ts` owns:

- `OBJECT_TRACKS`
- `CAMERA_TRACKS`
- `LIGHT_TRACKS`
- `CHANNEL_EXPANDED_TRACKS`
- `TRACK_COLORS`
- `TRACK_LABELS`
- `isCameraTrack`
- `isLightTrack`
- `isObjectTrack`
- `trackLabel`

`timelinePanel.ts` imports these values and keeps ownership of DOM rendering,
selection state, timeline-library adaptation, graph integration, and callbacks
into `main.ts`.

## Testing

Validation is typecheck plus the timeline smoke paths that render expanded
object, texture, camera, and light channel rows, key colors, row labels, graph
titles, and keyframe editor labels.
