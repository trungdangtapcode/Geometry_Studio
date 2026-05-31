# Timeline Playback Speed

## Purpose

Playback speed controls preview timing without changing the timeline document's
FPS, keyframe times, Work In/Out range, or exported scene data. This matches the
editing distinction used by tools such as After Effects and Premiere: frame rate
defines timecode, while transport speed defines how quickly the editor previews
that time.

## UI Behavior

- The Speed selector in the timeline settings supports `0.25x`, `0.5x`, `1x`,
  `2x`, and `4x`.
- Selecting a speed while stopped stores it for the next playback command.
- Selecting a speed while playing updates the active preview immediately.
- `J` and `L` still work as shuttle controls. Repeating the current direction
  steps slow speeds up to `1x`, then to `2x`, then to `4x`.
- Switching direction preserves the selected speed instead of forcing the
  timeline back to `1x`.
- `K` stops playback and resets shuttle speed to `1x`.

The control intentionally does not edit `timeline.fps`. A scene authored at
30 FPS remains a 30 FPS scene whether the user previews it at `0.5x` or `4x`.

## Command Palette

The Playback command group exposes direct speed commands:

- Set Playback Speed 0.25x
- Set Playback Speed 0.5x
- Set Playback Speed 1x
- Set Playback Speed 2x
- Set Playback Speed 4x

These commands are searchable by terms such as `speed`, `slow`, `fast`,
`preview`, and `transport`.

## Recording Rule

WebM preview recording stays fixed at forward `1x` playback. This keeps exports
deterministic and prevents an editor preview preference from unexpectedly
changing the captured work-area duration.
