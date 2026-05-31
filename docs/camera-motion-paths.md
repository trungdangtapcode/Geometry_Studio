# Camera Motion Paths

## Purpose

Object motion paths already make Position keyframes visible in the viewport. The
camera timeline needed the same feedback: camera animation is hard to grade or
edit if the path only exists as numbers in the dope sheet.

## Behavior

- When `Motion Path` is enabled and the active timeline track is
  `Camera Position`, the viewport draws the camera path instead of the selected
  object path.
- Camera position keys appear as the same key dots and time labels used for
  object motion paths.
- Each visible camera key also gets a small wireframe camera/frustum ghost.
- If `Camera Target` keys exist, the frustum ghost points at the evaluated
  target for that time. Otherwise it uses the current orbit target.
- If `Camera Lens` keys exist, the ghost frustum uses the evaluated FOV for
  that time. Otherwise it uses the current camera FOV.
- Timeline solo/enable state is respected, so muted or non-soloed camera tracks
  do not draw misleading paths.

## Workflow

1. Choose `Camera Position` in the timeline track dropdown.
2. Set the playhead to `0`, move the camera, and click `Set Key`.
3. Move to another time, move the camera again, and click `Set Key`.
4. Keep `Motion Path` enabled in the Display section.
5. Select the `Camera Position` row or keep that track active to inspect the
   camera route and frustum ghosts.

## Architecture

The implementation reuses the existing motion-path rig:

- `scene/motionPath.ts` owns object and camera path rendering.
- `updateCameraMotionPath()` samples the camera position track with the same
  interpolation evaluator used by playback.
- Frustum ghosts are lightweight `LineSegments`, disposed through the existing
  motion-path cleanup path.
- `main.ts` only decides whether the active track should render an object path
  or a camera path.

This keeps camera visualization out of timeline editing logic and avoids adding
another overlay system.

## Validation

- Production build must pass.
- Timeline smoke coverage verifies camera channel rows and camera track graph
  selection still work.
- Manual browser check: key two Camera Position poses, keep `Camera Position`
  active, and verify the viewport shows a labeled path with wireframe camera
  ghosts.
