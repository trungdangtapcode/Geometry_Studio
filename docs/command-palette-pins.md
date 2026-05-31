# Command Palette Pins

## Purpose

Pinned commands make the command palette useful as a lightweight professional
workspace. A user can keep high-frequency actions such as `Set Key`, `Set Pose`,
`Frame Selected`, `Graph`, or `Record WebM` above the normal command list.

## Behavior

- Every command row includes a star control.
- Clicking the star pins or unpins that command.
- Pinned commands appear first when the command palette opens with an empty
  search.
- Recently used commands still appear after pinned commands.
- Pinned commands are stored in local storage and survive reloads.
- At most eight pinned commands are kept.
- `Shift+Enter` toggles the active command pin from the keyboard.

## Architecture

`Source/src/ui/commandPalette.ts` owns pinned command state alongside recent
command state. Pinned commands are editor preferences, not scene data, so they
are stored under `geometry-studio-pinned-commands` in local storage.

When the search box is empty, palette ordering is:

1. pinned commands in most-recently-pinned order;
2. recent commands that are not pinned;
3. all remaining commands in their original registration order.

Search mode still filters all commands normally.

## Validation

Automated browser coverage lives in `Source/tests/command-palette-pins.spec.ts`.
The test pins `Set Key`, verifies it appears above a recent command, reloads the
app, verifies persistence, then unpins it.
