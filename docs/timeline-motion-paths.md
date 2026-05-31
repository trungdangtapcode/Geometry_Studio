# Timeline Motion Paths

## Purpose

Motion paths make spatial keyframes visible in the viewport. For the common
workflow `A_t0 -> A_t1`, the user should be able to select object A, add a
Position key at `t0`, move to `t1`, add a second Position key, and immediately
see the interpolated path between both keyed positions.

This follows the convention used by professional animation tools: the timeline
stores the authored values, while the viewport shows enough context to judge
motion direction, distance, and timing.

## Implemented Scope

- Selected object only.
- Position tracks only.
- Requires at least two enabled Position keyframes.
- Uses the same interpolation semantics as timeline playback:
  - `hold` keeps the previous position until the next key.
  - `linear` samples straight interpolation.
  - `easeIn` starts slowly and accelerates toward the next key.
  - `easeOut` starts quickly and decelerates toward the next key.
  - `smooth` samples smoothstep interpolation.
  - `backIn` and `backOut` show anticipation or overshoot in the sampled path.
- Draws a teal curve for the sampled path.
- Draws amber points at the authored key positions.
- Draws compact viewport time labels at authored key positions, capped for
  dense tracks to avoid clutter.
- Draws lightweight wireframe pose ghosts at authored key positions. If Rotation
  or Scale tracks exist, the ghosts evaluate those tracks at the same key times.
- Exposes a `Motion Path` display toggle in the inspector.
- Persists the display setting in scene JSON as `display.motionPath`.

## Module Boundary

`Source/src/scene/motionPath.ts` owns all Three.js objects required for the
viewport helper:

- `createMotionPathRig()` creates a persistent group containing pose ghosts, a
  line, key point cloud, and label group.
- `updateMotionPath()` samples the selected object's Position track and updates
  the helper geometry, time-label sprites, and pose ghosts.
- `clearMotionPath()` hides and clears the helper when no valid track exists.

`main.ts` only coordinates selection, timeline edits, scene restore, and display
toggle state. The sampling logic stays out of the application shell.

## Data Flow

1. User selects an object.
2. User creates or edits Position keyframes in the timeline.
3. `updateAllUI()` or timeline drag updates call `syncMotionPath()`.
4. `syncMotionPath()` passes the current timeline, selected object, and display
   flag into the scene helper.
5. The helper samples keyframes, replaces the line/point geometries, and rebuilds
   the time-label sprites and ghost boxes.

The helper does not mutate object transforms or keyframes. It is a read-only
visualization layer.

## Future Improvements

- Per-axis path color for X/Y/Z editing modes.
- Tangent handles if the timeline gains Bezier interpolation.
- Path editing by dragging viewport key markers, with updates routed through the
  command system for Undo/Redo.
