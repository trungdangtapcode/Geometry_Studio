# Preview Export

## Status

Geometry Studio can export a WebM preview of the current timeline work area.
This is a practical After Effects/Premiere style deliverable feature: the user
can author a scene, define Work In/Out, and record the viewport animation.

## Implementation

The preview recorder uses browser-native APIs:

- `HTMLCanvasElement.captureStream()`
- `MediaRecorder`
- WebM output through the best supported browser codec

The implementation records the same WebGL canvas the user sees. It does not add
a server or external encoder.

## Runtime Rules

- Recording starts at `timeline.workStart`.
- Recording stops at `timeline.workEnd`.
- Loop mode is ignored while recording so the output is one clean work-area
  pass.
- The recording button toggles between `Record WebM` and `Stop WebM`.
- If the browser does not support MediaRecorder/canvas capture, the app shows a
  toast instead of failing.

## Testing

The Playwright smoke test verifies the WebM export control is visible. Manual
recording remains the stronger verification because browser support for
MediaRecorder differs across environments.

Recommended manual check:

1. Set Work In/Out.
2. Press `Record WebM`.
3. Let playback reach Work Out, or press `Stop WebM`.
4. Confirm `geometry-studio-preview.webm` downloads and plays.
