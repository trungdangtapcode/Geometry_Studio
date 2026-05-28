# Timeline Row Keying

## Purpose

After Effects users expect each property row to be directly keyable. Geometry
Studio now adds a small diamond button on every visible timeline row so users do
not need to switch to a global track dropdown before adding a key.

## Behavior

- Clicking a row still selects that target and property track.
- Clicking the diamond button on a row selects that row and immediately creates
  or updates a keyframe at the current playhead time.
- Object rows select the matching scene object before writing the key.
- Camera and light rows write to their global timeline tracks.
- Rows that already contain keyframes use a filled diamond icon to communicate
  that pressing the button updates/adds another key on an existing track.

## Architecture

The feature is implemented in `ui/timelinePanel.ts` as an adapter-level event.
The panel does not mutate timeline data directly. It selects the row target,
then calls the existing `onAddKeyframe(kind)` callback so `main.ts` remains the
single place that records history, captures the current scene value, rebuilds
runtime playback, and refreshes UI state.

This keeps the interaction AE-like without creating a second keyframe writing
path.

## Testing

The Playwright smoke workflow verifies row-level keying for:

- Object Rotation rows.
- Camera Position rows.

The release browser smoke also verifies no console errors during row-key
creation.
