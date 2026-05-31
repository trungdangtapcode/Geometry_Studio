# Command Palette

## Purpose

Geometry Studio now includes a compact command palette for dense timeline and
scene workflows. This mirrors professional tools where commands can be reached
by search instead of scanning long toolbars.

## Behavior

- Open with the `Commands` button, `Ctrl/Cmd+K`, or `F3`.
- Search by command name, category, shortcut, or keyword.
- Exact command-title, title-prefix, and title-word matches are ranked above
  broad keyword matches, so typing the visible command name runs the expected
  command.
- Use `ArrowUp` / `ArrowDown` to move the active command.
- Use `Enter` to run the active enabled command.
- Use `Escape` or click outside the dialog to close it.
- Commands that cannot currently run, such as Paste without copied keyframes or
  interpolation without an editable keyframe target, are shown disabled.

## Architecture

- `ui/commandPalette.ts` owns search, keyboard navigation, disabled command
  rendering, and command execution.
- `main.ts` builds command descriptors near the editor command functions so the
  palette uses the same code paths as toolbar buttons and shortcuts.
- Disabled states are dynamic callbacks, so the palette reflects the current
  timeline clipboard, keyframe selection, and playhead state each time it opens
  or filters.

## Testing

The Playwright command palette workflow verifies that:

- `Ctrl/Cmd+K` opens the palette and focuses search.
- Disabled commands render as disabled before prerequisites exist.
- Searching and pressing `Enter` can run `Set Key`.
- Interpolation commands become enabled after a keyframe target exists.
