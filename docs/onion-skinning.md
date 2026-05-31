# Onion Skinning

## Purpose

Onion skinning gives a quick timing-and-spacing readout around the current
playhead. Motion paths show the whole spatial route, while onion skins show the
nearby evaluated poses an animator needs when judging whether a movement feels
too fast, too slow, or uneven.

## Behavior

- `Display > Onion Skin` toggles the overlay.
- The overlay draws lightweight wireframe pose ghosts for the selected object.
- Two past samples and two future samples are generated around the current
  playhead using the timeline FPS.
- Past poses render blue; future poses render amber.
- Position, Rotation, and Scale tracks are evaluated with the same interpolation
  path used by playback.
- If only Rotation or Scale is keyed, onion skins still draw at the current
  object position so pose timing remains visible.
- When `Camera Position` is the active track, object onion skins are hidden so
  the camera path/frustum overlay stays readable.
- The setting is persisted in scene JSON as `display.onionSkin`.

## Architecture

`Source/src/scene/motionPath.ts` owns the overlay geometry:

- `MotionPathRig` now contains a separate `onionSkins` group so keyframe pose
  ghosts and onion-skin ghosts can be updated independently.
- `updateObjectOnionSkins()` samples the selected object's active transform
  tracks around `timeline.currentTime`.
- The overlay creates disposable `LineSegments`, following the existing
  motion-path cleanup strategy.
- `main.ts` only owns the UI toggle, persistence, and deciding whether object
  onion skins or camera motion paths should be displayed.

## Validation

- Build passes with TypeScript.
- Browser coverage verifies the `Onion Skin` toggle is present, can be enabled,
  and persists through scene JSON export.
- Manual visual check: create Position/Rotation/Scale keys, enable
  `Onion Skin`, scrub the playhead, and confirm nearby blue/amber wireframes
  update around the selected object.
