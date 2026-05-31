import { expect, test } from "@playwright/test";
import { Buffer } from "node:buffer";

test("renders the studio and core controls", async ({ page }) => {
  test.setTimeout(600_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Geometry Studio" })).toBeVisible();
  await expect(page.locator(".studio-shell")).toHaveAttribute("data-density", "blender");
  await expect(page.locator("#ui-density")).toHaveValue("blender");
  expect(await page.locator(".inspector").evaluate((element) => parseFloat(getComputedStyle(element).width))).toBeLessThan(310);
  await page.locator("#ui-density").selectOption("compact");
  await expect(page.locator(".studio-shell")).toHaveAttribute("data-density", "compact");
  await page.reload();
  await expect(page.locator("#ui-density")).toHaveValue("compact");
  await expect(page.locator(".studio-shell")).toHaveAttribute("data-density", "compact");
  await expect(page.getByRole("button", { name: "Cube", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Render mode" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Record WebM" })).toBeVisible();
  await expect(page.locator("#renderer-mode")).toContainText("WebGL raster");
  await expect(page.locator("#tone-mapping")).toHaveValue("aces");
  await expect(page.locator("#render-exposure")).toHaveValue("1.05");
  await expect(page.locator("#shadow-quality")).toHaveValue("high");
  await expect(page.locator("#environment-preset")).toHaveValue("studio");
  await expect(page.locator("#path-trace-samples")).toHaveValue("32");
  await expect(page.locator("#path-trace-button")).toBeVisible();
  await expect(page.locator("#path-trace-status")).toContainText(/Optional still|unavailable/);
  await page.locator("#environment-preset").selectOption("gallery");
  await expect(page.locator("#renderer-mode")).toContainText("Environment Gallery");
  await expect(page.locator("#post-bloom-toggle")).not.toBeChecked();
  await page.locator("#post-bloom-toggle").check();
  await expect(page.locator("#renderer-mode")).toContainText("Bloom On");
  await page.locator("#post-bloom-strength").evaluate((input) => {
    (input as HTMLInputElement).value = "0.65";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(page.locator("#post-bloom-strength")).toHaveValue("0.65");
  await page.locator("#post-vignette-toggle").check();
  await expect(page.locator("#renderer-mode")).toContainText("Vignette On");
  await expect(page.locator("#post-ssao-toggle")).not.toBeChecked();
  await expect(page.locator("#post-fxaa-toggle")).not.toBeChecked();
  await expect(page.locator("#post-dof-toggle")).not.toBeChecked();
  await expect(page.locator("#post-dof-focus")).toHaveValue("8");
  await page.locator("#post-dof-toggle").check();
  await expect(page.locator("#renderer-mode")).toContainText("DOF On");
  await page.locator("#post-dof-focus").evaluate((input) => {
    (input as HTMLInputElement).value = "10.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#post-dof-maxblur").evaluate((input) => {
    (input as HTMLInputElement).value = "0.02";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(page.locator("#post-dof-focus")).toHaveValue("10.5");
  await expect(page.locator("#post-dof-maxblur")).toHaveValue("0.02");
  await page.locator("#post-fxaa-toggle").check();
  await expect(page.locator("#renderer-mode")).toContainText("FXAA On + DOF On");
  await page.locator("#post-fxaa-toggle").uncheck();
  await page.locator("#post-dof-toggle").uncheck();
  await expect(page.locator("#post-halftone-toggle")).not.toBeChecked();
  await page.locator("#post-halftone-toggle").check();
  await expect(page.locator("#renderer-mode")).toContainText("Comic Halftone On");
  await page.locator("#post-halftone-radius").evaluate((input) => {
    (input as HTMLInputElement).value = "4";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(page.locator("#post-halftone-radius")).toHaveValue("4");
  await page.locator("#post-halftone-toggle").uncheck();
  await expect(page.locator("#post-ssao-radius")).toHaveValue("8");
  await page.locator("#post-bloom-toggle").uncheck();
  await page.locator("#post-vignette-toggle").uncheck();
  await expect(page.locator("#renderer-mode")).toContainText("Post Off");
  await expect(page.getByRole("button", { name: "Ceramic", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Metal", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Glass", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Anime Toon", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Metal", exact: true }).click();
  await expect(page.locator("#material-mode")).toHaveValue("standard");
  await expect(page.locator("#object-metalness")).toHaveValue("1");
  await expect(page.locator("#object-roughness")).toHaveValue("0.18");
  await expect(page.getByRole("button", { name: "Metal", exact: true })).toHaveClass(/active/);
  await page.getByRole("button", { name: "Glass", exact: true }).click();
  await expect(page.locator("#object-opacity")).toHaveValue("0.42");
  await expect(page.getByRole("button", { name: "Glass", exact: true })).toHaveClass(/active/);
  await page.getByRole("button", { name: "Anime Toon", exact: true }).click();
  await expect(page.locator("#material-mode")).toHaveValue("toon");
  await expect(page.getByRole("button", { name: "Anime Toon", exact: true })).toHaveClass(/active/);
  await expect(page.locator("#timeline-timecode")).toContainText("F0000");
  await expect(page.locator("#timeline-prev-frame")).toBeVisible();
  await expect(page.locator("#timeline-next-frame")).toBeVisible();
  await expect(page.locator("#timeline-selected-start")).toBeVisible();
  await expect(page.locator("#timeline-selected-end")).toBeVisible();
  await expect(page.locator("#timeline-prev-visible-keyframe")).toBeVisible();
  await expect(page.locator("#timeline-next-visible-keyframe")).toBeVisible();
  await expect(page.locator("#timeline-set-transform")).toBeVisible();
  await expect(page.locator("#timeline-set-visible")).toBeVisible();
  await expect(page.locator("#timeline-layer-in")).toBeVisible();
  await expect(page.locator("#timeline-layer-out")).toBeVisible();
  await expect(page.locator("#timeline-split-layer")).toBeVisible();
  await expect(page.locator("#timeline-layer-work")).toBeVisible();
  await expect(page.locator("#timeline-select-layer-keys")).toBeVisible();
  await expect(page.locator("#timeline-fit-layer-keys")).toBeVisible();
  await expect(page.locator("#timeline-sequence-layers")).toBeVisible();
  await expect(page.locator("#timeline-layer-strip-toggle")).toBeVisible();
  await expect(page.locator("#timeline-overview-track")).toBeVisible();
  await expect(page.locator("#timeline-layer-strip")).toBeVisible();
  await expect(page.locator('.timeline-layer-bar[data-object-id="object-1"]')).toContainText("Cube");
  await page.locator("#timeline-layer-strip-toggle").click();
  await expect(page.locator("#keyframe-dock")).toHaveClass(/layer-strip-collapsed/);
  await expect(page.locator("#timeline-overview")).toBeHidden();
  await expect(page.locator("#timeline-layer-strip")).toBeHidden();
  await page.locator("#timeline-layer-strip-toggle").click();
  await expect(page.locator("#timeline-overview")).toBeVisible();
  await expect(page.locator("#timeline-layer-strip")).toBeVisible();
  await expect(page.locator("#timeline-ease-linear")).toBeVisible();
  await expect(page.locator("#timeline-ease-in")).toBeVisible();
  await expect(page.locator("#timeline-ease-out")).toBeVisible();
  await expect(page.locator("#timeline-ease-smooth")).toBeVisible();
  await expect(page.locator("#timeline-ease-hold")).toBeVisible();
  await expect(page.locator("#timeline-ease-preview")).toBeVisible();
  await expect(page.locator("#timeline-graph-toggle")).toBeVisible();
  await page.locator("#timeline-graph-toggle").click();
  await expect(page.locator("#keyframe-dock")).toHaveClass(/graph-visible/);
  await expect(page.locator("#timeline-graph-panel")).toBeVisible();
  await expect(page.locator("#timeline-graph-title")).toContainText("Cube | Position");
  await expect(page.locator("#timeline-copy-keyframes")).toBeVisible();
  await expect(page.locator("#timeline-copy-time")).toBeVisible();
  await expect(page.locator("#timeline-cut-time")).toBeVisible();
  await expect(page.locator("#timeline-paste-keyframes")).toBeVisible();
  await expect(page.locator("#timeline-paste-keyframes")).toBeDisabled();
  await expect(page.locator("#timeline-paste-insert-keyframes")).toBeDisabled();
  await expect(page.locator("#timeline-select-workarea")).toBeVisible();
  await expect(page.locator("#timeline-select-visible")).toBeVisible();
  await expect(page.locator("#timeline-select-time")).toBeVisible();
  await expect(page.locator("#timeline-duplicate-time")).toBeVisible();
  await expect(page.locator("#timeline-delete-time")).toBeVisible();
  await expect(page.locator("#timeline-preview-selection")).toBeVisible();
  await expect(page.locator("#timeline-nudge-left")).toBeVisible();
  await expect(page.locator("#timeline-nudge-right")).toBeVisible();
  await expect(page.locator("#timeline-move-to-playhead")).toBeVisible();
  await expect(page.locator("#timeline-center-keyframes")).toBeVisible();
  await expect(page.locator("#timeline-rove-keyframes")).toBeVisible();
  await expect(page.locator("#timeline-reverse-keyframes")).toBeVisible();
  await expect(page.locator("#timeline-snap-keyframes")).toBeVisible();
  await expect(page.locator("#timeline-distribute-keyframes")).toBeVisible();
  await expect(page.locator("#timeline-fit-keyframes")).toBeVisible();
  await expect(page.locator("#timeline-stagger-keyframes")).toBeVisible();
  await expect(page.locator("#timeline-cascade-keyframes")).toBeVisible();
  await expect(page.locator("#timeline-toggle-track")).toBeVisible();
  await expect(page.locator("#timeline-solo-track")).toBeVisible();
  await expect(page.locator("#timeline-lock-track")).toBeVisible();
  await expect(page.locator("#timeline-add-marker")).toBeVisible();
  await expect(page.locator("#timeline-delete-marker")).toBeVisible();
  await expect(page.locator("#timeline-resize-handle")).toBeVisible();
  await expect(page.locator("#motion-path-toggle")).toBeChecked();
  await expect(page.locator("#timeline-row-filter")).toHaveValue("focus");
  await page.locator("#timeline-row-filter").selectOption("keyed");
  await expect(page.locator('.timeline-track-label[data-track-kind="position"]')).toHaveCount(3);
  await expect(page.locator('.timeline-track-label[data-track-kind="rotation"]')).toHaveCount(3);
  await expect(page.locator('.timeline-track-label[data-track-kind="position"][data-track-axis="x"]')).toBeVisible();
  await expect(page.locator('.timeline-track-label[data-track-kind="rotation"][data-track-axis="y"]')).toBeVisible();
  await page.locator("#timeline-row-filter").selectOption("focus");
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("u");
  await expect(page.locator("#timeline-row-filter")).toHaveValue("keyed");
  await page.keyboard.press("u");
  await expect(page.locator("#timeline-row-filter")).toHaveValue("all");
  await page.keyboard.press("u");
  await expect(page.locator("#timeline-row-filter")).toHaveValue("focus");
  await page.keyboard.press("Control+F");
  await expect(page.locator("#timeline-row-search")).toBeFocused();
  await page.locator("#timeline-row-search").fill("camera");
  await expect(page.locator('.camera-track-label[data-track-kind="cameraPosition"][data-track-axis="x"]')).toBeVisible();
  await expect(page.locator('.timeline-track-label[data-object-id="object-1"]')).toHaveCount(0);
  await page.locator("#timeline-row-search").fill("point intensity");
  await expect(page.locator('.light-track-label[data-track-kind="pointIntensity"]')).toBeVisible();
  await page.locator("#timeline-row-search").fill("not-a-row");
  await expect(page.locator("#timeline-track-labels")).toContainText('No rows match "not-a-row"');
  await page.keyboard.press("Escape");
  await expect(page.locator("#timeline-row-search")).toHaveValue("");
  await expect(page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="position"][data-track-axis="x"]')).toBeVisible();
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  const timelineZoom = async () => page.locator("#keyframe-dock").evaluate((element) => Number((element as HTMLElement).dataset.zoomLevel));
  const initialTimelineZoom = await timelineZoom();
  await page.locator("#timeline-zoom-in").click();
  await expect.poll(timelineZoom, { timeout: 10_000 }).toBeGreaterThan(initialTimelineZoom);
  const zoomedTimelineValue = await timelineZoom();
  await page.locator("#timeline-zoom-out").click();
  await expect.poll(timelineZoom, { timeout: 10_000 }).toBeLessThan(zoomedTimelineValue);
  await page.locator("#timeline-zoom-fit").click();
  await expect(page.locator("#timeline-zoom-fit")).toBeVisible();
  await expect(page.locator("#timeline-zoom-selection")).toBeVisible();
  await expect(page.locator("#timeline-selection-tool")).toHaveAttribute("aria-pressed", "true");
  await page.locator("#timeline-pan-tool").click();
  await expect(page.locator("#timeline-pan-tool")).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("v");
  await expect(page.locator("#timeline-selection-tool")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#timeline-follow-playhead")).toBeVisible();
  const rotationTrackLabel = page.locator('.timeline-track-label[data-track-kind="rotation"]').first();
  await rotationTrackLabel.click();
  await expect(page.locator("#timeline-track-kind")).toHaveValue("rotation");
  await expect(rotationTrackLabel).toHaveClass(/active/);
  await rotationTrackLabel.locator(".timeline-row-key").click();
  await expect(page.locator("#timeline-key-label")).toContainText("Cube | Rotation");
  await page.locator('[data-animation="spin"]').click({ force: true });
  await expect(page.locator("#selection-summary")).toContainText("Keyframed");
  await expect(page.locator("#timeline-track-kind")).toHaveValue("rotation");
  await expect(page.locator("#timeline-key-label")).toContainText("Cube | Rotation");
  const cameraTrackLabel = page.locator('.camera-track-label[data-track-kind="cameraPosition"][data-track-axis="x"]');
  await page.locator("#timeline-track-kind").selectOption("cameraPosition");
  await expect(cameraTrackLabel).toBeVisible();
  await cameraTrackLabel.click();
  await expect(page.locator("#timeline-track-kind")).toHaveValue("cameraPosition");
  await expect(cameraTrackLabel).toHaveClass(/active/);
  await cameraTrackLabel.locator(".timeline-row-key").click();
  await expect(page.locator("#timeline-key-label")).toContainText("Camera | Camera Position X");
  let resizeBox = await page.locator("#timeline-resize-handle").boundingBox();
  expect(resizeBox).toBeTruthy();
  await page.mouse.move(resizeBox!.x + resizeBox!.width / 2, resizeBox!.y + 4);
  await page.mouse.down();
  await page.mouse.move(resizeBox!.x + resizeBox!.width / 2, resizeBox!.y + 90);
  await page.mouse.up();
  const shrunkenDockHeight = await page.locator("#keyframe-dock").evaluate((element) => element.getBoundingClientRect().height);
  resizeBox = await page.locator("#timeline-resize-handle").boundingBox();
  expect(resizeBox).toBeTruthy();
  await page.mouse.move(resizeBox!.x + resizeBox!.width / 2, resizeBox!.y + 4);
  await page.mouse.down();
  await page.mouse.move(resizeBox!.x + resizeBox!.width / 2, resizeBox!.y - 120);
  await page.mouse.up();
  await expect.poll(() => page.locator("#keyframe-dock").evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThan(shrunkenDockHeight + 20);
  await page.locator("#timeline-next-frame").click();
  await expect(page.locator("#timeline-timecode")).toContainText("F0001");
  expect(Number(await page.locator("#timeline-current-time").inputValue())).toBeGreaterThan(0);
  await page.locator("#timeline-prev-frame").click();
  await expect(page.locator("#timeline-timecode")).toContainText("F0000");
  await page.keyboard.press("End");
  await expect(page.locator("#timeline-timecode")).toContainText("F0240");
  await page.keyboard.press("Home");
  await expect(page.locator("#timeline-timecode")).toContainText("F0000");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#timeline-timecode")).toContainText("F0001");
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#timeline-timecode")).toContainText("F0000");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("b");
  await expect(page.locator("#timeline-work-start")).toHaveValue("1.5");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "3.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("n");
  await expect(page.locator("#timeline-work-end")).toHaveValue("3.5");
  await page.locator("#timeline-collapse").click({ force: true });
  await expect(page.locator("#keyframe-dock")).toHaveClass(/collapsed/);
  await expect(page.locator(".timeline-body")).toBeHidden();
  await expect(page.locator(".timeline-toolbar")).toBeHidden();
  await expect(page.locator(".timeline-graph-panel")).toBeHidden();
  await expect.poll(() => page.locator("#keyframe-dock").evaluate((element) => element.getBoundingClientRect().height)).toBeLessThan(80);

  const canvas = page.locator("canvas").first();
  await expect(canvas).toBeVisible();
  await page.waitForFunction(() => {
    const canvas = document.querySelector("canvas");
    if (!(canvas instanceof HTMLCanvasElement)) return false;
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) return false;
    const samplePoints = [
      [0.25, 0.35],
      [0.5, 0.5],
      [0.7, 0.42],
      [0.42, 0.68],
      [0.62, 0.72]
    ];
    return samplePoints.some(([x, y]) => {
      const pixels = new Uint8Array(4);
      gl.readPixels(Math.floor(canvas.width * x), Math.floor(canvas.height * y), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      return pixels[3] > 0 && (pixels[0] > 0 || pixels[1] > 0 || pixels[2] > 0);
    });
  });

  await page.getByRole("button", { name: "Sphere", exact: true }).click();
  await expect(page.locator("#selection-summary")).toContainText("Sphere");

  await page.locator('[data-render="lines"]').click({ force: true });
  await expect(page.locator("#selection-summary")).toContainText("Lines");

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("button", { name: "Cube", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("disables keyframe target actions when no keyframe is active", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  const targetActions = [
    page.locator("#timeline-delete-keyframe"),
    page.locator("#timeline-copy-keyframes"),
    page.locator("#timeline-duplicate-keyframe"),
    page.locator("#timeline-preview-selection"),
    page.locator("#timeline-zoom-selection"),
    page.locator("#timeline-nudge-right"),
    page.locator("#timeline-interpolation"),
    page.locator("#timeline-ease-smooth")
  ];

  await expect(page.locator("#timeline-selection")).toContainText("No keyframe selected");
  for (const action of targetActions) await expect(action).toBeDisabled();

  await page.locator("#timeline-add-keyframe").click();
  await expect(page.locator("#timeline-selection")).toContainText("1 keyframe selected");
  for (const action of targetActions) await expect(action).toBeEnabled();

  expect(errors).toEqual([]);
});

test("opens the command palette and runs timeline commands", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#command-palette")).toHaveAttribute("aria-hidden", "true");
  await page.keyboard.press("Control+K");
  await expect(page.locator("#command-palette")).toHaveClass(/open/);
  await expect(page.locator("#command-palette-search")).toBeFocused();

  await page.locator("#command-palette-search").fill("paste insert");
  await expect(page.locator('[data-command-id="timeline.paste-insert"]')).toBeDisabled();
  await page.locator("#command-palette-search").fill("fit selected");
  await expect(page.locator('[data-command-id="timeline.fit-selection"]')).toBeDisabled();

  await page.locator("#command-palette-search").fill("set key");
  await page.keyboard.press("Enter");
  await expect(page.locator("#command-palette")).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator("#timeline-selection")).toContainText("1 keyframe selected");

  const timelineZoom = async () => page.locator("#keyframe-dock").evaluate((element) => Number((element as HTMLElement).dataset.zoomLevel));
  const zoomBeforeFit = await timelineZoom();
  await page.keyboard.press("Control+K");
  await page.locator("#command-palette-search").fill("fit selected");
  await expect(page.locator('[data-command-id="timeline.fit-selection"]')).toBeEnabled();
  await page.keyboard.press("Enter");
  await expect.poll(timelineZoom, { timeout: 10_000 }).toBeGreaterThan(zoomBeforeFit);

  await page.keyboard.press("Control+K");
  await page.locator("#command-palette-search").fill("follow playhead");
  await page.keyboard.press("Enter");
  await expect(page.locator("#timeline-follow-playhead")).toHaveAttribute("aria-pressed", "true");

  await page.keyboard.press("Control+K");
  await page.locator("#command-palette-search").fill("pan tool");
  await page.keyboard.press("Enter");
  await expect(page.locator("#timeline-pan-tool")).toHaveAttribute("aria-pressed", "true");

  await page.keyboard.press("Control+K");
  await page.locator("#command-palette-search").fill("selection tool");
  await page.keyboard.press("Enter");
  await expect(page.locator("#timeline-selection-tool")).toHaveAttribute("aria-pressed", "true");

  await page.keyboard.press("Control+K");
  await page.locator("#command-palette-search").fill("easy ease");
  await expect(page.locator('[data-command-id="timeline.ease-smooth"]')).toBeEnabled();
  await page.keyboard.press("Enter");
  await expect(page.locator("#command-palette")).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator("#timeline-ease-smooth")).toHaveClass(/active/);

  expect(errors).toEqual([]);
});

test("sets explicit timeline playback speed from UI and command palette", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-playback-rate")).toHaveValue("1");
  await page.locator("#timeline-playback-rate").selectOption("0.5");
  await expect(page.locator("#timeline-playback-rate")).toHaveValue("0.5");

  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("l");
  await expect(page.locator("#status-line")).toContainText("Forward 0.5x");
  await expect(page.locator("#timeline-play-toggle")).toContainText("Pause 0.5x");

  await page.keyboard.press("l");
  await expect(page.locator("#status-line")).toContainText("Forward 1x");
  await expect(page.locator("#timeline-playback-rate")).toHaveValue("1");

  await page.keyboard.press("k");
  await expect(page.locator("#status-line")).toContainText("Ready");
  await expect(page.locator("#timeline-playback-rate")).toHaveValue("1");

  await page.locator("#timeline-playback-rate").selectOption("0.25");
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("j");
  await expect(page.locator("#status-line")).toContainText("Reverse 0.25x");

  await page.keyboard.press("k");
  await page.keyboard.press("Control+K");
  await page.locator("#command-palette-search").fill("speed 4x");
  await expect(page.locator('[data-command-id="timeline.speed-quad"]')).toBeVisible();
  await page.locator('[data-command-id="timeline.speed-quad"]').click();
  await expect(page.locator("#timeline-playback-rate")).toHaveValue("4");
  await expect(page.locator("#status-line")).toContainText("Ready");

  expect(errors).toEqual([]);
});

test("sequences object layer ranges from the command palette", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.keyboard.press("Control+K");
  await page.locator("#command-palette-search").fill("sequence object layers");
  await expect(page.locator('[data-command-id="timeline.sequence-layers"]')).toBeEnabled();
  await page.locator('[data-command-id="timeline.sequence-layers"]').click();

  await expect.poll(async () => Number(await page.locator("#timeline-work-start").inputValue())).toBe(1);
  await expect.poll(async () => Number(await page.locator("#timeline-work-end").inputValue())).toBeGreaterThan(1);
  await expect(page.locator("#timeline-selection")).toContainText("keyframe");

  expect(errors).toEqual([]);
});

test("reveals common timeline property rows with AE-style shortcuts", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const pressAltShortcut = async (key: string) => {
    await page.evaluate((shortcutKey) => {
      document.dispatchEvent(new KeyboardEvent("keydown", {
        key: shortcutKey,
        code: `Key${shortcutKey.toUpperCase()}`,
        altKey: true,
        bubbles: true
      }));
    }, key);
  };

  await page.goto("/");
  await pressAltShortcut("p");
  await expect(page.locator("#timeline-track-kind")).toHaveValue("position");
  await expect(page.locator("#timeline-row-search")).toHaveValue("position");
  await expect(page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="position"][data-track-axis="x"]')).toBeVisible();

  await pressAltShortcut("t");
  await expect(page.locator("#timeline-track-kind")).toHaveValue("objectOpacity");
  await expect(page.locator("#timeline-row-search")).toHaveValue("opacity");
  await expect(page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="objectOpacity"]')).toBeVisible();

  await pressAltShortcut("c");
  await expect(page.locator("#timeline-track-kind")).toHaveValue("objectColor");
  await expect(page.locator("#timeline-row-search")).toHaveValue("color");
  await expect(page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="objectColor"][data-track-axis="x"]')).toBeVisible();

  await pressAltShortcut("m");
  await expect(page.locator("#timeline-track-kind")).toHaveValue("objectColor");
  await expect(page.locator("#timeline-row-search")).toHaveValue("material");
  await expect(page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="objectColor"][data-track-axis="x"]')).toBeVisible();
  await expect(page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="objectRoughness"]')).toBeVisible();
  await expect(page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="objectTextureSource"]')).toBeVisible();

  await pressAltShortcut("u");
  await expect(page.locator("#timeline-track-kind")).toHaveValue("objectTextureSource");
  await expect(page.locator("#timeline-row-search")).toHaveValue("texture");
  await expect(page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="objectTextureSource"]')).toBeVisible();
  await expect(page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="objectTextureRepeat"][data-track-axis="x"]')).toBeVisible();

  await pressAltShortcut("r");
  await expect(page.locator("#timeline-track-kind")).toHaveValue("rotation");
  await expect(page.locator("#timeline-row-search")).toHaveValue("rotation");
  await expect(page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="rotation"][data-track-axis="y"]')).toBeVisible();

  await page.keyboard.press("Control+K");
  await page.locator("#command-palette-search").fill("reveal material");
  await page.keyboard.press("Enter");
  await expect(page.locator("#timeline-track-kind")).toHaveValue("objectColor");
  await expect(page.locator("#timeline-row-search")).toHaveValue("material");
  await expect(page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="objectMetalness"]')).toBeVisible();

  await page.keyboard.press("Control+K");
  await page.locator("#command-palette-search").fill("reveal scale");
  await page.keyboard.press("Enter");
  await expect(page.locator("#timeline-track-kind")).toHaveValue("scale");
  await expect(page.locator("#timeline-row-search")).toHaveValue("scale");
  await expect(page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="scale"][data-track-axis="z"]')).toBeVisible();

  expect(errors).toEqual([]);
});

test("runs timeline commands from the command palette", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#command-palette-btn")).toBeVisible();

  await page.keyboard.press("Control+K");
  await expect(page.locator("#command-palette")).toHaveClass(/open/);
  await page.locator("#command-palette-search").fill("paste keyframes");
  await expect(page.locator('[data-command-id="timeline.paste"]')).toBeDisabled();

  await page.locator("#command-palette-search").fill("set transform");
  await page.locator('[data-command-id="timeline.set-transform"]').click();
  await expect(page.locator("#command-palette")).not.toHaveClass(/open/);
  await expect(page.locator("#selection-summary")).toContainText("Keyframed");
  await expect(page.locator("#timeline-selection")).toContainText("Playhead keyframe active");

  await page.locator("#command-palette-btn").click();
  await expect(page.locator("#command-palette-search")).toBeFocused();
  await page.locator("#command-palette-search").fill("copy selected");
  await page.locator('[data-command-id="timeline.copy"]').click();
  await expect(page.locator("#timeline-paste-keyframes")).toBeEnabled();
  await expect(page.locator("#timeline-paste-insert-keyframes")).toBeEnabled();

  await page.keyboard.press("F3");
  await page.locator("#command-palette-search").fill("paste insert");
  await expect(page.locator('[data-command-id="timeline.paste-insert"]')).toBeEnabled();
  await page.keyboard.press("Escape");
  await expect(page.locator("#command-palette")).not.toHaveClass(/open/);

  expect(errors).toEqual([]);
});

test("keeps the playhead visible when follow playhead is enabled", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-follow-playhead")).toHaveAttribute("aria-pressed", "false");

  await page.evaluate(() => {
    const durationInput = document.querySelector<HTMLInputElement>("#timeline-duration");
    durationInput!.value = "30";
    durationInput!.dispatchEvent(new Event("change", { bubbles: true }));
    for (let index = 0; index < 6; index += 1) document.querySelector<HTMLButtonElement>("#timeline-zoom-in")!.click();
    document.querySelector<HTMLButtonElement>("#timeline-follow-playhead")!.click();
  });
  await expect(page.locator("#timeline-follow-playhead")).toHaveAttribute("aria-pressed", "true");
  await expect.poll(
    async () => page.locator("#timeline-canvas .scroll-container").evaluate((element) => element.scrollWidth - element.clientWidth),
    { timeout: 10_000 }
  ).toBeGreaterThan(0);

  const timelineScrollLeft = async () => page.locator("#timeline-canvas .scroll-container").evaluate((element) => element.scrollLeft);
  await page.evaluate(() => {
    const timeInput = document.querySelector<HTMLInputElement>("#timeline-current-time");
    timeInput!.value = "30";
    timeInput!.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect.poll(timelineScrollLeft, { timeout: 10_000 }).toBeGreaterThan(0);

  await page.reload();
  await expect(page.locator("#timeline-follow-playhead")).toHaveAttribute("aria-pressed", "true");
  expect(errors).toEqual([]);
});

test("uses the timeline overview to scrub and pan dense edits", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-overview-track")).toBeVisible();
  await page.locator("#timeline-duration").evaluate((input) => {
    (input as HTMLInputElement).value = "30";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-set-transform").click({ force: true });
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "10";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-set-transform").click({ force: true });
  await expect.poll(
    async () => page.locator(".timeline-overview-key").count(),
    { timeout: 10_000 }
  ).toBeGreaterThan(0);

  const timeAfterOverviewClick = await page.evaluate(() => {
    const track = document.querySelector<HTMLButtonElement>("#timeline-overview-track")!;
    const rect = track.getBoundingClientRect();
    const x = rect.left + rect.width * 0.5;
    const y = rect.top + rect.height * 0.5;
    track.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerId: 41, clientX: x, clientY: y }));
    track.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 0, pointerId: 41, clientX: x, clientY: y }));
    return Number(document.querySelector<HTMLInputElement>("#timeline-current-time")!.value);
  });
  expect(timeAfterOverviewClick).toBeGreaterThan(14.9);
  expect(timeAfterOverviewClick).toBeLessThan(15.1);

  for (let index = 0; index < 6; index += 1) await page.locator("#timeline-zoom-in").click({ force: true });
  await expect.poll(
    async () => page.locator("#timeline-canvas .scroll-container").evaluate((element) => element.scrollWidth - element.clientWidth),
    { timeout: 10_000 }
  ).toBeGreaterThan(0);
  const panResult = await page.evaluate(() => {
    const track = document.querySelector<HTMLButtonElement>("#timeline-overview-track")!;
    const viewport = document.querySelector<HTMLElement>("#timeline-overview-viewport")!;
    const scroller = document.querySelector<HTMLElement>("#timeline-canvas .scroll-container")!;
    const rect = viewport.getBoundingClientRect();
    const x = rect.left + rect.width * 0.5;
    const y = rect.top + rect.height * 0.5;
    const initialScroll = scroller.scrollLeft;
    track.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerId: 42, clientX: x, clientY: y }));
    track.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, button: 0, pointerId: 42, clientX: x + 160, clientY: y }));
    track.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 0, pointerId: 42, clientX: x + 160, clientY: y }));
    return { initialScroll, finalScroll: scroller.scrollLeft };
  });
  expect(panResult.finalScroll).toBeGreaterThan(panResult.initialScroll);
  expect(errors).toEqual([]);
});

test("clears the active timeline track from toolbar and command palette", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  await page.addInitScript(() => {
    const downloads: string[] = [];
    (window as unknown as { __sceneDownloads: string[] }).__sceneDownloads = downloads;
    const createObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (object: Blob | MediaSource) => {
      if (object instanceof Blob) {
        void object.text().then((text) => downloads.push(text));
      }
      return createObjectURL(object);
    };
  });
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-clear-track")).toBeDisabled();

  await page.keyboard.press("Control+K");
  await page.locator("#command-palette-search").fill("clear active track");
  await expect(page.locator('[data-command-id="timeline.clear-track"]')).toBeDisabled();
  await page.keyboard.press("Escape");

  await page.locator("#timeline-add-keyframe").click();
  await expect(page.locator("#timeline-selection")).toContainText("1 keyframe selected");
  await expect(page.locator("#timeline-clear-track")).toBeEnabled();

  await page.keyboard.press("Control+K");
  await page.locator("#command-palette-search").fill("clear active track");
  await expect(page.locator('[data-command-id="timeline.clear-track"]')).toBeEnabled();
  await page.keyboard.press("Enter");
  await expect(page.locator("#timeline-selection")).toContainText("No keyframe selected");
  await expect(page.locator("#timeline-clear-track")).toBeDisabled();

  await page.evaluate(() => document.querySelector<HTMLButtonElement>("#save-scene")?.click());
  const sceneText = await page.waitForFunction(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.at(-1) ?? null);
  const sceneJson = await sceneText.jsonValue();
  const sceneDocument = JSON.parse(sceneJson as string);
  const objectTimeline = sceneDocument.timeline.objects.find((object: { objectId: string }) => object.objectId === "object-1");
  expect(objectTimeline?.tracks.some((track: { kind: string }) => track.kind === "position") ?? false).toBe(false);
  expect(errors).toEqual([]);
});

test("toggles depth of field post processing controls", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  await page.addInitScript(() => {
    const downloads: string[] = [];
    (window as unknown as { __sceneDownloads: string[] }).__sceneDownloads = downloads;
    const createObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (object: Blob | MediaSource) => {
      if (object instanceof Blob) {
        void object.text().then((text) => downloads.push(text));
      }
      return createObjectURL(object);
    };
  });
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#post-dof-toggle")).not.toBeChecked();
  await expect(page.locator("#post-dof-focus")).toHaveValue("8");
  await expect(page.locator("#post-dof-aperture")).toHaveValue("0.025");
  await expect(page.locator("#post-dof-maxblur")).toHaveValue("0.012");
  await page.locator("#post-dof-toggle").check();
  await expect(page.locator("#renderer-mode")).toContainText("DOF On");
  await page.locator("#post-dof-focus").evaluate((input) => {
    (input as HTMLInputElement).value = "11.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#post-dof-aperture").evaluate((input) => {
    (input as HTMLInputElement).value = "0.04";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#post-dof-maxblur").evaluate((input) => {
    (input as HTMLInputElement).value = "0.025";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(page.locator("#post-dof-focus")).toHaveValue("11.5");
  await expect(page.locator("#post-dof-aperture")).toHaveValue("0.04");
  await expect(page.locator("#post-dof-maxblur")).toHaveValue("0.025");

  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>("#save-scene")?.click();
  });
  const sceneText = await page.waitForFunction(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.at(-1) ?? null);
  const sceneJson = await sceneText.jsonValue();
  const sceneDocument = JSON.parse(sceneJson as string);
  expect(sceneDocument.rendering.postProcessing.dof).toBe(true);
  expect(sceneDocument.rendering.postProcessing.dofFocus).toBe(11.5);
  expect(sceneDocument.rendering.postProcessing.dofAperture).toBe(0.04);
  expect(sceneDocument.rendering.postProcessing.dofMaxBlur).toBe(0.025);
  await page.locator("#post-dof-toggle").uncheck();
  await expect(page.locator("#renderer-mode")).toContainText("Post Off");
  expect(errors).toEqual([]);
});

test("toggles SSAO post processing controls", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  await page.addInitScript(() => {
    const downloads: string[] = [];
    (window as unknown as { __sceneDownloads: string[] }).__sceneDownloads = downloads;
    const createObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (object: Blob | MediaSource) => {
      if (object instanceof Blob) {
        void object.text().then((text) => downloads.push(text));
      }
      return createObjectURL(object);
    };
  });
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await page.locator("#post-fxaa-toggle").check();
  await expect(page.locator("#renderer-mode")).toContainText("FXAA On");
  await expect(page.locator("#post-ssao-toggle")).not.toBeChecked();
  await page.locator("#post-ssao-toggle").check();
  await expect(page.locator("#renderer-mode")).toContainText("FXAA On + SSAO On");
  await page.locator("#post-ssao-radius").evaluate((input) => {
    (input as HTMLInputElement).value = "12";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#post-ssao-max").evaluate((input) => {
    (input as HTMLInputElement).value = "0.18";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(page.locator("#post-ssao-radius")).toHaveValue("12");
  await expect(page.locator("#post-ssao-max")).toHaveValue("0.18");
  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>("#save-scene")?.click();
  });
  const sceneText = await page.waitForFunction(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.at(-1) ?? null);
  const sceneJson = await sceneText.jsonValue();
  const sceneDocument = JSON.parse(sceneJson as string);
  expect(sceneDocument.rendering.postProcessing.fxaa).toBe(true);
  expect(sceneDocument.rendering.postProcessing.ssao).toBe(true);
  expect(sceneDocument.rendering.postProcessing.ssaoRadius).toBe(12);
  expect(sceneDocument.rendering.postProcessing.ssaoMaxDistance).toBe(0.18);
  expect(errors).toEqual([]);
});

test("applies lighting presets and persists light rig values", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  await page.addInitScript(() => {
    const downloads: string[] = [];
    (window as unknown as { __sceneDownloads: string[] }).__sceneDownloads = downloads;
    const createObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (object: Blob | MediaSource) => {
      if (object instanceof Blob) {
        void object.text().then((text) => downloads.push(text));
      }
      return createObjectURL(object);
    };
  });
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.getByRole("button", { name: "Studio", exact: true })).toHaveClass(/active/);
  await page.getByRole("button", { name: "Product", exact: true }).click();
  await expect(page.getByRole("button", { name: "Product", exact: true })).toHaveClass(/active/);
  await expect(page.locator("#light-intensity")).toHaveValue("5.4");
  await expect(page.locator("#light-color")).toHaveValue("#ffffff");
  await expect(page.locator("#ambient-intensity")).toHaveValue("0.32");
  await expect(page.locator("#light-sweep")).not.toBeChecked();

  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>("#save-scene")?.click();
  });
  const sceneText = await page.waitForFunction(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.at(-1) ?? null);
  const sceneJson = await sceneText.jsonValue();
  const sceneDocument = JSON.parse(sceneJson as string);
  expect(sceneDocument.lights.active).toBe("directional");
  expect(sceneDocument.lights.shadows).toBe(true);
  expect(sceneDocument.lights.sweep).toBe(false);
  expect(sceneDocument.lights.ambientIntensity).toBeCloseTo(0.32, 3);
  expect(sceneDocument.lights.directional.color).toBe("#ffffff");
  expect(sceneDocument.lights.directional.intensity).toBeCloseTo(5.4, 3);
  expect(sceneDocument.lights.directional.position).toEqual([5, 8, 6]);
  expect(sceneDocument.lights.point.color).toBe("#cfe8ff");
  expect(sceneDocument.lights.point.position).toEqual([-5.5, 4.5, 3]);
  expect(errors).toEqual([]);
});

test("shows row key diamonds only at playhead keys", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  const positionRow = page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="position"][data-track-axis="x"]');
  const rowKey = positionRow.locator(".timeline-row-key");
  await expect(positionRow).toBeVisible();
  await expect(rowKey).toHaveAttribute("title", "Set key at playhead");
  await rowKey.click();
  await expect(rowKey).toHaveAttribute("title", "Update key at playhead");

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(rowKey).toHaveAttribute("title", "Set key at playhead");
  expect(errors).toEqual([]);
});

test("sets keyframes for visible timeline rows", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  await page.addInitScript(() => {
    const downloads: string[] = [];
    (window as unknown as { __sceneDownloads: string[] }).__sceneDownloads = downloads;
    const createObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (object: Blob | MediaSource) => {
      if (object instanceof Blob) {
        void object.text().then((text) => downloads.push(text));
      }
      return createObjectURL(object);
    };
  });
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await page.locator("#timeline-row-search").fill("texture");
  await expect(page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="objectTextureRepeat"][data-track-axis="x"]')).toBeVisible();
  await expect(page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="objectTextureOffset"][data-track-axis="x"]')).toBeVisible();
  await expect(page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="objectTextureRotation"]')).toBeVisible();
  await page.locator("#timeline-set-visible").click();
  await expect(page.locator("#timeline-key-label")).toContainText("selected keyframes");

  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>("#save-scene")?.click();
  });
  const sceneText = await page.waitForFunction(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.at(-1) ?? null);
  const sceneJson = await sceneText.jsonValue();
  const sceneDocument = JSON.parse(sceneJson as string);
  const objectTimeline = sceneDocument.timeline.objects.find((object: { objectId: string }) => object.objectId === "object-1");
  const keyedKinds = objectTimeline.tracks
    .filter((track: { keyframes: Array<{ time: number }> }) => track.keyframes.some((keyframe) => keyframe.time === 0))
    .map((track: { kind: string }) => track.kind);
  expect(keyedKinds).toEqual(expect.arrayContaining(["objectTextureRepeat", "objectTextureOffset", "objectTextureRotation"]));
  expect(keyedKinds).not.toContain("objectColor");
  expect(errors).toEqual([]);
});

test("selects keyframes on visible timeline rows", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await page.locator("#timeline-row-search").fill("texture");
  const visibleTextureRows = page.locator(
    '.timeline-track-label[data-track-kind="objectTextureSource"], ' +
    '.timeline-track-label[data-track-kind="objectTextureRepeat"], ' +
    '.timeline-track-label[data-track-kind="objectTextureOffset"], ' +
    '.timeline-track-label[data-track-kind="objectTextureRotation"]'
  );
  const visibleTrackCount = await visibleTextureRows.evaluateAll((rows) =>
    new Set(rows.map((row) => `${(row as HTMLElement).dataset.objectId}:${(row as HTMLElement).dataset.trackKind}`)).size
  );
  expect(visibleTrackCount).toBeGreaterThan(0);

  await page.locator("#timeline-set-visible").click();
  await expect(page.locator("#timeline-selection")).toContainText(`${visibleTrackCount} keyframes selected`);
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-set-visible").click();
  await expect(page.locator("#timeline-selection")).toContainText(`${visibleTrackCount} keyframes selected`);

  await page.locator("#timeline-select-visible").click();
  await expect(page.locator("#timeline-selection")).toContainText(`${visibleTrackCount * 2} keyframes selected`);
  await page.locator("#timeline-work-start").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-work-end").evaluate((input) => {
    (input as HTMLInputElement).value = "3";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("Control+Alt+Shift+A");
  await expect(page.locator("#timeline-selection")).toContainText(`${visibleTrackCount} keyframes selected`);
  expect(errors).toEqual([]);
});

test("selects visible-row keyframes at the playhead time", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  await page.addInitScript(() => {
    const downloads: string[] = [];
    (window as unknown as { __sceneDownloads: string[] }).__sceneDownloads = downloads;
    const createObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (object: Blob | MediaSource) => {
      if (object instanceof Blob) {
        void object.text().then((text) => downloads.push(text));
      }
      return createObjectURL(object);
    };
  });
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await page.locator("#timeline-row-search").fill("texture");
  const visibleTextureRows = page.locator(
    '.timeline-track-label[data-track-kind="objectTextureSource"], ' +
    '.timeline-track-label[data-track-kind="objectTextureRepeat"], ' +
    '.timeline-track-label[data-track-kind="objectTextureOffset"], ' +
    '.timeline-track-label[data-track-kind="objectTextureRotation"]'
  );
  const visibleTrackCount = await visibleTextureRows.evaluateAll((rows) =>
    new Set(rows.map((row) => `${(row as HTMLElement).dataset.objectId}:${(row as HTMLElement).dataset.trackKind}`)).size
  );
  expect(visibleTrackCount).toBeGreaterThan(0);

  await page.locator("#timeline-set-visible").click();
  await expect(page.locator("#timeline-selection")).toContainText(`${visibleTrackCount} keyframes selected`);
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-set-visible").click();
  await page.locator("#timeline-select-visible").click();
  await expect(page.locator("#timeline-selection")).toContainText(`${visibleTrackCount * 2} keyframes selected`);

  await page.locator("#timeline-select-time").click();
  await expect(page.locator("#timeline-selection")).toContainText(`${visibleTrackCount} keyframes selected`);
  await page.locator("#timeline-delete-keyframe").click();
  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>("#save-scene")?.click();
  });
  const sceneText = await page.waitForFunction(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.at(-1) ?? null);
  const sceneJson = await sceneText.jsonValue();
  const sceneDocument = JSON.parse(sceneJson as string);
  const objectTimeline = sceneDocument.timeline.objects.find((object: { objectId: string }) => object.objectId === "object-1");
  (["objectTextureSource", "objectTextureRepeat", "objectTextureOffset", "objectTextureRotation"] as const).forEach((kind) => {
    const track = objectTimeline.tracks.find((candidate: { kind: string }) => candidate.kind === kind);
    expect(track.keyframes.map((keyframe: { time: number }) => keyframe.time)).toEqual([0]);
  });

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.keyboard.press("Control+Alt+K");
  await expect(page.locator("#timeline-selection")).toContainText(`${visibleTrackCount} keyframes selected`);
  expect(errors).toEqual([]);
});

test("selects visible-row keyframes before and after the playhead", async ({ page }) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await page.locator("#timeline-row-search").fill("texture");
  const visibleTextureRows = page.locator(
    '.timeline-track-label[data-track-kind="objectTextureSource"], ' +
    '.timeline-track-label[data-track-kind="objectTextureRepeat"], ' +
    '.timeline-track-label[data-track-kind="objectTextureOffset"], ' +
    '.timeline-track-label[data-track-kind="objectTextureRotation"]'
  );
  const visibleTrackCount = await visibleTextureRows.evaluateAll((rows) =>
    new Set(rows.map((row) => `${(row as HTMLElement).dataset.objectId}:${(row as HTMLElement).dataset.trackKind}`)).size
  );
  expect(visibleTrackCount).toBeGreaterThan(0);

  for (const time of [0, 2, 4]) {
    await page.locator("#timeline-current-time").evaluate((input, value) => {
      (input as HTMLInputElement).value = String(value);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, time);
    await page.locator("#timeline-set-visible").click();
  }

  const runCommand = async (query: string) => {
    await page.keyboard.press("Control+K");
    await expect(page.locator("#command-palette-search")).toBeVisible();
    await page.locator("#command-palette-search").fill(query);
    await page.keyboard.press("Enter");
  };

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await runCommand("select visible row keys after playhead");
  await expect(page.locator("#timeline-selection")).toContainText(`${visibleTrackCount * 2} keyframes selected`);

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "3";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await runCommand("select visible row keys before playhead");
  await expect(page.locator("#timeline-selection")).toContainText(`${visibleTrackCount * 2} keyframes selected`);
  expect(errors).toEqual([]);
});

test("navigates keyframes on visible timeline rows", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await page.locator("#timeline-row-search").fill("texture");
  await expect(page.locator('.timeline-track-label[data-track-kind="objectTextureRepeat"]').first()).toBeVisible();
  await page.locator("#timeline-set-visible").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-set-visible").click();

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-next-visible-keyframe").click();
  await expect.poll(async () => Number(await page.locator("#timeline-current-time").inputValue())).toBe(2);
  await page.locator("#timeline-prev-visible-keyframe").click();
  await expect.poll(async () => Number(await page.locator("#timeline-current-time").inputValue())).toBe(0);

  await page.keyboard.press("Control+Alt+ArrowRight");
  await expect.poll(async () => Number(await page.locator("#timeline-current-time").inputValue())).toBe(2);
  await page.keyboard.press("Control+Alt+ArrowLeft");
  await expect.poll(async () => Number(await page.locator("#timeline-current-time").inputValue())).toBe(0);
  expect(errors).toEqual([]);
});

test("duplicates visible-row keyframes at the playhead time", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  await page.addInitScript(() => {
    const downloads: string[] = [];
    (window as unknown as { __sceneDownloads: string[] }).__sceneDownloads = downloads;
    const createObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (object: Blob | MediaSource) => {
      if (object instanceof Blob) {
        void object.text().then((text) => downloads.push(text));
      }
      return createObjectURL(object);
    };
  });
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await page.locator("#timeline-row-search").fill("cube texture");
  await expect(page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="objectTextureRepeat"][data-track-axis="x"]')).toBeVisible();
  await page.locator("#timeline-set-visible").click();
  await expect(page.locator("#timeline-selection")).toContainText("3 keyframes selected");
  await page.locator("#timeline-duplicate-time").click();
  await expect(page.locator("#timeline-selection")).toContainText("3 keyframes selected");

  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>("#save-scene")?.click();
  });
  const sceneText = await page.waitForFunction(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.at(-1) ?? null);
  const sceneJson = await sceneText.jsonValue();
  const sceneDocument = JSON.parse(sceneJson as string);
  const objectTimeline = sceneDocument.timeline.objects.find((object: { objectId: string }) => object.objectId === "object-1");
  (["objectTextureRepeat", "objectTextureOffset", "objectTextureRotation"] as const).forEach((kind) => {
    const track = objectTimeline.tracks.find((candidate: { kind: string }) => candidate.kind === kind);
    expect(track.keyframes.map((keyframe: { time: number }) => keyframe.time)).toEqual([0, 0.033]);
  });
  expect(errors).toEqual([]);
});

test("deletes visible-row keyframes at the playhead time", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  await page.addInitScript(() => {
    const downloads: string[] = [];
    (window as unknown as { __sceneDownloads: string[] }).__sceneDownloads = downloads;
    const createObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (object: Blob | MediaSource) => {
      if (object instanceof Blob) {
        void object.text().then((text) => downloads.push(text));
      }
      return createObjectURL(object);
    };
  });
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await page.locator("#timeline-row-search").fill("cube texture");
  await expect(page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="objectTextureRepeat"][data-track-axis="x"]')).toBeVisible();
  await page.locator("#timeline-set-visible").click();
  await page.locator("#timeline-duplicate-time").click();
  await page.locator("#timeline-delete-time").click();
  await expect(page.locator("#timeline-selection")).toContainText("No keyframe selected");

  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>("#save-scene")?.click();
  });
  const sceneText = await page.waitForFunction(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.at(-1) ?? null);
  const sceneJson = await sceneText.jsonValue();
  const sceneDocument = JSON.parse(sceneJson as string);
  const objectTimeline = sceneDocument.timeline.objects.find((object: { objectId: string }) => object.objectId === "object-1");
  (["objectTextureRepeat", "objectTextureOffset", "objectTextureRotation"] as const).forEach((kind) => {
    const track = objectTimeline.tracks.find((candidate: { kind: string }) => candidate.kind === kind);
    expect(track.keyframes.map((keyframe: { time: number }) => keyframe.time)).toEqual([0.033]);
  });
  expect(errors).toEqual([]);
});

test("copies visible-row keyframes at the playhead time for paste", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  await page.addInitScript(() => {
    const downloads: string[] = [];
    (window as unknown as { __sceneDownloads: string[] }).__sceneDownloads = downloads;
    const createObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (object: Blob | MediaSource) => {
      if (object instanceof Blob) {
        void object.text().then((text) => downloads.push(text));
      }
      return createObjectURL(object);
    };
  });
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await page.locator("#timeline-row-search").fill("cube texture");
  await expect(page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="objectTextureRepeat"][data-track-axis="x"]')).toBeVisible();
  await page.locator("#timeline-set-visible").click();
  await page.locator("#timeline-copy-time").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-paste-keyframes").click();
  await expect(page.locator("#timeline-selection")).toContainText("3 keyframes selected");

  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>("#save-scene")?.click();
  });
  const sceneText = await page.waitForFunction(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.at(-1) ?? null);
  const sceneJson = await sceneText.jsonValue();
  const sceneDocument = JSON.parse(sceneJson as string);
  const objectTimeline = sceneDocument.timeline.objects.find((object: { objectId: string }) => object.objectId === "object-1");
  (["objectTextureRepeat", "objectTextureOffset", "objectTextureRotation"] as const).forEach((kind) => {
    const track = objectTimeline.tracks.find((candidate: { kind: string }) => candidate.kind === kind);
    expect(track.keyframes.map((keyframe: { time: number }) => keyframe.time)).toEqual([0, 1]);
  });
  expect(errors).toEqual([]);
});

test("pastes visible-time object keys back to their original objects", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  await page.addInitScript(() => {
    const downloads: string[] = [];
    (window as unknown as { __sceneDownloads: string[] }).__sceneDownloads = downloads;
    const createObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (object: Blob | MediaSource) => {
      if (object instanceof Blob) {
        void object.text().then((text) => downloads.push(text));
      }
      return createObjectURL(object);
    };
  });
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await page.locator("#timeline-row-filter").selectOption("all");
  await page.locator("#timeline-row-search").fill("position");
  await expect(page.getByRole("button", { name: "Cube Position X", exact: true })).toBeVisible();
  await expect.poll(async () =>
    page.locator('.timeline-track-label[data-track-kind="position"][data-track-axis="x"][data-object-id]').count()
  ).toBeGreaterThan(1);
  await page.locator("#timeline-set-visible").click();
  await page.locator("#timeline-copy-time").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-paste-keyframes").click();

  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>("#save-scene")?.click();
  });
  const sceneText = await page.waitForFunction(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.at(-1) ?? null);
  const sceneJson = await sceneText.jsonValue();
  const sceneDocument = JSON.parse(sceneJson as string);
  const objectPositionTimelines = sceneDocument.timeline.objects
    .map((objectTimeline: { objectId: string; tracks: Array<{ kind: string; keyframes: Array<{ time: number }> }> }) => ({
      objectId: objectTimeline.objectId,
      positionTrack: objectTimeline.tracks.find((track) => track.kind === "position")
    }))
    .filter((objectTimeline: { positionTrack?: { keyframes: Array<{ time: number }> } }) => objectTimeline.positionTrack);
  expect(objectPositionTimelines.length).toBeGreaterThan(1);
  objectPositionTimelines.forEach(({ positionTrack }: { positionTrack: { keyframes: Array<{ time: number }> } }) => {
    expect(positionTrack.keyframes.map((keyframe) => keyframe.time)).toEqual([0, 1]);
  });
  expect(errors).toEqual([]);
});

test("pastes compatible keys when an unrelated active track is locked", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  await page.addInitScript(() => {
    const downloads: string[] = [];
    (window as unknown as { __sceneDownloads: string[] }).__sceneDownloads = downloads;
    const createObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (object: Blob | MediaSource) => {
      if (object instanceof Blob) {
        void object.text().then((text) => downloads.push(text));
      }
      return createObjectURL(object);
    };
  });
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await page.locator("#timeline-set-transform").click();
  await page.locator("#timeline-copy-keyframes").click();
  await page.locator("#timeline-track-kind").selectOption("rotation");
  await page.locator("#timeline-lock-track").click();
  await expect(page.locator("#timeline-lock-track")).toContainText("Locked");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-paste-keyframes").click();

  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>("#save-scene")?.click();
  });
  const sceneText = await page.waitForFunction(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.at(-1) ?? null);
  const sceneJson = await sceneText.jsonValue();
  const sceneDocument = JSON.parse(sceneJson as string);
  const objectTimeline = sceneDocument.timeline.objects.find((object: { objectId: string }) => object.objectId === "object-1");
  const trackTimes = (kind: string) =>
    objectTimeline.tracks
      .find((track: { kind: string }) => track.kind === kind)
      ?.keyframes.map((keyframe: { time: number }) => keyframe.time) ?? [];
  expect(trackTimes("position")).toEqual([0, 1]);
  expect(trackTimes("rotation")).toEqual([0]);
  expect(trackTimes("scale")).toEqual([0]);
  expect(errors).toEqual([]);
});

test("cuts visible-row keyframes at the playhead time for paste", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  await page.addInitScript(() => {
    const downloads: string[] = [];
    (window as unknown as { __sceneDownloads: string[] }).__sceneDownloads = downloads;
    const createObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (object: Blob | MediaSource) => {
      if (object instanceof Blob) {
        void object.text().then((text) => downloads.push(text));
      }
      return createObjectURL(object);
    };
  });
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await page.locator("#timeline-row-search").fill("cube texture");
  await expect(page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="objectTextureRepeat"][data-track-axis="x"]')).toBeVisible();
  await page.locator("#timeline-set-visible").click();
  await expect(page.locator("#timeline-timecode")).toContainText("3 visible keys");
  await page.locator("#timeline-duplicate-time").click();
  await page.locator("#timeline-cut-time").click();
  await expect(page.locator("#timeline-timecode")).toContainText("0 visible keys");
  await expect(page.locator("#timeline-copy-time")).toBeDisabled();
  await expect(page.locator("#timeline-cut-time")).toBeDisabled();
  await expect(page.locator("#timeline-duplicate-time")).toBeDisabled();
  await expect(page.locator("#timeline-delete-time")).toBeDisabled();
  await expect(page.locator("#timeline-selection")).toContainText("No keyframe selected");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-paste-keyframes").click();
  await expect(page.locator("#timeline-timecode")).toContainText("3 visible keys");
  await expect(page.locator("#timeline-copy-time")).toBeEnabled();
  await expect(page.locator("#timeline-cut-time")).toBeEnabled();
  await expect(page.locator("#timeline-duplicate-time")).toBeEnabled();
  await expect(page.locator("#timeline-delete-time")).toBeEnabled();
  await expect(page.locator("#timeline-selection")).toContainText("3 keyframes selected");

  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>("#save-scene")?.click();
  });
  const sceneText = await page.waitForFunction(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.at(-1) ?? null);
  const sceneJson = await sceneText.jsonValue();
  const sceneDocument = JSON.parse(sceneJson as string);
  const objectTimeline = sceneDocument.timeline.objects.find((object: { objectId: string }) => object.objectId === "object-1");
  (["objectTextureRepeat", "objectTextureOffset", "objectTextureRotation"] as const).forEach((kind) => {
    const track = objectTimeline.tracks.find((candidate: { kind: string }) => candidate.kind === kind);
    expect(track.keyframes.map((keyframe: { time: number }) => keyframe.time)).toEqual([0.033, 1]);
  });
  expect(errors).toEqual([]);
});

test("expands vector timeline tracks into channel rows", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await page.locator("#timeline-row-filter").selectOption("all");

  const objectColorR = page.locator('.timeline-track-label[data-track-kind="objectColor"][data-track-axis="x"]').first();
  const textureRepeatU = page.locator('.timeline-track-label[data-track-kind="objectTextureRepeat"][data-track-axis="x"]').first();
  const cameraFov = page.locator('.camera-track-label[data-track-kind="cameraLens"][data-track-axis="x"]').first();
  const cameraNear = page.locator('.camera-track-label[data-track-kind="cameraLens"][data-track-axis="y"]').first();
  const sunColorB = page.locator('.light-track-label[data-track-kind="directionalColor"][data-track-axis="z"]').first();

  await expect(objectColorR).toBeVisible();
  await expect(objectColorR.locator(".track-label-text small")).toContainText("Color R");
  await expect(textureRepeatU).toBeVisible();
  await expect(textureRepeatU.locator(".track-label-text small")).toContainText("Texture Repeat U");
  await expect(page.locator('.timeline-track-label[data-track-kind="objectTextureRepeat"][data-track-axis="z"]')).toHaveCount(0);
  await expect(cameraFov).toBeVisible();
  await expect(cameraFov.locator(".track-label-text small")).toContainText("Camera Lens FOV");
  await expect(cameraNear.locator(".track-label-text small")).toContainText("Camera Lens Near");
  await expect(sunColorB).toBeVisible();
  await expect(sunColorB.locator(".track-label-text small")).toContainText("Sun Color B");

  await cameraFov.locator(".timeline-row-key").click();
  await expect(page.locator("#timeline-track-kind")).toHaveValue("cameraLens");
  await expect(page.locator("#timeline-key-label")).toContainText("Camera | Camera Lens FOV");
  await expect(page.locator("#timeline-key-x-label")).toContainText("FOV");
  await expect(page.locator("#timeline-key-x")).toBeEnabled();
  await expect(page.locator("#timeline-key-y")).toBeDisabled();
  await page.locator("#timeline-graph-toggle").click();
  await expect(page.locator("#timeline-graph-title")).toContainText("Camera | Camera Lens FOV");

  await page.locator("#timeline-row-search").fill("texture repeat u");
  await expect(page.locator('.timeline-track-label[data-track-kind="objectTextureRepeat"][data-track-axis="x"]').first()).toBeVisible();
  await expect(page.locator('.timeline-track-label[data-track-kind="objectTextureRepeat"][data-track-axis="y"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("trims and splits selected object layers", async ({ page }) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  await page.addInitScript(() => {
    const downloads: string[] = [];
    (window as unknown as { __sceneDownloads: string[] }).__sceneDownloads = downloads;
    const createObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (object: Blob | MediaSource) => {
      if (object instanceof Blob) {
        void object.text().then((text) => downloads.push(text));
      }
      return createObjectURL(object);
    };
  });
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const exportedScene = async () => {
    const previousCount = await page.evaluate(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.length ?? 0);
    await page.evaluate(() => {
      document.querySelector<HTMLButtonElement>("#save-scene")?.click();
    });
    const sceneText = await page.waitForFunction((count) => {
      const downloads = (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads;
      return downloads && downloads.length > count ? downloads.at(-1) : null;
    }, previousCount);
    const sceneJson = await sceneText.jsonValue();
    return JSON.parse(sceneJson as string);
  };
  const objectTrack = (sceneDocument: {
    timeline: { objects: Array<{ objectId: string; tracks: Array<{ kind: string; keyframes: Array<{ time: number; value: number[]; interpolation: string }> }> }> };
  }, objectId: string, kind: string) =>
    sceneDocument.timeline.objects
      .find((object) => object.objectId === objectId)
      ?.tracks.find((track) => track.kind === kind);
  const visibilityTrack = (sceneDocument: {
    timeline: { objects: Array<{ objectId: string; tracks: Array<{ kind: string; keyframes: Array<{ time: number; value: number[]; interpolation: string }> }> }> };
  }, objectId: string) => objectTrack(sceneDocument, objectId, "objectVisibility");
  const dragLayerBarPart = async (objectId: string, part: "body" | "start" | "end", deltaSeconds: number) => {
    const strip = page.locator("#timeline-layer-strip");
    const bar = page.locator(`.timeline-layer-bar[data-object-id="${objectId}"]`);
    const stripBox = await strip.boundingBox();
    const target = part === "start"
      ? bar.locator('[data-layer-action="trim-start"]')
      : part === "end"
        ? bar.locator('[data-layer-action="trim-end"]')
        : bar;
    const targetBox = await target.boundingBox();
    expect(stripBox).toBeTruthy();
    expect(targetBox).toBeTruthy();
    const startX = targetBox!.x + targetBox!.width / 2;
    const startY = targetBox!.y + targetBox!.height / 2;
    const deltaX = stripBox!.width * (deltaSeconds / 8);
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + deltaX, startY, { steps: 6 });
    await page.mouse.up();
  };

  await page.goto("/");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-add-keyframe").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-add-keyframe").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-layer-in").click();
  await expect(page.locator("#timeline-key-label")).toContainText("selected keyframes");
  await expect(page.locator('.timeline-layer-bar[data-object-id="object-1"]')).toHaveAttribute("data-layer-start", "2");
  await expect(page.locator('.timeline-layer-bar[data-object-id="object-1"]')).toHaveAttribute("data-layer-end", "8");
  let sceneDocument = await exportedScene();
  let track = visibilityTrack(sceneDocument, "object-1");
  expect(track?.keyframes.map((keyframe) => [keyframe.time, keyframe.value[0], keyframe.interpolation])).toEqual([
    [0, 0, "hold"],
    [2, 1, "hold"]
  ]);
  await page.locator("#timeline-layer-work").click();
  await expect.poll(async () => Number(await page.locator("#timeline-work-start").inputValue())).toBe(2);
  await expect.poll(async () => Number(await page.locator("#timeline-work-end").inputValue())).toBe(8);

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-layer-out").click();
  await expect(page.locator('.timeline-layer-bar[data-object-id="object-1"]')).toHaveAttribute("data-layer-start", "0");
  await expect(page.locator('.timeline-layer-bar[data-object-id="object-1"]')).toHaveAttribute("data-layer-end", "5");
  sceneDocument = await exportedScene();
  track = visibilityTrack(sceneDocument, "object-1");
  expect(track?.keyframes.map((keyframe) => [keyframe.time, keyframe.value[0], keyframe.interpolation])).toEqual([
    [0, 1, "hold"],
    [5, 0, "hold"]
  ]);
  await page.locator("#timeline-snap-step").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await dragLayerBarPart("object-1", "end", 1);
  await expect(page.locator('.timeline-layer-bar[data-object-id="object-1"]')).toHaveAttribute("data-layer-end", "6");
  sceneDocument = await exportedScene();
  track = visibilityTrack(sceneDocument, "object-1");
  let positionTrack = objectTrack(sceneDocument, "object-1", "position");
  expect(track?.keyframes.map((keyframe) => [keyframe.time, keyframe.value[0], keyframe.interpolation])).toEqual([
    [0, 1, "hold"],
    [6, 0, "hold"]
  ]);
  expect(positionTrack?.keyframes.map((keyframe) => keyframe.time)).toEqual([1, 2]);
  await dragLayerBarPart("object-1", "body", 1);
  await expect(page.locator('.timeline-layer-bar[data-object-id="object-1"]')).toHaveAttribute("data-layer-start", "1");
  await expect(page.locator('.timeline-layer-bar[data-object-id="object-1"]')).toHaveAttribute("data-layer-end", "7");
  sceneDocument = await exportedScene();
  track = visibilityTrack(sceneDocument, "object-1");
  positionTrack = objectTrack(sceneDocument, "object-1", "position");
  expect(track?.keyframes.map((keyframe) => [keyframe.time, keyframe.value[0], keyframe.interpolation])).toEqual([
    [0, 0, "hold"],
    [1, 1, "hold"],
    [7, 0, "hold"]
  ]);
  expect(positionTrack?.keyframes.map((keyframe) => keyframe.time)).toEqual([2, 3]);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("Alt+I");
  await expect.poll(async () => Number(await page.locator("#timeline-current-time").inputValue())).toBe(1);
  await page.keyboard.press("Alt+O");
  await expect.poll(async () => Number(await page.locator("#timeline-current-time").inputValue())).toBe(7);

  await page.reload();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "3";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("Control+Shift+D");
  sceneDocument = await exportedScene();
  const splitObject = sceneDocument.objects.find((object: { name: string; id: string }) => object.name === "Cube Split");
  expect(splitObject).toBeTruthy();
  const splitObjectId = splitObject!.id;
  const beforeTrack = visibilityTrack(sceneDocument, "object-1");
  const afterTrack = visibilityTrack(sceneDocument, splitObjectId);
  expect(sceneDocument.selectedId).toBe(splitObjectId);
  expect(beforeTrack?.keyframes.map((keyframe) => [keyframe.time, keyframe.value[0], keyframe.interpolation])).toEqual([
    [0, 1, "hold"],
    [3, 0, "hold"]
  ]);
  expect(afterTrack?.keyframes.map((keyframe) => [keyframe.time, keyframe.value[0], keyframe.interpolation])).toEqual([
    [0, 0, "hold"],
    [3, 1, "hold"]
  ]);
  await expect(page.locator(`.timeline-layer-bar[data-object-id="${splitObjectId}"]`)).toContainText("Cube Split");
  await page.locator('.timeline-layer-bar[data-object-id="object-1"]').click();
  await expect(page.locator("#selection-summary")).toContainText("Cube");
  await expect(page.locator("#timeline-selection")).toContainText("4 keyframes selected");
  expect(errors).toEqual([]);
});

test("sequences object layer ranges from the playhead", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  await page.addInitScript(() => {
    const downloads: string[] = [];
    (window as unknown as { __sceneDownloads: string[] }).__sceneDownloads = downloads;
    const createObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (object: Blob | MediaSource) => {
      if (object instanceof Blob) {
        void object.text().then((text) => downloads.push(text));
      }
      return createObjectURL(object);
    };
  });
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const exportedScene = async () => {
    const previousCount = await page.evaluate(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.length ?? 0);
    await page.evaluate(() => {
      document.querySelector<HTMLButtonElement>("#save-scene")?.click();
    });
    const sceneText = await page.waitForFunction((count) => {
      const downloads = (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads;
      return downloads && downloads.length > count ? downloads.at(-1) : null;
    }, previousCount);
    const sceneJson = await sceneText.jsonValue();
    return JSON.parse(sceneJson as string);
  };
  const objectTrack = (sceneDocument: {
    timeline: { objects: Array<{ objectId: string; tracks: Array<{ kind: string; keyframes: Array<{ time: number; value: number[]; interpolation: string }> }> }> };
  }, objectId: string, kind: string) =>
    sceneDocument.timeline.objects
      .find((object) => object.objectId === objectId)
      ?.tracks.find((track) => track.kind === kind);

  await page.goto("/");
  await expect(page.locator("#timeline-sequence-layers")).toBeVisible();
  await page.evaluate(() => document.querySelector<HTMLButtonElement>("#timeline-sequence-layers")?.click());
  await expect.poll(async () => Number(await page.locator("#timeline-duration").inputValue())).toBe(24);
  await expect.poll(async () => Number(await page.locator("#timeline-work-start").inputValue())).toBe(0);
  await expect.poll(async () => Number(await page.locator("#timeline-work-end").inputValue())).toBe(24);
  await expect(page.locator('.timeline-layer-bar[data-object-id="object-1"]')).toHaveAttribute("data-layer-start", "0");
  await expect(page.locator('.timeline-layer-bar[data-object-id="object-1"]')).toHaveAttribute("data-layer-end", "8");
  await expect(page.locator('.timeline-layer-bar[data-object-id="object-2"]')).toHaveAttribute("data-layer-start", "8");
  await expect(page.locator('.timeline-layer-bar[data-object-id="object-2"]')).toHaveAttribute("data-layer-end", "16");
  await expect(page.locator('.timeline-layer-bar[data-object-id="object-3"]')).toHaveAttribute("data-layer-start", "16");
  await expect(page.locator('.timeline-layer-bar[data-object-id="object-3"]')).toHaveAttribute("data-layer-end", "24");
  await expect(page.locator("#timeline-selection")).toContainText("7 keyframes selected");

  await page.evaluate(() => document.querySelector<HTMLElement>('.timeline-layer-bar[data-object-id="object-2"]')?.click());
  await expect(page.locator("#selection-summary")).toContainText("Wheel Torus");
  await page.locator("#timeline-snap").uncheck();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "14";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.evaluate(() => document.querySelector<HTMLButtonElement>("#timeline-layer-out")?.click());
  await expect(page.locator('.timeline-layer-bar[data-object-id="object-2"]')).toHaveAttribute("data-layer-start", "0");
  await expect(page.locator('.timeline-layer-bar[data-object-id="object-2"]')).toHaveAttribute("data-layer-end", "14");
  await page.evaluate(() => document.querySelector<HTMLButtonElement>("#timeline-fit-layer-keys")?.click());
  await expect(page.locator("#timeline-selection")).toContainText("2 keyframes selected");
  const fittedSceneDocument = await exportedScene();
  expect(objectTrack(fittedSceneDocument, "object-1", "objectVisibility")?.keyframes.map((keyframe) => [keyframe.time, keyframe.value[0]])).toEqual([
    [0, 1],
    [8, 0]
  ]);
  expect(objectTrack(fittedSceneDocument, "object-2", "objectVisibility")?.keyframes.map((keyframe) => [keyframe.time, keyframe.value[0]])).toEqual([
    [0, 1],
    [14, 0]
  ]);
  expect(objectTrack(fittedSceneDocument, "object-2", "rotation")?.keyframes.map((keyframe) => keyframe.time)).toEqual([0, 14]);
  expect(objectTrack(fittedSceneDocument, "object-3", "scale")?.keyframes.map((keyframe) => keyframe.time)).toEqual([16, 20, 24]);

  await page.locator("#timeline-select-layer-keys").click();
  await expect(page.locator("#timeline-selection")).toContainText("4 keyframes selected");

  await page.keyboard.press("Control+K");
  await page.locator("#command-palette-search").fill("selected layer keyframes");
  await expect(page.locator('[data-command-id="timeline.select-layer-keys"]')).toBeEnabled();
  await page.keyboard.press("Escape");
  await page.keyboard.press("Control+K");
  await page.locator("#command-palette-search").fill("fit selected layer");
  await expect(page.locator('[data-command-id="timeline.fit-layer-keys"]')).toBeEnabled();
  await page.keyboard.press("Escape");

  await page.keyboard.press("Control+K");
  await page.locator("#command-palette-search").fill("sequence object layers");
  await expect(page.locator('[data-command-id="timeline.sequence-layers"]')).toBeEnabled();
  expect(errors).toEqual([]);
});

test("sets transform keys from inspector diamonds", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  const positionKey = page.locator('.transform-key-button[data-prop="position"]');
  const rotationKey = page.locator('.transform-key-button[data-prop="rotation"]');
  await expect(positionKey).toHaveAttribute("title", "Set key at playhead");
  await positionKey.click();
  await expect(page.locator("#timeline-track-kind")).toHaveValue("position");
  await expect(page.locator("#timeline-key-label")).toContainText("Cube | Position");
  await expect(positionKey).toHaveAttribute("title", "Update key at playhead");

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(positionKey).toHaveAttribute("title", "Set key at playhead");
  await page.locator('.transform-input[data-prop="position"][data-axis="x"]').evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await positionKey.click();
  await expect(positionKey).toHaveAttribute("title", "Update key at playhead");
  await expect(page.locator("#motion-path-toggle")).toBeChecked();

  await page.locator('.transform-input[data-prop="rotation"][data-axis="y"]').evaluate((input) => {
    (input as HTMLInputElement).value = "45";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await rotationKey.click();
  await expect(page.locator("#timeline-track-kind")).toHaveValue("rotation");
  await expect(page.locator("#timeline-key-label")).toContainText("Cube | Rotation");
  await expect(rotationKey).toHaveAttribute("title", "Update key at playhead");
  expect(errors).toEqual([]);
});

test("seeds initial pose for first transform auto-key edit", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  await page.addInitScript(() => {
    const downloads: string[] = [];
    (window as unknown as { __sceneDownloads: string[] }).__sceneDownloads = downloads;
    const createObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (object: Blob | MediaSource) => {
      if (object instanceof Blob) {
        void object.text().then((text) => downloads.push(text));
      }
      return createObjectURL(object);
    };
  });
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await page.locator("#timeline-auto-key").check();
  await expect(page.locator("#keyframe-dock")).toHaveClass(/auto-key-active/);
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator('.transform-input[data-prop="position"][data-axis="x"]').evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(Number(await page.locator('.transform-input[data-prop="position"][data-axis="x"]').inputValue())).toBeCloseTo(1, 1);

  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>("#save-scene")?.click();
  });
  const sceneText = await page.waitForFunction(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.at(-1) ?? null);
  const sceneDocument = JSON.parse((await sceneText.jsonValue()) as string);
  const positionTrack = sceneDocument.timeline.objects
    .find((object: { objectId: string }) => object.objectId === "object-1")
    .tracks.find((track: { kind: string }) => track.kind === "position");
  expect(positionTrack.keyframes).toHaveLength(2);
  expect(positionTrack.keyframes[0].time).toBe(0);
  expect(positionTrack.keyframes[0].value[0]).toBe(0);
  expect(positionTrack.keyframes[1].time).toBe(1);
  expect(positionTrack.keyframes[1].value[0]).toBe(2);
  expect(errors).toEqual([]);
});

test("seeds initial camera value for first camera auto-key edit", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  await page.addInitScript(() => {
    const downloads: string[] = [];
    (window as unknown as { __sceneDownloads: string[] }).__sceneDownloads = downloads;
    const createObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (object: Blob | MediaSource) => {
      if (object instanceof Blob) {
        void object.text().then((text) => downloads.push(text));
      }
      return createObjectURL(object);
    };
  });
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  const cameraX = page.locator('.camera-input[data-group="position"][data-prop="x"]');
  const startX = Number(await cameraX.inputValue());
  await page.locator("#timeline-auto-key").check();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await cameraX.evaluate((input, nextValue) => {
    (input as HTMLInputElement).value = String(nextValue);
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, startX + 2);

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(Number(await cameraX.inputValue())).toBeCloseTo(startX + 1, 1);

  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>("#save-scene")?.click();
  });
  const sceneText = await page.waitForFunction(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.at(-1) ?? null);
  const sceneDocument = JSON.parse((await sceneText.jsonValue()) as string);
  const positionTrack = sceneDocument.timeline.camera.tracks.find((track: { kind: string }) => track.kind === "cameraPosition");
  expect(positionTrack.keyframes).toHaveLength(2);
  expect(positionTrack.keyframes[0].time).toBe(0);
  expect(positionTrack.keyframes[0].value[0]).toBe(startX);
  expect(positionTrack.keyframes[1].time).toBe(1);
  expect(positionTrack.keyframes[1].value[0]).toBe(startX + 2);
  expect(errors).toEqual([]);
});

test("seeds initial light value for first light auto-key edit", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  await page.addInitScript(() => {
    const downloads: string[] = [];
    (window as unknown as { __sceneDownloads: string[] }).__sceneDownloads = downloads;
    const createObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (object: Blob | MediaSource) => {
      if (object instanceof Blob) {
        void object.text().then((text) => downloads.push(text));
      }
      return createObjectURL(object);
    };
  });
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await page.locator('[data-light="point"]').click();
  const intensity = page.locator("#light-intensity");
  const startIntensity = Number(await intensity.inputValue());
  await page.locator("#timeline-auto-key").check();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await intensity.evaluate((input, nextValue) => {
    (input as HTMLInputElement).value = String(nextValue);
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, startIntensity + 2);

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(Number(await intensity.inputValue())).toBeCloseTo(startIntensity + 1, 1);

  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>("#save-scene")?.click();
  });
  const sceneText = await page.waitForFunction(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.at(-1) ?? null);
  const sceneDocument = JSON.parse((await sceneText.jsonValue()) as string);
  const intensityTrack = sceneDocument.timeline.lights.tracks.find((track: { kind: string }) => track.kind === "pointIntensity");
  expect(intensityTrack.keyframes).toHaveLength(2);
  expect(intensityTrack.keyframes[0].time).toBe(0);
  expect(intensityTrack.keyframes[0].value[0]).toBe(startIntensity);
  expect(intensityTrack.keyframes[1].time).toBe(1);
  expect(intensityTrack.keyframes[1].value[0]).toBe(startIntensity + 2);
  expect(errors).toEqual([]);
});

test("seeds initial object property for first appearance auto-key edit", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  await page.addInitScript(() => {
    const downloads: string[] = [];
    (window as unknown as { __sceneDownloads: string[] }).__sceneDownloads = downloads;
    const createObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (object: Blob | MediaSource) => {
      if (object instanceof Blob) {
        void object.text().then((text) => downloads.push(text));
      }
      return createObjectURL(object);
    };
  });
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  const opacity = page.locator("#object-opacity");
  await page.locator("#timeline-auto-key").check();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await opacity.evaluate((input) => {
    (input as HTMLInputElement).value = "0.4";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(Number(await opacity.inputValue())).toBeCloseTo(0.7, 1);

  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>("#save-scene")?.click();
  });
  const sceneText = await page.waitForFunction(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.at(-1) ?? null);
  const sceneDocument = JSON.parse((await sceneText.jsonValue()) as string);
  const opacityTrack = sceneDocument.timeline.objects
    .find((object: { objectId: string }) => object.objectId === "object-1")
    .tracks.find((track: { kind: string }) => track.kind === "objectOpacity");
  expect(opacityTrack.keyframes).toHaveLength(2);
  expect(opacityTrack.keyframes[0].time).toBe(0);
  expect(opacityTrack.keyframes[0].value[0]).toBe(1);
  expect(opacityTrack.keyframes[1].time).toBe(1);
  expect(opacityTrack.keyframes[1].value[0]).toBe(0.4);
  expect(errors).toEqual([]);
});

test("imports OBJ with companion MTL files", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await page.locator("#model-input").setInputFiles([
    {
      name: "tea-cup.obj",
      mimeType: "text/plain",
      buffer: Buffer.from(`
mtllib tea-cup.mtl
o Cup
v 0 0 0
v 1 0 0
v 0 1 0
vt 0 0
vt 1 0
vt 0 1
vn 0 0 1
usemtl CupRed
f 1/1/1 2/2/1 3/3/1
`)
    },
    {
      name: "tea-cup.mtl",
      mimeType: "text/plain",
      buffer: Buffer.from(`
newmtl CupRed
Kd 0.85 0.12 0.08
Ks 0.2 0.2 0.2
Ns 42
`)
    }
  ]);

  await expect(page.locator(".outliner-item", { hasText: "tea cup" })).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("#selection-summary")).toContainText("tea cup");
  expect(errors).toEqual([]);
});

test("shows WebM work area recording progress", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.addInitScript(() => {
    class FakeMediaRecorder extends EventTarget {
      static isTypeSupported(): boolean {
        return true;
      }

      state: RecordingState = "inactive";
      private readonly mimeType: string;

      constructor(_stream: MediaStream, options?: MediaRecorderOptions) {
        super();
        this.mimeType = options?.mimeType ?? "video/webm";
      }

      start(): void {
        this.state = "recording";
      }

      stop(): void {
        this.state = "inactive";
        const dataEvent = new Event("dataavailable") as Event & { data: Blob };
        Object.defineProperty(dataEvent, "data", { value: new Blob(["webm"], { type: this.mimeType }) });
        this.dispatchEvent(dataEvent);
        this.dispatchEvent(new Event("stop"));
      }
    }

    Object.defineProperty(window, "MediaRecorder", { value: FakeMediaRecorder, configurable: true });
    Object.defineProperty(HTMLCanvasElement.prototype, "captureStream", {
      configurable: true,
      value: () => ({ getTracks: () => [{ stop: () => undefined }] })
    });
  });

  await page.goto("/");
  await page.locator("#record-video-btn").click();
  await expect(page.locator("#status-line")).toContainText(/Recording WebM \d+%/);
  await expect(page.locator("#record-video-btn")).toContainText(/Stop \d+%/);
  await page.locator("#record-video-btn").click();
  await expect(page.locator("#record-video-btn")).toContainText("Record WebM");
  await expect(page.locator("#status-line")).toContainText("Ready");
  expect(errors).toEqual([]);
});

test("shows live timeline row values while editing and scrubbing", async ({ page }) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  const positionXRowValue = page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="position"][data-track-axis="x"] .track-label-text small');
  const rotationYRowValue = page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="rotation"][data-track-axis="y"] .track-label-text small');
  await expect(positionXRowValue).toContainText("Position X | 0");
  await page.locator('.transform-input[data-prop="rotation"][data-axis="y"]').evaluate((input) => {
    (input as HTMLInputElement).value = "45";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(rotationYRowValue).toContainText("Rotation Y | 45");

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-set-transform").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator('.transform-input[data-prop="position"][data-axis="x"]').evaluate((input) => {
    (input as HTMLInputElement).value = "4";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-set-transform").click();
  await expect(positionXRowValue).toContainText("Position X | 4");

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(positionXRowValue).toContainText("Position X | 2");
  expect(errors).toEqual([]);
});

test("records grouped position rotation and scale keyframes", async ({ page }) => {
  test.setTimeout(480_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-set-transform")).toBeVisible();

  await page.locator("#timeline-set-transform").click();
  await expect(page.locator("#timeline-key-label")).toContainText("3 selected keyframes");
  await expect(page.locator("#timeline-track-kind")).toHaveValue("position");
  await expect(page.getByRole("button", { name: "Cube Position X", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cube Scale Z", exact: true })).toBeVisible();
  await expect(page.locator("#timeline-add-keyframe")).toContainText("Update Key");
  await page.locator("#timeline-track-kind").selectOption("rotation");
  await expect(page.locator("#timeline-add-keyframe")).toContainText("Update Key");
  await page.locator("#timeline-track-kind").selectOption("scale");
  await expect(page.locator("#timeline-add-keyframe")).toContainText("Update Key");

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator('.transform-input[data-prop="position"][data-axis="x"]').evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator('.transform-input[data-prop="rotation"][data-axis="y"]').evaluate((input) => {
    (input as HTMLInputElement).value = "90";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator('.transform-input[data-prop="scale"][data-axis="z"]').evaluate((input) => {
    (input as HTMLInputElement).value = "1.75";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-set-transform").click();

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  expect(Number(await page.locator('.transform-input[data-prop="position"][data-axis="x"]').inputValue())).toBeCloseTo(1, 1);
  expect(Number(await page.locator('.transform-input[data-prop="rotation"][data-axis="y"]').inputValue())).toBeCloseTo(45, 1);
  expect(Number(await page.locator('.transform-input[data-prop="scale"][data-axis="z"]').inputValue())).toBeCloseTo(1.375, 2);

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "4";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator('.transform-input[data-prop="position"][data-axis="x"]').evaluate((input) => {
    (input as HTMLInputElement).value = "4";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-set-transform").click();
  await page.locator("#timeline-track-kind").selectOption("position");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="position"][data-track-axis="x"] .timeline-row-key').click();
  await page.locator("#timeline-ease-hold").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="position"][data-track-axis="x"] .timeline-row-key').click();
  await page.locator("#timeline-ease-linear").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(Number(await page.locator('.transform-input[data-prop="position"][data-axis="x"]').inputValue())).toBeCloseTo(0, 1);
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "3";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(Number(await page.locator('.transform-input[data-prop="position"][data-axis="x"]').inputValue())).toBeCloseTo(3, 1);
  if (!(await page.locator("#timeline-graph-panel").isVisible())) {
    await page.locator("#timeline-graph-toggle").click();
  }
  await page.locator("#timeline-snap-step").evaluate((input) => {
    (input as HTMLInputElement).value = "0.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(page.locator("#timeline-graph-title")).toContainText("Cube | Position");
  await expect(page.locator("#timeline-graph-range")).toContainText("3 keys");
  await expect(page.locator("#timeline-graph-x")).not.toHaveAttribute("d", "");
  await page.getByRole("button", { name: "Cube Position X", exact: true }).click();
  if ((await page.locator("#timeline-toggle-track").textContent())?.includes("Track Off")) {
    await page.locator("#timeline-toggle-track").click();
  }
  await expect(page.locator("#timeline-graph-title")).toContainText("Cube | Position X");
  const middleGraphKey = page.locator('.timeline-graph-key.graph-x[data-key-time^="2"]').first();
  await expect(middleGraphKey).toBeVisible();
  const keyBox = await middleGraphKey.boundingBox();
  expect(keyBox).toBeTruthy();
  await page.mouse.move(keyBox!.x + keyBox!.width / 2, keyBox!.y + keyBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(keyBox!.x + keyBox!.width / 2 + 52, keyBox!.y - 22);
  await page.mouse.up();
  const movedKeyTime = Number(await page.locator(".timeline-graph-key.graph-x.selected").first().getAttribute("data-key-time"));
  expect(movedKeyTime).toBeGreaterThan(2.1);
  expect(movedKeyTime).toBeCloseTo(Math.round(movedKeyTime * 2) / 2, 2);
  await page.locator("#timeline-current-time").evaluate((input, time) => {
    (input as HTMLInputElement).value = String(time);
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, movedKeyTime);
  expect(Number(await page.locator('.transform-input[data-prop="position"][data-axis="x"]').inputValue())).toBeGreaterThan(2.1);
  await page.locator("#undo-btn").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(Number(await page.locator('.transform-input[data-prop="position"][data-axis="x"]').inputValue())).toBeCloseTo(2, 1);
  const restoredKey = page.locator('.timeline-graph-key.graph-x[data-key-time^="2"]').first();
  await expect(restoredKey).toBeVisible();
  const restoredBox = await restoredKey.boundingBox();
  expect(restoredBox).toBeTruthy();
  await page.mouse.move(restoredBox!.x + restoredBox!.width / 2, restoredBox!.y + restoredBox!.height / 2);
  await page.keyboard.down("Shift");
  await page.mouse.down();
  await page.mouse.move(restoredBox!.x + restoredBox!.width / 2 + 12, restoredBox!.y - 28);
  await page.mouse.up();
  await page.keyboard.up("Shift");
  const constrainedKeyTime = Number(await page.locator(".timeline-graph-key.graph-x.selected").first().getAttribute("data-key-time"));
  expect(constrainedKeyTime).toBeCloseTo(2, 2);
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(Number(await page.locator('.transform-input[data-prop="position"][data-axis="x"]').inputValue())).toBeGreaterThan(2.1);
  await page.locator("#undo-btn").click();
  await expect(page.locator("#timeline-graph-range")).toContainText("3 keys");
  const firstGraphKey = page.locator('.timeline-graph-key.graph-x[data-key-time="0"]').first();
  const middleGraphKeyAgain = page.locator('.timeline-graph-key.graph-x[data-key-time^="2"]').first();
  await expect(firstGraphKey).toBeVisible();
  await expect(middleGraphKeyAgain).toBeVisible();
  await firstGraphKey.click();
  await page.keyboard.down("Shift");
  await middleGraphKeyAgain.click();
  await page.keyboard.up("Shift");
  await expect(page.locator("#timeline-selection")).toContainText("2 keyframes selected");
  await page.keyboard.press("Delete");
  await expect(page.locator("#timeline-graph-range")).toContainText("1 key | add another key");
  await expect(page.locator("#selection-summary")).toContainText("Cube");
  await page.locator("#undo-btn").click();
  await expect(page.locator("#timeline-graph-range")).toContainText("3 keys");
  const deletableKey = page.locator('.timeline-graph-key.graph-x[data-key-time^="2"]').first();
  await expect(deletableKey).toBeVisible();
  await deletableKey.click();
  await page.keyboard.press("Delete");
  await expect(page.locator("#timeline-graph-range")).toContainText("2 keys");
  await expect(page.locator("#selection-summary")).toContainText("Cube");
  await expect(page.locator("#outliner")).toContainText("Cube");
  await page.locator("#undo-btn").click();
  await expect(page.locator("#timeline-graph-range")).toContainText("3 keys");
  await page.keyboard.press("Control+A");
  await expect(page.locator("#timeline-selection")).toContainText("3 keyframes selected");
  const selectedMiddleKey = page.locator('.timeline-graph-key.graph-x.selected[data-key-time^="2"]').first();
  await expect(selectedMiddleKey).toBeVisible();
  const selectedMiddleBox = await selectedMiddleKey.boundingBox();
  expect(selectedMiddleBox).toBeTruthy();
  await page.mouse.move(selectedMiddleBox!.x + selectedMiddleBox!.width / 2, selectedMiddleBox!.y + selectedMiddleBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(selectedMiddleBox!.x + selectedMiddleBox!.width / 2 + 56, selectedMiddleBox!.y + selectedMiddleBox!.height / 2);
  await page.mouse.up();
  const groupedTimes = await page.locator(".timeline-graph-key.graph-x.selected").evaluateAll((nodes) =>
    nodes.map((node) => Number((node as SVGElement).getAttribute("data-key-time"))).sort((left, right) => left - right)
  );
  expect(groupedTimes).toHaveLength(3);
  expect(groupedTimes[0]).toBeGreaterThan(0.1);
  expect(groupedTimes[1] - groupedTimes[0]).toBeCloseTo(2, 1);
  expect(groupedTimes[2] - groupedTimes[1]).toBeCloseTo(2, 1);
  await page.locator("#undo-btn").click();
  await expect(page.locator("#timeline-graph-range")).toContainText("3 keys");
  await page.locator("#timeline-snap-step").evaluate((input) => {
    (input as HTMLInputElement).value = "0.25";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.keyboard.press("Control+A");
  const stretchMiddleKey = page.locator('.timeline-graph-key.graph-x.selected[data-key-time^="2"]').first();
  await expect(stretchMiddleKey).toBeVisible();
  const stretchMiddleBox = await stretchMiddleKey.boundingBox();
  expect(stretchMiddleBox).toBeTruthy();
  await page.mouse.move(stretchMiddleBox!.x + stretchMiddleBox!.width / 2, stretchMiddleBox!.y + stretchMiddleBox!.height / 2);
  await page.keyboard.down("Alt");
  await page.mouse.down();
  await page.mouse.move(stretchMiddleBox!.x + stretchMiddleBox!.width / 2 + 76, stretchMiddleBox!.y + stretchMiddleBox!.height / 2);
  await page.mouse.up();
  await page.keyboard.up("Alt");
  const stretchedTimes = await page.locator(".timeline-graph-key.graph-x.selected").evaluateAll((nodes) =>
    nodes.map((node) => Number((node as SVGElement).getAttribute("data-key-time"))).sort((left, right) => left - right)
  );
  expect(stretchedTimes).toHaveLength(3);
  expect(stretchedTimes[0]).toBeCloseTo(0, 1);
  expect(stretchedTimes[1]).toBeGreaterThan(2.2);
  expect(stretchedTimes[2] - stretchedTimes[1]).toBeCloseTo(stretchedTimes[1] - stretchedTimes[0], 1);
  await page.locator("#undo-btn").click();
  await expect(page.locator("#timeline-graph-range")).toContainText("3 keys");
  await page.keyboard.press("Control+A");
  await page.keyboard.press("Shift+B");
  await expect(page.locator("#timeline-work-start")).toHaveValue("0");
  await expect(page.locator("#timeline-work-end")).toHaveValue("4");
  expect(errors).toEqual([]);
});

test("marquee selects value graph keyframes", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-add-keyframe")).toBeVisible();
  await page.locator("#timeline-track-kind").selectOption("position");
  const positionX = page.locator('.transform-input[data-prop="position"][data-axis="x"]');
  for (const [time, value] of [[0.5, 0.5], [2, 2], [4, 4]] as const) {
    await page.locator("#timeline-current-time").evaluate((input, nextTime) => {
      (input as HTMLInputElement).value = String(nextTime);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, time);
    await positionX.evaluate((input, nextValue) => {
      (input as HTMLInputElement).value = String(nextValue);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
    await page.locator("#timeline-add-keyframe").click();
  }

  if (!(await page.locator("#timeline-graph-panel").isVisible())) {
    await page.locator("#timeline-graph-toggle").click();
  }
  await page.getByRole("button", { name: "Cube Position X", exact: true }).click();
  await expect(page.locator("#timeline-graph-title")).toContainText("Cube | Position X");
  const firstKey = page.locator('.timeline-graph-key.graph-x[data-key-time="0.5"]').first();
  const secondKey = page.locator('.timeline-graph-key.graph-x[data-key-time^="2"]').first();
  await expect(firstKey).toBeVisible();
  await expect(secondKey).toBeVisible();
  const firstBox = await firstKey.boundingBox();
  const secondBox = await secondKey.boundingBox();
  const graphBox = await page.locator("#timeline-value-graph").boundingBox();
  expect(firstBox).toBeTruthy();
  expect(secondBox).toBeTruthy();
  expect(graphBox).toBeTruthy();

  const startX = Math.max(graphBox!.x + 4, Math.min(firstBox!.x, secondBox!.x) - 18);
  const startY = Math.max(graphBox!.y + 4, Math.min(firstBox!.y, secondBox!.y) - 18);
  const endX = Math.min(graphBox!.x + graphBox!.width - 4, Math.max(firstBox!.x + firstBox!.width, secondBox!.x + secondBox!.width) + 18);
  const endY = Math.min(graphBox!.y + graphBox!.height - 4, Math.max(firstBox!.y + firstBox!.height, secondBox!.y + secondBox!.height) + 18);
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, endY);
  await page.mouse.up();

  await expect(page.locator("#timeline-selection")).toContainText("2 keyframes selected");
  const selectedTimes = await page.locator(".timeline-graph-key.graph-x.selected").evaluateAll((nodes) =>
    nodes.map((node) => Number((node as SVGElement).getAttribute("data-key-time"))).sort((left, right) => left - right)
  );
  expect(selectedTimes).toEqual([0.5, 2]);
  expect(errors).toEqual([]);
});

test("locks timeline tracks against keyframe edits", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-lock-track")).toBeVisible();
  await page.locator("#timeline-track-kind").selectOption("position");
  const positionX = page.locator('.transform-input[data-prop="position"][data-axis="x"]');
  for (const [time, value] of [[0, 0], [2, 2]] as const) {
    await page.locator("#timeline-current-time").evaluate((input, nextTime) => {
      (input as HTMLInputElement).value = String(nextTime);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, time);
    await positionX.evaluate((input, nextValue) => {
      (input as HTMLInputElement).value = String(nextValue);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
    await page.locator("#timeline-add-keyframe").click();
  }

  if (!(await page.locator("#timeline-graph-panel").isVisible())) {
    await page.locator("#timeline-graph-toggle").click();
  }
  await page.getByRole("button", { name: "Cube Position X", exact: true }).click();
  await page.locator("#timeline-lock-track").click();
  await expect(page.locator("#timeline-lock-track")).toContainText("Locked");
  await expect(page.locator('.timeline-track-label[data-track-kind="position"]').first()).toHaveClass(/locked-track/);
  await expect(page.locator(".timeline-graph-key.graph-x.locked")).toHaveCount(2);

  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("Control+A");
  await expect(page.locator("#timeline-selection")).toContainText("2 keyframes selected");
  await page.locator("#timeline-delete-keyframe").click();
  await expect(page.locator("#timeline-graph-range")).toContainText("2 keys");

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "4";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await positionX.evaluate((input) => {
    (input as HTMLInputElement).value = "4";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-add-keyframe").click();
  await expect(page.locator("#timeline-graph-range")).toContainText("2 keys");

  await page.locator("#timeline-lock-track").click();
  await expect(page.locator("#timeline-lock-track")).toContainText("Unlocked");
  await page.locator("#timeline-delete-keyframe").click();
  await expect(page.locator("#timeline-graph-range")).toContainText("No selected track");

  expect(errors).toEqual([]);
});

test("toggles timeline tracks from row switches", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await page.locator('[data-animation="spin"]').click({ force: true });
  await page.locator("#timeline-row-filter").selectOption("keyed");

  const rotationRow = page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="rotation"][data-track-axis="x"]');
  await expect(rotationRow).toBeVisible();
  await expect(rotationRow).toHaveClass(/has-keyframes/);

  await rotationRow.locator('.timeline-row-switch[data-row-action="toggle"]').click();
  await expect(rotationRow).toHaveClass(/disabled-track/);
  await rotationRow.locator('.timeline-row-switch[data-row-action="toggle"]').click();
  await expect(rotationRow).not.toHaveClass(/disabled-track/);

  await rotationRow.locator('.timeline-row-switch[data-row-action="solo"]').click();
  await expect(rotationRow).toHaveClass(/solo-track/);
  await rotationRow.locator('.timeline-row-switch[data-row-action="solo"]').click();
  await expect(rotationRow).not.toHaveClass(/solo-track/);

  await rotationRow.locator('.timeline-row-switch[data-row-action="lock"]').click();
  await expect(rotationRow).toHaveClass(/locked-track/);
  await expect(rotationRow.locator(".timeline-row-key")).toBeDisabled();
  await rotationRow.locator('.timeline-row-switch[data-row-action="lock"]').click();
  await expect(rotationRow).not.toHaveClass(/locked-track/);
  expect(errors).toEqual([]);
});

test("solos timeline tracks for focused playback filtering", async ({ page }) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-solo-track")).toBeVisible();

  await page.locator("#timeline-track-kind").selectOption("position");
  const positionX = page.locator('.transform-input[data-prop="position"][data-axis="x"]');
  for (const [time, value] of [[0, 0], [2, 2]] as const) {
    await page.locator("#timeline-current-time").evaluate((input, nextTime) => {
      (input as HTMLInputElement).value = String(nextTime);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, time);
    await positionX.evaluate((input, nextValue) => {
      (input as HTMLInputElement).value = String(nextValue);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
    await page.locator("#timeline-add-keyframe").click();
  }

  await page.locator("#timeline-track-kind").selectOption("rotation");
  const rotationY = page.locator('.transform-input[data-prop="rotation"][data-axis="y"]');
  for (const [time, value] of [[0, 0], [2, 180]] as const) {
    await page.locator("#timeline-current-time").evaluate((input, nextTime) => {
      (input as HTMLInputElement).value = String(nextTime);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, time);
    await rotationY.evaluate((input, nextValue) => {
      (input as HTMLInputElement).value = String(nextValue);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
    await page.locator("#timeline-add-keyframe").click();
  }

  if (!(await page.locator("#timeline-graph-panel").isVisible())) {
    await page.locator("#timeline-graph-toggle").click();
  }

  await page.getByRole("button", { name: "Cube Position X", exact: true }).click();
  await expect(page.locator("#timeline-graph-title")).toContainText("Cube | Position X");
  await expect(page.locator("#timeline-graph-range")).toContainText("2 keys");
  await page.locator("#timeline-solo-track").click();
  await expect(page.locator("#timeline-solo-track")).toContainText("Solo On");
  await expect(page.locator('.timeline-track-label[data-track-kind="position"]').first()).toHaveClass(/solo-track/);
  await expect(page.getByRole("button", { name: "Cube Rotation Y", exact: true })).toHaveClass(/muted-track/);
  await expect(page.locator("#timeline-graph-range")).toContainText("2 keys");

  await page.getByRole("button", { name: "Cube Rotation Y", exact: true }).click();
  await expect(page.locator("#timeline-track-kind")).toHaveValue("rotation");
  await expect(page.locator("#timeline-solo-track")).toContainText("Muted");
  await expect(page.locator("#timeline-graph-range")).toContainText("Muted by solo");

  await page.locator("#timeline-solo-track").click();
  await expect(page.locator("#timeline-solo-track")).toContainText("Solo On");
  await expect(page.locator('.timeline-track-label[data-track-kind="rotation"]').first()).toHaveClass(/solo-track/);
  await expect(page.locator("#timeline-graph-range")).toContainText("2 keys");

  expect(errors).toEqual([]);
});

test("supports undo redo scene loading and evaluation tour", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Undo" })).toBeDisabled();

  await page.getByRole("button", { name: "Cone", exact: true }).click();
  await expect(page.locator("#selection-summary")).toContainText("Cone");
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.locator("#selection-summary")).not.toContainText("Cone");
  await page.locator("#redo-btn").click({ force: true });
  await expect(page.locator("#selection-summary")).toContainText("Cone");

  const sceneDocument = {
    version: 1,
    savedAt: new Date().toISOString(),
    selectedId: "object-42",
    playing: false,
    camera: {
      position: [4, 4, 8],
      target: [0, 1.2, 0],
      fov: 60,
      near: 0.1,
      far: 400
    },
    display: {
      grid: true,
      axes: true,
      stats: true,
      frustum: true
    },
    lights: {
      active: "point",
      helpers: true,
      shadows: true,
      sweep: false,
      ambientIntensity: 0.5,
      directional: { color: "#ffffff", intensity: 4, position: [6, 9, 5] },
      point: { color: "#fff1c7", intensity: 5, position: [3, 6, 4] },
      spot: { color: "#ffffff", intensity: 5, position: [4, 7, 4] }
    },
    objects: [
      {
        id: "object-42",
        name: "Loaded Cube",
        kind: "primitive",
        type: "cube",
        renderMode: "lines",
        materialMode: "basic",
        color: "#4bd0a0",
        textureName: "none",
        textureRepeat: [1, 1],
        animation: "none",
        position: [0, 0.02, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      }
    ]
  };

  await page.locator("#scene-input").setInputFiles({
    name: "loaded.scene.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(sceneDocument))
  });
  await expect(page.locator("#selection-summary")).toContainText("Loaded Cube");
  await expect(page.locator("#selection-summary")).toContainText("Lines");

  await page.getByRole("button", { name: "Evaluation Tour" }).click();
  await expect(page.locator("#selection-summary")).toContainText("Cube");
  await expect(page.locator("#outliner")).toContainText("Teapot");
  await expect(page.locator("#outliner")).toContainText("Sample Drone");
});

test("supports timeline marker keyboard shortcuts", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const dragMarker = async (index: number, deltaSeconds: number) => {
    const strip = page.locator("#timeline-marker-strip");
    const marker = page.locator(".timeline-marker").nth(index);
    const stripBox = await strip.boundingBox();
    const markerBox = await marker.boundingBox();
    expect(stripBox).toBeTruthy();
    expect(markerBox).toBeTruthy();
    const startX = markerBox!.x + markerBox!.width / 2;
    const startY = markerBox!.y + markerBox!.height / 2;
    const deltaX = stripBox!.width * (deltaSeconds / 8);
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + deltaX, startY, { steps: 6 });
    await page.mouse.up();
  };

  await page.goto("/");
  await expect(page.locator("#timeline-add-marker")).toBeVisible();

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0.25";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("m");
  await expect(page.locator(".timeline-marker")).toHaveCount(1);
  await expect(page.locator(".timeline-marker").first()).toContainText("Marker 1");
  await dragMarker(0, 1);
  await expect.poll(async () => Number(await page.locator(".timeline-marker").first().getAttribute("data-time"))).toBeCloseTo(1.267, 2);
  expect(Number(await page.locator("#timeline-current-time").inputValue())).toBeCloseTo(1.267, 2);

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("m");
  await expect(page.locator(".timeline-marker")).toHaveCount(2);
  await expect(page.locator(".timeline-marker").nth(1)).toContainText("Marker 2");

  await page.keyboard.press("Alt+M");
  expect(Number(await page.locator("#timeline-current-time").inputValue())).toBeCloseTo(1.267, 2);
  await page.keyboard.press("Shift+M");
  expect(Number(await page.locator("#timeline-current-time").inputValue())).toBeCloseTo(2, 2);
  await page.keyboard.press("Shift+Alt+M");
  await expect(page.locator(".timeline-marker")).toHaveCount(1);

  expect(errors).toEqual([]);
});

test("edits and persists timeline marker colors", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  await page.addInitScript(() => {
    const downloads: string[] = [];
    (window as unknown as { __sceneDownloads: string[] }).__sceneDownloads = downloads;
    const createObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (object: Blob | MediaSource) => {
      if (object instanceof Blob) {
        void object.text().then((text) => downloads.push(text));
      }
      return createObjectURL(object);
    };
  });
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-marker-label").fill("Camera Move");
  await page.locator("#timeline-marker-color").evaluate((input) => {
    (input as HTMLInputElement).value = "#4f8df7";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-add-marker").click();
  await expect(page.locator(".timeline-marker")).toHaveCount(1);
  await expect(page.locator("#timeline-marker-color")).toHaveValue("#4f8df7");
  await expect.poll(() => page.locator(".timeline-marker").first().evaluate((marker) => getComputedStyle(marker).borderLeftColor)).toBe("rgb(79, 141, 247)");

  await page.locator("#timeline-marker-color").evaluate((input) => {
    (input as HTMLInputElement).value = "#20bfa9";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect.poll(() => page.locator(".timeline-marker").first().evaluate((marker) => getComputedStyle(marker).borderLeftColor)).toBe("rgb(32, 191, 169)");

  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>("#save-scene")?.click();
  });
  const sceneText = await page.waitForFunction(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.at(-1) ?? null);
  const sceneJson = await sceneText.jsonValue();
  const sceneDocument = JSON.parse(sceneJson as string);
  expect(sceneDocument.timeline.markers).toHaveLength(1);
  expect(sceneDocument.timeline.markers[0].label).toBe("Camera Move");
  expect(sceneDocument.timeline.markers[0].color).toBe("#20bfa9");
  expect(errors).toEqual([]);
});

test("supports I/O work area keyboard shortcuts", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-work-start")).toBeVisible();

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("i");
  await expect(page.locator("#timeline-work-start")).toHaveValue("1.5");

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "3.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("o");
  await expect(page.locator("#timeline-work-end")).toHaveValue("3.5");

  expect(errors).toEqual([]);
});

test("supports draggable timeline work area range", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const elementBox = async (selector: string) => page.locator(selector).evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height
    };
  });
  const dragWorkArea = async (hit: "start" | "body" | "end", deltaSeconds: number) => {
    const stripBox = await elementBox("#timeline-marker-strip");
    const areaBox = await elementBox(".timeline-work-area");
    expect(stripBox.width).toBeGreaterThan(0);
    expect(areaBox.width).toBeGreaterThan(0);
    const startX = hit === "start"
      ? areaBox.x + 6
      : hit === "end"
        ? areaBox.x + areaBox.width - 6
        : areaBox.x + areaBox.width / 2;
    const startY = areaBox.y + areaBox.height / 2;
    const deltaX = stripBox.width * (deltaSeconds / 8);
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + deltaX, startY, { steps: 8 });
    await page.mouse.up();
  };

  await page.goto("/");
  await expect(page.locator(".timeline-work-area")).toBeVisible();
  await page.locator("#timeline-snap-step").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

  await dragWorkArea("end", -2);
  await expect.poll(async () => Number(await page.locator("#timeline-work-end").inputValue())).toBeCloseTo(6, 3);
  await expect(page.locator(".timeline-work-area")).toHaveAttribute("data-work-end", "6");

  await dragWorkArea("body", 1);
  await expect.poll(async () => Number(await page.locator("#timeline-work-start").inputValue())).toBeCloseTo(1, 3);
  await expect.poll(async () => Number(await page.locator("#timeline-work-end").inputValue())).toBeCloseTo(7, 3);

  await dragWorkArea("start", 1);
  await expect.poll(async () => Number(await page.locator("#timeline-work-start").inputValue())).toBeCloseTo(2, 3);
  await expect.poll(async () => Number(await page.locator("#timeline-work-end").inputValue())).toBeCloseTo(7, 3);
  await expect(page.locator(".timeline-work-area")).toHaveAttribute("data-work-start", "2");

  expect(errors).toEqual([]);
});

test("supports draggable timeline playhead ruler", async ({ page }) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const elementBox = async (selector: string) => page.locator(selector).evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height
    };
  });
  const dragPlayheadTo = async (time: number) => {
    const stripBox = await elementBox("#timeline-marker-strip");
    const handleBox = await elementBox(".timeline-ruler-playhead");
    expect(stripBox.width).toBeGreaterThan(0);
    expect(handleBox.height).toBeGreaterThan(0);
    const startX = handleBox.x + handleBox.width / 2;
    const startY = handleBox.y + handleBox.height / 2;
    const targetX = stripBox.x + stripBox.width * (time / 8);
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(targetX, startY, { steps: 8 });
    await page.mouse.up();
  };
  const clickRulerTo = async (time: number, modifier?: "Shift" | "Alt") => {
    const stripBox = await elementBox("#timeline-marker-strip");
    const zoneBox = await elementBox(".timeline-ruler-scrub-zone");
    expect(stripBox.width).toBeGreaterThan(0);
    expect(zoneBox.height).toBeGreaterThan(0);
    if (modifier) await page.keyboard.down(modifier);
    await page.mouse.click(stripBox.x + stripBox.width * (time / 8), zoneBox.y + zoneBox.height / 2);
    if (modifier) await page.keyboard.up(modifier);
  };

  await page.goto("/");
  await expect(page.locator(".timeline-ruler-playhead")).toBeVisible();
  await expect(page.locator(".timeline-ruler-scrub-zone")).toBeVisible();
  await expect(page.locator(".timeline-layer-playhead")).toBeVisible();
  await page.locator("#timeline-snap").uncheck();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "2.25";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-marker-label").fill("Snap Cue");
  await page.locator("#timeline-add-marker").click();
  await expect(page.locator(".timeline-marker")).toHaveCount(1);
  await page.locator("#timeline-snap").check();
  await page.locator("#timeline-snap-step").evaluate((input) => {
    (input as HTMLInputElement).value = "0.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

  await dragPlayheadTo(2.25);
  await expect.poll(async () => Number(await page.locator("#timeline-current-time").inputValue())).toBeCloseTo(2.25, 3);
  await expect(page.locator(".timeline-ruler-playhead")).toHaveAttribute("data-time", "2.25");

  await clickRulerTo(6);
  await expect.poll(async () => Number(await page.locator("#timeline-current-time").inputValue())).toBeCloseTo(6, 3);
  await expect(page.locator(".timeline-ruler-playhead")).toHaveAttribute("data-time", "6");

  await clickRulerTo(2, "Shift");
  await expect.poll(async () => Number(await page.locator("#timeline-work-start").inputValue())).toBeCloseTo(2, 3);
  await expect.poll(async () => Number(await page.locator("#timeline-current-time").inputValue())).toBeCloseTo(2, 3);

  await clickRulerTo(6, "Alt");
  await expect.poll(async () => Number(await page.locator("#timeline-work-end").inputValue())).toBeCloseTo(6, 3);
  await expect.poll(async () => Number(await page.locator("#timeline-current-time").inputValue())).toBeCloseTo(6, 3);

  await dragPlayheadTo(4);
  await expect.poll(async () => Number(await page.locator("#timeline-current-time").inputValue())).toBeCloseTo(4, 3);
  await expect(page.locator(".timeline-ruler-playhead")).toHaveAttribute("data-time", "4");

  expect(errors).toEqual([]);
});

test("evaluates ease in and ease out timeline interpolation", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-add-keyframe")).toBeVisible();
  await page.locator("#timeline-track-kind").selectOption("position");
  const positionX = page.locator('.transform-input[data-prop="position"][data-axis="x"]');

  for (const [time, value] of [[0, 0], [2, 2]] as const) {
    await page.locator("#timeline-current-time").evaluate((input, nextTime) => {
      (input as HTMLInputElement).value = String(nextTime);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, time);
    await positionX.evaluate((input, nextValue) => {
      (input as HTMLInputElement).value = String(nextValue);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
    await page.locator("#timeline-add-keyframe").click();
  }

  if (!(await page.locator("#timeline-graph-panel").isVisible())) {
    await page.locator("#timeline-graph-toggle").click();
  }
  await page.locator('.timeline-graph-key.graph-x[data-key-time="0"]').click();
  await page.locator("#timeline-ease-in").click();
  await expect(page.locator("#timeline-ease-in")).toHaveClass(/active/);
  await expect(page.locator("#timeline-ease-label")).toContainText("Ease In");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(Number(await positionX.inputValue())).toBeCloseTo(0.5, 1);

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-ease-out").click();
  await expect(page.locator("#timeline-ease-out")).toHaveClass(/active/);
  await expect(page.locator("#timeline-ease-label")).toContainText("Ease Out");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(Number(await positionX.inputValue())).toBeCloseTo(1.5, 1);

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("Control+F9");
  await expect(page.locator("#timeline-ease-in")).toHaveClass(/active/);
  await page.keyboard.press("Control+Shift+F9");
  await expect(page.locator("#timeline-ease-out")).toHaveClass(/active/);

  expect(errors).toEqual([]);
});

test("moves selected timeline keyframes to the playhead", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-add-keyframe")).toBeVisible();
  await page.locator("#timeline-track-kind").selectOption("position");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-add-keyframe").click();

  const positionX = page.locator('.transform-input[data-prop="position"][data-axis="x"]');
  for (const [time, value] of [[2, 2], [4, 4]] as const) {
    await page.locator("#timeline-current-time").evaluate((input, nextTime) => {
      (input as HTMLInputElement).value = String(nextTime);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, time);
    await positionX.evaluate((input, nextValue) => {
      (input as HTMLInputElement).value = String(nextValue);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
    await page.locator("#timeline-add-keyframe").click();
  }

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("Control+A");
  await expect(page.locator("#timeline-selection")).toContainText("3 keyframes selected");
  await page.locator("#timeline-move-to-playhead").click();
  await expect(page.locator("#timeline-current-time")).toHaveValue("1");

  if (!(await page.locator("#timeline-graph-panel").isVisible())) {
    await page.locator("#timeline-graph-toggle").click();
  }
  const graphTimes = await page.locator(".timeline-graph-key.graph-x").evaluateAll((nodes) =>
    [...new Set(nodes.map((node) => Number((node as SVGElement).getAttribute("data-key-time"))))]
      .sort((left, right) => left - right)
  );
  expect(graphTimes).toEqual([1, 3, 5]);

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("Shift+Enter");
  const shortcutTimes = await page.locator(".timeline-graph-key.graph-x").evaluateAll((nodes) =>
    [...new Set(nodes.map((node) => Number((node as SVGElement).getAttribute("data-key-time"))))]
      .sort((left, right) => left - right)
  );
  expect(shortcutTimes).toEqual([2, 4, 6]);
  await page.keyboard.press("Shift+R");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(Number(await positionX.inputValue())).toBeCloseTo(4, 1);
  await page.locator("#timeline-reverse-keyframes").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(Number(await positionX.inputValue())).toBeCloseTo(0, 1);

  expect(errors).toEqual([]);
});

test("centers selected timeline keyframes on the playhead", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-add-keyframe")).toBeVisible();
  await page.locator("#timeline-track-kind").selectOption("position");
  const positionX = page.locator('.transform-input[data-prop="position"][data-axis="x"]');
  for (const [time, value] of [[0, 0], [2, 2], [4, 4]] as const) {
    await page.locator("#timeline-current-time").evaluate((input, nextTime) => {
      (input as HTMLInputElement).value = String(nextTime);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, time);
    await positionX.evaluate((input, nextValue) => {
      (input as HTMLInputElement).value = String(nextValue);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
    await page.locator("#timeline-add-keyframe").click();
  }

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "3";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  if (!(await page.locator("#timeline-graph-panel").isVisible())) {
    await page.locator("#timeline-graph-toggle").click();
  }
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("Control+A");
  await expect(page.locator("#timeline-selection")).toContainText("3 keyframes selected");
  await page.locator("#timeline-center-keyframes").click();
  const centeredTimes = await page.locator(".timeline-graph-key.graph-x").evaluateAll((nodes) =>
    [...new Set(nodes.map((node) => Number((node as SVGElement).getAttribute("data-key-time"))))]
      .sort((left, right) => left - right)
  );
  expect(centeredTimes).toEqual([1, 3, 5]);

  await page.locator("#undo-btn").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "3";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("Control+A");
  await page.keyboard.press("Shift+C");
  const shortcutTimes = await page.locator(".timeline-graph-key.graph-x").evaluateAll((nodes) =>
    [...new Set(nodes.map((node) => Number((node as SVGElement).getAttribute("data-key-time"))))]
      .sort((left, right) => left - right)
  );
  expect(shortcutTimes).toEqual([1, 3, 5]);

  expect(errors).toEqual([]);
});

test("roves selected timeline keyframes between fixed endpoints", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-add-keyframe")).toBeVisible();
  await page.locator("#timeline-track-kind").selectOption("position");
  const positionX = page.locator('.transform-input[data-prop="position"][data-axis="x"]');
  for (const [time, value] of [[0, 0], [1, 1], [4, 4], [6, 6]] as const) {
    await page.locator("#timeline-current-time").evaluate((input, nextTime) => {
      (input as HTMLInputElement).value = String(nextTime);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, time);
    await positionX.evaluate((input, nextValue) => {
      (input as HTMLInputElement).value = String(nextValue);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
    await page.locator("#timeline-add-keyframe").click();
  }

  if (!(await page.locator("#timeline-graph-panel").isVisible())) {
    await page.locator("#timeline-graph-toggle").click();
  }
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("Control+A");
  await expect(page.locator("#timeline-selection")).toContainText("4 keyframes selected");
  await page.locator("#timeline-rove-keyframes").click();
  const rovedTimes = await page.locator(".timeline-graph-key.graph-x").evaluateAll((nodes) =>
    [...new Set(nodes.map((node) => Number((node as SVGElement).getAttribute("data-key-time"))))]
      .sort((left, right) => left - right)
  );
  expect(rovedTimes).toEqual([0, 2, 4, 6]);

  await page.locator("#undo-btn").click();
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("Control+A");
  await page.keyboard.press("Shift+V");
  const shortcutTimes = await page.locator(".timeline-graph-key.graph-x").evaluateAll((nodes) =>
    [...new Set(nodes.map((node) => Number((node as SVGElement).getAttribute("data-key-time"))))]
      .sort((left, right) => left - right)
  );
  expect(shortcutTimes).toEqual([0, 2, 4, 6]);

  expect(errors).toEqual([]);
});

test("snaps selected timeline keyframes to frame boundaries", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-add-keyframe")).toBeVisible();
  await page.locator("#timeline-track-kind").selectOption("position");
  await page.locator("#timeline-fps").evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-snap-step").evaluate((input) => {
    (input as HTMLInputElement).value = "0.01";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  const positionX = page.locator('.transform-input[data-prop="position"][data-axis="x"]');
  for (const [time, value] of [[0, 0], [1.23, 1], [2.77, 3]] as const) {
    await page.locator("#timeline-current-time").evaluate((input, nextTime) => {
      (input as HTMLInputElement).value = String(nextTime);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, time);
    await positionX.evaluate((input, nextValue) => {
      (input as HTMLInputElement).value = String(nextValue);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
    await page.locator("#timeline-add-keyframe").click();
  }

  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("Control+A");
  await expect(page.locator("#timeline-selection")).toContainText("3 keyframes selected");
  await page.locator("#timeline-snap-keyframes").click();
  if (!(await page.locator("#timeline-graph-panel").isVisible())) {
    await page.locator("#timeline-graph-toggle").click();
  }
  const snappedTimes = await page.locator(".timeline-graph-key.graph-x").evaluateAll((nodes) =>
    [...new Set(nodes.map((node) => Number((node as SVGElement).getAttribute("data-key-time"))))]
      .sort((left, right) => left - right)
  );
  expect(snappedTimes).toEqual([0, 1, 3]);

  await page.locator("#undo-btn").click();
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("Control+A");
  await page.keyboard.press("Shift+S");
  const shortcutTimes = await page.locator(".timeline-graph-key.graph-x").evaluateAll((nodes) =>
    [...new Set(nodes.map((node) => Number((node as SVGElement).getAttribute("data-key-time"))))]
      .sort((left, right) => left - right)
  );
  expect(shortcutTimes).toEqual([0, 1, 3]);

  expect(errors).toEqual([]);
});

test("distributes selected timeline keyframes across the work area", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-add-keyframe")).toBeVisible();
  await page.locator("#timeline-track-kind").selectOption("position");
  await page.locator("#timeline-work-start").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-work-end").evaluate((input) => {
    (input as HTMLInputElement).value = "6";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  const positionX = page.locator('.transform-input[data-prop="position"][data-axis="x"]');
  for (const [time, value] of [[0, 0], [1, 1], [5, 5]] as const) {
    await page.locator("#timeline-current-time").evaluate((input, nextTime) => {
      (input as HTMLInputElement).value = String(nextTime);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, time);
    await positionX.evaluate((input, nextValue) => {
      (input as HTMLInputElement).value = String(nextValue);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
    await page.locator("#timeline-add-keyframe").click();
  }

  if (!(await page.locator("#timeline-graph-panel").isVisible())) {
    await page.locator("#timeline-graph-toggle").click();
  }
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("Control+A");
  await expect(page.locator("#timeline-selection")).toContainText("3 keyframes selected");
  await page.locator("#timeline-distribute-keyframes").click();
  const distributedTimes = await page.locator(".timeline-graph-key.graph-x").evaluateAll((nodes) =>
    [...new Set(nodes.map((node) => Number((node as SVGElement).getAttribute("data-key-time"))))]
      .sort((left, right) => left - right)
  );
  expect(distributedTimes).toEqual([0, 3, 6]);

  await page.locator("#undo-btn").click();
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("Control+A");
  await page.keyboard.press("Shift+D");
  const shortcutTimes = await page.locator(".timeline-graph-key.graph-x").evaluateAll((nodes) =>
    [...new Set(nodes.map((node) => Number((node as SVGElement).getAttribute("data-key-time"))))]
      .sort((left, right) => left - right)
  );
  expect(shortcutTimes).toEqual([0, 3, 6]);

  expect(errors).toEqual([]);
});

test("fits selected timeline keyframes into the work area", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-add-keyframe")).toBeVisible();
  await page.locator("#timeline-track-kind").selectOption("position");
  await page.locator("#timeline-work-start").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-work-end").evaluate((input) => {
    (input as HTMLInputElement).value = "8";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  const positionX = page.locator('.transform-input[data-prop="position"][data-axis="x"]');
  for (const [time, value] of [[1, 1], [2, 2], [5, 5]] as const) {
    await page.locator("#timeline-current-time").evaluate((input, nextTime) => {
      (input as HTMLInputElement).value = String(nextTime);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, time);
    await positionX.evaluate((input, nextValue) => {
      (input as HTMLInputElement).value = String(nextValue);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
    await page.locator("#timeline-add-keyframe").click();
  }

  if (!(await page.locator("#timeline-graph-panel").isVisible())) {
    await page.locator("#timeline-graph-toggle").click();
  }
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("Control+A");
  await expect(page.locator("#timeline-selection")).toContainText("3 keyframes selected");
  await page.locator("#timeline-fit-keyframes").click();
  const fittedTimes = await page.locator(".timeline-graph-key.graph-x").evaluateAll((nodes) =>
    [...new Set(nodes.map((node) => Number((node as SVGElement).getAttribute("data-key-time"))))]
      .sort((left, right) => left - right)
  );
  expect(fittedTimes).toEqual([0, 2, 8]);

  await page.locator("#undo-btn").click();
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("Control+A");
  await page.keyboard.press("Shift+F");
  const shortcutTimes = await page.locator(".timeline-graph-key.graph-x").evaluateAll((nodes) =>
    [...new Set(nodes.map((node) => Number((node as SVGElement).getAttribute("data-key-time"))))]
      .sort((left, right) => left - right)
  );
  expect(shortcutTimes).toEqual([0, 2, 8]);

  expect(errors).toEqual([]);
});

test("staggers selected timeline keyframes from the playhead", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-add-keyframe")).toBeVisible();
  await page.locator("#timeline-track-kind").selectOption("position");

  const positionX = page.locator('.transform-input[data-prop="position"][data-axis="x"]');
  for (const [time, value] of [[1, 1], [3, 3], [6, 6]] as const) {
    await page.locator("#timeline-current-time").evaluate((input, nextTime) => {
      (input as HTMLInputElement).value = String(nextTime);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, time);
    await positionX.evaluate((input, nextValue) => {
      (input as HTMLInputElement).value = String(nextValue);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
    await page.locator("#timeline-add-keyframe").click();
  }

  if (!(await page.locator("#timeline-graph-panel").isVisible())) {
    await page.locator("#timeline-graph-toggle").click();
  }
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("Control+A");
  await expect(page.locator("#timeline-selection")).toContainText("3 keyframes selected");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-stagger-keyframes").click();
  const staggeredTimes = await page.locator(".timeline-graph-key.graph-x").evaluateAll((nodes) =>
    [...new Set(nodes.map((node) => Number((node as SVGElement).getAttribute("data-key-time"))))]
      .sort((left, right) => left - right)
  );
  expect(staggeredTimes).toEqual([2, 2.03, 2.07]);

  await page.locator("#undo-btn").click();
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("Control+A");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.keyboard.press("Shift+G");
  const shortcutTimes = await page.locator(".timeline-graph-key.graph-x").evaluateAll((nodes) =>
    [...new Set(nodes.map((node) => Number((node as SVGElement).getAttribute("data-key-time"))))]
      .sort((left, right) => left - right)
  );
  expect(shortcutTimes).toEqual([2, 2.03, 2.07]);

  expect(errors).toEqual([]);
});

test("cascades selected target keyframes from the playhead", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  await page.addInitScript(() => {
    const downloads: string[] = [];
    (window as unknown as { __sceneDownloads: string[] }).__sceneDownloads = downloads;
    const createObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (object: Blob | MediaSource) => {
      if (object instanceof Blob) {
        void object.text().then((text) => downloads.push(text));
      }
      return createObjectURL(object);
    };
  });
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Sphere", exact: true }).click();
  await page.locator("#object-name").evaluate((input) => {
    (input as HTMLInputElement).value = "Cascade Target A";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.getByRole("button", { name: "Cone", exact: true }).click();
  await page.locator("#object-name").evaluate((input) => {
    (input as HTMLInputElement).value = "Cascade Target B";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-row-filter").selectOption("all");
  await page.locator("#timeline-row-search").fill("Cascade Target");
  await expect.poll(async () =>
    page.locator('.timeline-track-label[data-track-kind="position"][data-track-axis="x"][data-object-id]').count()
  ).toBe(2);
  await page.locator("#timeline-set-visible").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("Alt+Shift+G");

  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>("#save-scene")?.click();
  });
  const sceneText = await page.waitForFunction(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.at(-1) ?? null);
  const sceneJson = await sceneText.jsonValue();
  const sceneDocument = JSON.parse(sceneJson as string);
  const cascadeTargetIds = sceneDocument.objects
    .filter((object: { name: string }) => object.name.startsWith("Cascade Target"))
    .map((object: { id: string }) => object.id);
  expect(cascadeTargetIds).toHaveLength(2);
  const cascadedTimes = cascadeTargetIds
    .map((objectId: string) => {
      const objectTimeline = sceneDocument.timeline.objects.find((
        timeline: { objectId: string; tracks: Array<{ kind: string; keyframes: Array<{ time: number }> }> }
      ) => timeline.objectId === objectId);
      return objectTimeline?.tracks.find((track: { kind: string }) => track.kind === "position")?.keyframes[0]?.time;
    })
    .filter((time: number | undefined): time is number => typeof time === "number")
    .sort((left: number, right: number) => left - right);
  expect(cascadedTimes).toHaveLength(2);
  cascadedTimes.forEach((time: number, index: number) => {
    expect(time).toBeCloseTo(Math.round((2 + index / 30) * 1000) / 1000, 3);
  });
  expect(errors).toEqual([]);
});

test("duplicates selected timeline keyframes from the keyboard", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-add-keyframe")).toBeVisible();
  await page.locator("#timeline-track-kind").selectOption("position");
  const positionX = page.locator('.transform-input[data-prop="position"][data-axis="x"]');
  for (const [time, value] of [[0, 0], [2, 2]] as const) {
    await page.locator("#timeline-current-time").evaluate((input, nextTime) => {
      (input as HTMLInputElement).value = String(nextTime);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, time);
    await positionX.evaluate((input, nextValue) => {
      (input as HTMLInputElement).value = String(nextValue);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
    await page.locator("#timeline-add-keyframe").click();
  }

  if (!(await page.locator("#timeline-graph-panel").isVisible())) {
    await page.locator("#timeline-graph-toggle").click();
  }
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("Control+A");
  await page.keyboard.press("Control+D");
  await expect(page.locator("#timeline-selection")).toContainText("2 keyframes selected");
  const duplicatedTimes = await page.locator(".timeline-graph-key.graph-x").evaluateAll((nodes) =>
    [...new Set(nodes.map((node) => Number((node as SVGElement).getAttribute("data-key-time"))))]
      .sort((left, right) => left - right)
  );
  expect(duplicatedTimes).toEqual([0, 0.03, 2, 2.03]);

  expect(errors).toEqual([]);
});

test("ripple deletes selected timeline keyframe spans", async ({ page }) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  await page.addInitScript(() => {
    const downloads: string[] = [];
    (window as unknown as { __sceneDownloads: string[] }).__sceneDownloads = downloads;
    const createObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (object: Blob | MediaSource) => {
      if (object instanceof Blob) {
        void object.text().then((text) => downloads.push(text));
      }
      return createObjectURL(object);
    };
  });
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-add-keyframe")).toBeVisible();
  await page.locator("#timeline-track-kind").selectOption("position");
  const positionX = page.locator('.transform-input[data-prop="position"][data-axis="x"]');
  for (const [time, value] of [[0, 0], [2, 2], [4, 4], [6, 6]] as const) {
    await page.locator("#timeline-current-time").evaluate((input, nextTime) => {
      (input as HTMLInputElement).value = String(nextTime);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, time);
    await positionX.evaluate((input, nextValue) => {
      (input as HTMLInputElement).value = String(nextValue);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
    await page.locator("#timeline-add-keyframe").click();
  }

  if (!(await page.locator("#timeline-graph-panel").isVisible())) {
    await page.locator("#timeline-graph-toggle").click();
  }
  await page.getByRole("button", { name: "Cube Position X", exact: true }).click();
  await page.locator('.timeline-graph-key.graph-x[data-key-time^="2"]').first().click();
  await page.keyboard.down("Shift");
  await page.locator('.timeline-graph-key.graph-x[data-key-time="4"]').first().click();
  await page.keyboard.up("Shift");
  await expect(page.locator("#timeline-selection")).toContainText("2 keyframes selected");
  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>("#timeline-ripple-delete-keyframes")?.click();
  });

  const rippledTimes = await page.locator(".timeline-graph-key.graph-x").evaluateAll((nodes) =>
    [...new Set(nodes.map((node) => Number((node as SVGElement).getAttribute("data-key-time"))))]
      .sort((left, right) => left - right)
  );
  expect(rippledTimes).toEqual([0, 4]);
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "4";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(Number(await positionX.inputValue())).toBeCloseTo(6, 1);

  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>("#save-scene")?.click();
  });
  const sceneText = await page.waitForFunction(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.at(-1) ?? null);
  const sceneJson = await sceneText.jsonValue();
  const sceneDocument = JSON.parse(sceneJson as string);
  const positionTrack = sceneDocument.timeline.objects
    .find((object: { objectId: string }) => object.objectId === "object-1")
    .tracks.find((track: { kind: string }) => track.kind === "position");
  const savedKeys = positionTrack.keyframes
    .map((keyframe: { time: number; value: [number, number, number] }) => ({ time: keyframe.time, x: keyframe.value[0] }))
    .sort((left: { time: number }, right: { time: number }) => left.time - right.time);
  expect(savedKeys).toEqual([{ time: 0, x: 0 }, { time: 4, x: 6 }]);

  await page.locator("#undo-btn").click();
  await expect(page.locator('.timeline-graph-key.graph-x[data-key-time^="2"]').first()).toBeVisible();
  const restoredTimes = await page.locator(".timeline-graph-key.graph-x").evaluateAll((nodes) =>
    [...new Set(nodes.map((node) => Number((node as SVGElement).getAttribute("data-key-time"))))]
      .sort((left, right) => left - right)
  );
  expect(restoredTimes).toEqual([0, 2, 4, 6]);

  expect(errors).toEqual([]);
});

test("paste inserts copied timeline keyframes", async ({ page }) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  await page.addInitScript(() => {
    const downloads: string[] = [];
    (window as unknown as { __sceneDownloads: string[] }).__sceneDownloads = downloads;
    const createObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (object: Blob | MediaSource) => {
      if (object instanceof Blob) {
        void object.text().then((text) => downloads.push(text));
      }
      return createObjectURL(object);
    };
  });
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-paste-insert-keyframes")).toBeVisible();
  await page.locator("#timeline-track-kind").selectOption("position");
  const positionX = page.locator('.transform-input[data-prop="position"][data-axis="x"]');
  for (const [time, value] of [[0, 0], [2, 2]] as const) {
    await page.locator("#timeline-current-time").evaluate((input, nextTime) => {
      (input as HTMLInputElement).value = String(nextTime);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, time);
    await positionX.evaluate((input, nextValue) => {
      (input as HTMLInputElement).value = String(nextValue);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
    await page.locator("#timeline-add-keyframe").click();
  }

  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("Control+A");
  await expect(page.locator("#timeline-selection")).toContainText("2 keyframes selected");
  await page.keyboard.press("Control+C");
  await expect(page.locator("#timeline-paste-keyframes")).toBeEnabled();
  await expect(page.locator("#timeline-paste-insert-keyframes")).toBeEnabled();

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await positionX.evaluate((input) => {
    (input as HTMLInputElement).value = "5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-add-keyframe").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("Control+Shift+V");

  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>("#save-scene")?.click();
  });
  const sceneText = await page.waitForFunction(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.at(-1) ?? null);
  const sceneJson = await sceneText.jsonValue();
  const sceneDocument = JSON.parse(sceneJson as string);
  const positionTrack = sceneDocument.timeline.objects
    .find((object: { objectId: string }) => object.objectId === "object-1")
    .tracks.find((track: { kind: string }) => track.kind === "position");
  const savedKeys = positionTrack.keyframes
    .map((keyframe: { time: number; value: [number, number, number] }) => ({ time: keyframe.time, x: keyframe.value[0] }))
    .sort((left: { time: number }, right: { time: number }) => left.time - right.time);
  expect(savedKeys).toEqual([
    { time: 0, x: 0 },
    { time: 1, x: 0 },
    { time: 3, x: 2 },
    { time: 4, x: 2 },
    { time: 7, x: 5 }
  ]);

  expect(errors).toEqual([]);
});

test("handles visible timeline gap edit shortcuts", async ({ page }) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  await page.addInitScript(() => {
    const downloads: string[] = [];
    (window as unknown as { __sceneDownloads: string[] }).__sceneDownloads = downloads;
    const createObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (object: Blob | MediaSource) => {
      if (object instanceof Blob) {
        void object.text().then((text) => downloads.push(text));
      }
      return createObjectURL(object);
    };
  });
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-insert-gap")).toBeVisible();
  await page.locator("#timeline-track-kind").selectOption("position");
  const positionX = page.locator('.transform-input[data-prop="position"][data-axis="x"]');
  for (const [time, value] of [[0, 0], [2, 2], [4, 4]] as const) {
    await page.locator("#timeline-current-time").evaluate((input, nextTime) => {
      (input as HTMLInputElement).value = String(nextTime);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, time);
    await positionX.evaluate((input, nextValue) => {
      (input as HTMLInputElement).value = String(nextValue);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
    await page.locator("#timeline-add-keyframe").click();
  }

  if (!(await page.locator("#timeline-graph-panel").isVisible())) {
    await page.locator("#timeline-graph-toggle").click();
  }
  await page.getByRole("button", { name: "Cube Position X", exact: true }).click();
  await page.locator("#timeline-work-start").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-work-end").evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.keyboard.press("Comma");

  const insertedTimes = await page.locator(".timeline-graph-key.graph-x").evaluateAll((nodes) =>
    [...new Set(nodes.map((node) => Number((node as SVGElement).getAttribute("data-key-time"))))]
      .sort((left, right) => left - right)
  );
  expect(insertedTimes).toEqual([0, 4, 6]);

  await page.keyboard.press("Quote");
  const extractedTimes = await page.locator(".timeline-graph-key.graph-x").evaluateAll((nodes) =>
    [...new Set(nodes.map((node) => Number((node as SVGElement).getAttribute("data-key-time"))))]
      .sort((left, right) => left - right)
  );
  expect(extractedTimes).toEqual([2, 4]);

  await page.locator("#timeline-work-end").evaluate((input) => {
    (input as HTMLInputElement).value = "3";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-work-start").evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.keyboard.press("Semicolon");

  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>("#save-scene")?.click();
  });
  const sceneText = await page.waitForFunction(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.at(-1) ?? null);
  const sceneJson = await sceneText.jsonValue();
  const sceneDocument = JSON.parse(sceneJson as string);
  const positionTrack = sceneDocument.timeline.objects
    .find((object: { objectId: string }) => object.objectId === "object-1")
    .tracks.find((track: { kind: string }) => track.kind === "position");
  const savedKeys = positionTrack.keyframes
    .map((keyframe: { time: number; value: [number, number, number] }) => ({ time: keyframe.time, x: keyframe.value[0] }))
    .sort((left: { time: number }, right: { time: number }) => left.time - right.time);
  expect(savedKeys).toEqual([{ time: 4, x: 4 }]);

  expect(errors).toEqual([]);
});

test("selects active-track keyframes inside the work area", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-add-keyframe")).toBeVisible();
  await page.locator("#timeline-track-kind").selectOption("position");
  const positionX = page.locator('.transform-input[data-prop="position"][data-axis="x"]');
  for (const [time, value] of [[0, 0], [1, 1], [3, 3], [5, 5]] as const) {
    await page.locator("#timeline-current-time").evaluate((input, nextTime) => {
      (input as HTMLInputElement).value = String(nextTime);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, time);
    await positionX.evaluate((input, nextValue) => {
      (input as HTMLInputElement).value = String(nextValue);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
    await page.locator("#timeline-add-keyframe").click();
  }

  await page.locator("#timeline-work-start").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-work-end").evaluate((input) => {
    (input as HTMLInputElement).value = "3";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-select-workarea").click();
  await expect(page.locator("#timeline-selection")).toContainText("2 keyframes selected");

  if (!(await page.locator("#timeline-graph-panel").isVisible())) {
    await page.locator("#timeline-graph-toggle").click();
  }
  const selectedToolbarTimes = await page.locator(".timeline-graph-key.graph-x.selected").evaluateAll((nodes) =>
    nodes.map((node) => Number((node as SVGElement).getAttribute("data-key-time"))).sort((left, right) => left - right)
  );
  expect(selectedToolbarTimes).toEqual([1, 3]);

  await page.keyboard.press("Control+A");
  await expect(page.locator("#timeline-selection")).toContainText("4 keyframes selected");
  await page.keyboard.press("Control+Shift+A");
  await expect(page.locator("#timeline-selection")).toContainText("2 keyframes selected");
  const selectedShortcutTimes = await page.locator(".timeline-graph-key.graph-x.selected").evaluateAll((nodes) =>
    nodes.map((node) => Number((node as SVGElement).getAttribute("data-key-time"))).sort((left, right) => left - right)
  );
  expect(selectedShortcutTimes).toEqual([1, 3]);

  expect(errors).toEqual([]);
});

test("jumps to selected timeline keyframe boundaries", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-selected-start")).toBeVisible();
  await page.locator("#timeline-track-kind").selectOption("position");
  const positionX = page.locator('.transform-input[data-prop="position"][data-axis="x"]');
  for (const [time, value] of [[0, 0], [1, 1], [3, 3], [5, 5]] as const) {
    await page.locator("#timeline-current-time").evaluate((input, nextTime) => {
      (input as HTMLInputElement).value = String(nextTime);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, time);
    await positionX.evaluate((input, nextValue) => {
      (input as HTMLInputElement).value = String(nextValue);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
    await page.locator("#timeline-add-keyframe").click();
  }

  await page.locator("#timeline-work-start").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-work-end").evaluate((input) => {
    (input as HTMLInputElement).value = "3";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-select-workarea").click();
  await expect(page.locator("#timeline-selection")).toContainText("2 keyframes selected");

  await page.locator("#timeline-selected-start").click();
  expect(Number(await page.locator("#timeline-current-time").inputValue())).toBeCloseTo(1, 2);
  await page.locator("#timeline-selected-end").click();
  expect(Number(await page.locator("#timeline-current-time").inputValue())).toBeCloseTo(3, 2);

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("Shift+End");
  expect(Number(await page.locator("#timeline-current-time").inputValue())).toBeCloseTo(3, 2);
  await page.keyboard.press("Shift+Home");
  expect(Number(await page.locator("#timeline-current-time").inputValue())).toBeCloseTo(1, 2);

  expect(errors).toEqual([]);
});

test("previews the selected timeline keyframe range", async ({ page }) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-preview-selection")).toBeVisible();
  await page.locator("#timeline-track-kind").selectOption("position");
  const positionX = page.locator('.transform-input[data-prop="position"][data-axis="x"]');
  for (const [time, value] of [[0, 0], [1, 1], [3, 3], [5, 5]] as const) {
    await page.locator("#timeline-current-time").evaluate((input, nextTime) => {
      (input as HTMLInputElement).value = String(nextTime);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, time);
    await positionX.evaluate((input, nextValue) => {
      (input as HTMLInputElement).value = String(nextValue);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
    await page.locator("#timeline-add-keyframe").click();
  }

  await page.locator("#timeline-work-start").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-work-end").evaluate((input) => {
    (input as HTMLInputElement).value = "3";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-select-workarea").click();
  await expect(page.locator("#timeline-selection")).toContainText("2 keyframes selected");

  await page.locator("#timeline-preview-selection").click();
  await expect(page.locator("#timeline-work-start")).toHaveValue("1");
  await expect(page.locator("#timeline-work-end")).toHaveValue("3");
  await expect(page.locator("#timeline-play-toggle")).toContainText("Pause 1x");

  await page.keyboard.press("k");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-work-start").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-work-end").evaluate((input) => {
    (input as HTMLInputElement).value = "8";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("Shift+Space");
  await expect(page.locator("#timeline-work-start")).toHaveValue("1");
  await expect(page.locator("#timeline-work-end")).toHaveValue("3");
  await expect(page.locator("#timeline-play-toggle")).toContainText("Pause 1x");

  expect(errors).toEqual([]);
});

test("supports JKL timeline transport shortcuts", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-current-time")).toBeVisible();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

  const forwardStart = Number(await page.locator("#timeline-current-time").inputValue());
  await page.keyboard.press("l");
  await expect(page.locator("#play-toggle")).toContainText("Pause 1x");
  await expect(page.locator("#status-line")).toContainText("Forward 1x");
  await expect.poll(async () => Number(await page.locator("#timeline-current-time").inputValue())).toBeGreaterThan(forwardStart);
  await page.keyboard.press("l");
  await expect(page.locator("#status-line")).toContainText("Forward 2x");
  await page.keyboard.press("l");
  await expect(page.locator("#play-toggle")).toContainText("Pause 4x");

  await page.keyboard.press("k");
  await expect(page.locator("#play-toggle")).toContainText("Play");
  await expect(page.locator("#status-line")).toContainText("Ready");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "4";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

  const reverseStart = Number(await page.locator("#timeline-current-time").inputValue());
  await page.keyboard.press("j");
  await expect(page.locator("#play-toggle")).toContainText("Pause 1x");
  await expect(page.locator("#status-line")).toContainText("Reverse 1x");
  await expect.poll(async () => Number(await page.locator("#timeline-current-time").inputValue())).toBeLessThan(reverseStart);
  await page.keyboard.press("j");
  await expect(page.locator("#status-line")).toContainText("Reverse 2x");
  await page.keyboard.press("k");
  await expect(page.locator("#play-toggle")).toContainText("Play");
  await expect(page.locator("#status-line")).toContainText("Ready");

  expect(errors).toEqual([]);
});

test("creates and saves transform keyframes on the timeline", async ({ page }) => {
  test.setTimeout(480_000);
  const errors: string[] = [];
  await page.addInitScript(() => {
    const downloads: string[] = [];
    (window as unknown as { __sceneDownloads: string[] }).__sceneDownloads = downloads;
    const createObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (object: Blob | MediaSource) => {
      if (object instanceof Blob) {
        void object.text().then((text) => downloads.push(text));
      }
      return createObjectURL(object);
    };
  });
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.getByText("Keyframe Timeline")).toBeVisible();
  await page.locator("#tone-mapping").selectOption("reinhard");
  await page.locator("#shadow-quality").selectOption("medium");
  await page.locator("#render-exposure").evaluate((input) => {
    (input as HTMLInputElement).value = "1.35";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  await page.locator("#timeline-add-keyframe").click();
  await expect(page.locator("#timeline-key-label")).toContainText("Cube | Position");
  await expect(page.locator("#timeline-key-time")).toBeEnabled();
  await expect(page.locator("#timeline-key-x")).toBeEnabled();
  await page.locator("#timeline-key-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0.25";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(Number(await page.locator("#timeline-current-time").inputValue())).toBeCloseTo(0.27, 2);
  await page.locator("#timeline-key-x").evaluate((input) => {
    (input as HTMLInputElement).value = "1.25";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(page.locator("#timeline-key-x")).toHaveValue("1.25");
  await page.locator("#timeline-marker-label").evaluate((input) => {
    (input as HTMLInputElement).value = "Intro Beat";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-add-marker").click();
  await expect(page.locator(".timeline-marker")).toHaveCount(1);
  await expect(page.locator("#timeline-marker-label")).toHaveValue("Intro Beat");
  await page.locator("#timeline-marker-label").evaluate((input) => {
    (input as HTMLInputElement).value = "Opening Cue";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(page.locator(".timeline-marker")).toContainText("Opening Cue");
  await page.locator("#timeline-auto-key").check();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  const positionX = page.locator('.transform-input[data-prop="position"][data-axis="x"]');
  await positionX.evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(positionX).toHaveValue("2");

  const timelineCanvas = page.locator("#timeline-canvas canvas").first();
  await expect(timelineCanvas).toBeVisible();
  await page.locator("#timeline-zoom-fit").click();
  await expect(page.locator("#timeline-zoom-in")).toBeVisible();
  await expect(page.locator("#timeline-zoom-out")).toBeVisible();
  await page.locator("#timeline-duplicate-keyframe").click();
  await expect(page.locator("#timeline-selection")).toContainText("1 keyframe selected");
  await page.locator("#timeline-ease-smooth").click();
  await expect(page.locator("#timeline-ease-smooth")).toHaveClass(/active/);
  await expect(page.locator("#timeline-ease-label")).toContainText("Easy Ease");
  await page.locator("#timeline-copy-keyframes").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-paste-keyframes").click();
  await expect(page.locator("#timeline-selection")).toContainText("1 keyframe selected");
  await page.locator("#timeline-nudge-right").click();
  await page.locator("#timeline-toggle-track").click();
  await expect(page.locator("#timeline-toggle-track")).toContainText("Track Off");
  await expect(page.locator('.timeline-track-label[data-track-kind="position"]').first()).toHaveClass(/disabled-track/);

  await page.locator("#timeline-track-kind").selectOption("rotation");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  const rotationY = page.locator('.transform-input[data-prop="rotation"][data-axis="y"]');
  await rotationY.evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-add-keyframe").click();
  await expect(page.locator("#timeline-add-keyframe")).toContainText("Update Key");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await rotationY.evaluate((input) => {
    (input as HTMLInputElement).value = "360";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-add-keyframe").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(Number(await rotationY.inputValue())).toBeCloseTo(180, 0);

  await page.locator("#timeline-track-kind").selectOption("cameraPosition");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-add-keyframe").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  const cameraX = page.locator('.camera-input[data-group="position"][data-prop="x"]');
  await cameraX.evaluate((input) => {
    (input as HTMLInputElement).value = "9";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(cameraX).toHaveValue("9");

  await page.locator('[data-light="point"]').click();
  await page.locator("#timeline-track-kind").selectOption("pointIntensity");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-add-keyframe").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  const pointIntensity = page.locator("#light-intensity");
  await pointIntensity.evaluate((input) => {
    (input as HTMLInputElement).value = "6";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(pointIntensity).toHaveValue("6");

  await page.locator("#timeline-track-kind").selectOption("objectColor");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-add-keyframe").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "2.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  const objectColor = page.locator("#object-color");
  await objectColor.evaluate((input) => {
    (input as HTMLInputElement).value = "#3366ff";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(objectColor).toHaveValue("#3366ff");

  await page.locator("#timeline-track-kind").selectOption("objectOpacity");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-add-keyframe").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "3";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  const objectOpacity = page.locator("#object-opacity");
  await objectOpacity.evaluate((input) => {
    (input as HTMLInputElement).value = "0.4";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(objectOpacity).toHaveValue("0.4");

  await page.locator("#timeline-track-kind").selectOption("objectRoughness");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-add-keyframe").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "3.25";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  const objectRoughness = page.locator("#object-roughness");
  await objectRoughness.evaluate((input) => {
    (input as HTMLInputElement).value = "0.85";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(objectRoughness).toHaveValue("0.85");

  await page.locator("#timeline-track-kind").selectOption("objectMetalness");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-add-keyframe").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "3.35";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  const objectMetalness = page.locator("#object-metalness");
  await objectMetalness.evaluate((input) => {
    (input as HTMLInputElement).value = "0.55";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(objectMetalness).toHaveValue("0.55");

  await page.locator('[data-texture="uv"]').click();
  await page.locator("#timeline-track-kind").selectOption("objectTextureRepeat");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-add-keyframe").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "4";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator('.texture-repeat[data-axis="x"]').evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator('.texture-repeat[data-axis="y"]').evaluate((input) => {
    (input as HTMLInputElement).value = "3";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  await page.locator("#timeline-track-kind").selectOption("objectTextureOffset");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-add-keyframe").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "4.25";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator('.texture-offset[data-axis="x"]').evaluate((input) => {
    (input as HTMLInputElement).value = "0.15";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator('.texture-offset[data-axis="y"]').evaluate((input) => {
    (input as HTMLInputElement).value = "0.3";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  await page.locator("#timeline-track-kind").selectOption("objectTextureRotation");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-add-keyframe").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "4.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#texture-rotation").evaluate((input) => {
    (input as HTMLInputElement).value = "45";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  await page.locator("#timeline-track-kind").selectOption("objectVisibility");
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-add-keyframe").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "3.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  const objectVisible = page.locator("#object-visible");
  await objectVisible.evaluate((input) => {
    (input as HTMLInputElement).checked = false;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(objectVisible).not.toBeChecked();
  await page.locator("#timeline-work-start").evaluate((input) => {
    (input as HTMLInputElement).value = "0.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-work-end").evaluate((input) => {
    (input as HTMLInputElement).value = "4.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "4.5";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>("#save-scene")?.click();
  });
  const sceneText = await page.waitForFunction(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.at(-1) ?? null);
  const sceneJson = await sceneText.jsonValue();
  expect(sceneJson).toBeTruthy();
  const sceneDocument = JSON.parse(sceneJson as string);

  expect(sceneDocument.version).toBe(6);
  expect(sceneDocument.rendering).toEqual({
    toneMapping: "reinhard",
    exposure: 1.35,
    shadowQuality: "medium",
    environment: "studio",
    postProcessing: {
      fxaa: false,
      dof: false,
      dofFocus: 8,
      dofAperture: 0.025,
      dofMaxBlur: 0.012,
      bloom: false,
      bloomStrength: 0.42,
      bloomRadius: 0.22,
      bloomThreshold: 0.72,
      ssao: false,
      ssaoRadius: 8,
      ssaoMinDistance: 0.005,
      ssaoMaxDistance: 0.12,
      vignette: false,
      vignetteDarkness: 0.75,
      halftone: false,
      halftoneRadius: 3,
      halftoneScatter: 0.35
    }
  });
  expect(sceneDocument.display.motionPath).toBe(true);
  expect(sceneDocument.timeline.version).toBe(10);
  expect(sceneDocument.timeline.duration).toBe(8);
  expect(sceneDocument.timeline.workStart).toBe(0.5);
  expect(sceneDocument.timeline.workEnd).toBe(4.5);
  expect(sceneDocument.timeline.autoKey).toBe(true);
  expect(sceneDocument.timeline.markers).toHaveLength(1);
  expect(sceneDocument.timeline.markers[0].label).toBe("Opening Cue");
  expect(sceneDocument.timeline.markers[0].time).toBeCloseTo(0.267, 3);
  expect(sceneDocument.timeline.camera.tracks).toHaveLength(1);
  expect(sceneDocument.timeline.camera.tracks[0].kind).toBe("cameraPosition");
  expect(sceneDocument.timeline.camera.tracks[0].keyframes).toHaveLength(2);
  expect(sceneDocument.timeline.camera.tracks[0].keyframes[1].value[0]).toBe(9);
  expect(sceneDocument.timeline.lights.tracks).toHaveLength(1);
  expect(sceneDocument.timeline.lights.tracks[0].kind).toBe("pointIntensity");
  expect(sceneDocument.timeline.lights.tracks[0].keyframes).toHaveLength(2);
  expect(sceneDocument.timeline.lights.tracks[0].keyframes[1].value[0]).toBe(6);
  expect(sceneDocument.timeline.objects.length).toBeGreaterThanOrEqual(3);
  const keyedCube = sceneDocument.timeline.objects.find((object: { tracks: Array<{ kind: string }> }) =>
    object.tracks.some((track) => track.kind === "objectColor")
  );
  expect(keyedCube).toBeTruthy();
  const objectTracks = keyedCube!.tracks as Array<{
    kind: string;
    enabled: boolean;
    keyframes: Array<{ time: number; value: number[]; interpolation: string }>;
  }>;
  const positionTrack = objectTracks.find((track) => track.kind === "position")!;
  const rotationTrack = objectTracks.find((track) => track.kind === "rotation")!;
  const colorTrack = objectTracks.find((track) => track.kind === "objectColor")!;
  const opacityTrack = objectTracks.find((track) => track.kind === "objectOpacity")!;
  const roughnessTrack = objectTracks.find((track) => track.kind === "objectRoughness")!;
  const metalnessTrack = objectTracks.find((track) => track.kind === "objectMetalness")!;
  const textureRepeatTrack = objectTracks.find((track) => track.kind === "objectTextureRepeat")!;
  const textureOffsetTrack = objectTracks.find((track) => track.kind === "objectTextureOffset")!;
  const textureRotationTrack = objectTracks.find((track) => track.kind === "objectTextureRotation")!;
  const visibilityTrack = objectTracks.find((track) => track.kind === "objectVisibility")!;
  expect(positionTrack.keyframes).toHaveLength(4);
  expect(positionTrack.enabled).toBe(false);
  expect(positionTrack.keyframes[0].time).toBeCloseTo(0.267, 3);
  expect(positionTrack.keyframes[0].value[0]).toBe(1.25);
  expect(positionTrack.keyframes[1].value[0]).toBe(2);
  const duplicatedPosition = positionTrack.keyframes.find((keyframe) => Math.abs(keyframe.time - 1.033) < 0.001)!;
  expect(duplicatedPosition.value[0]).toBe(2);
  expect(duplicatedPosition.interpolation).toBe("smooth");
  const pastedPosition = positionTrack.keyframes.find((keyframe) => Math.abs(keyframe.time - 1.533) < 0.001)!;
  expect(pastedPosition.value[0]).toBe(2);
  expect(pastedPosition.interpolation).toBe("smooth");
  expect(rotationTrack.keyframes).toHaveLength(2);
  expect(rotationTrack.keyframes[1].value[1]).toBeCloseTo(360, 3);
  expect(colorTrack.keyframes).toHaveLength(2);
  expect(colorTrack.keyframes[1].value[2]).toBeCloseTo(1, 3);
  expect(opacityTrack.keyframes).toHaveLength(2);
  expect(opacityTrack.keyframes[1].value[0]).toBe(0.4);
  expect(roughnessTrack.keyframes).toHaveLength(2);
  expect(roughnessTrack.keyframes[1].value[0]).toBe(0.85);
  expect(metalnessTrack.keyframes).toHaveLength(2);
  expect(metalnessTrack.keyframes[1].value[0]).toBe(0.55);
  expect(textureRepeatTrack.keyframes).toHaveLength(2);
  expect(textureRepeatTrack.keyframes[1].value).toEqual([2, 3, 0]);
  expect(textureOffsetTrack.keyframes).toHaveLength(2);
  expect(textureOffsetTrack.keyframes[1].value).toEqual([0.15, 0.3, 0]);
  expect(textureRotationTrack.keyframes).toHaveLength(2);
  expect(textureRotationTrack.keyframes[1].value[0]).toBeCloseTo(Math.PI / 4, 3);
  expect(visibilityTrack.keyframes).toHaveLength(2);
  expect(visibilityTrack.keyframes[1].value[0]).toBe(0);
  expect(sceneDocument.objects[0].textureName).toBe("uv");
  expect(sceneDocument.objects[0].textureRepeat).toEqual([2, 3]);
  expect(sceneDocument.objects[0].textureOffset).toEqual([0.15, 0.3]);
  expect(sceneDocument.objects[0].textureRotation).toBeCloseTo(Math.PI / 4, 3);

  await page.locator("#timeline-track-kind").selectOption("position");
  await timelineCanvas.click({ force: true });
  await page.keyboard.press("Control+A");
  await expect(page.locator("#timeline-selection")).toContainText("4 keyframes selected");
  await page.keyboard.press("Control+X");
  await expect(page.locator("#timeline-selection")).toContainText("No keyframe selected");
  await page.locator("#undo-btn").click();
  await page.locator("#timeline-track-kind").selectOption("position");
  await page.locator("#timeline-clear-track").click({ force: true });
  await expect(page.locator("#selection-summary")).toContainText("Keyframed");
  expect(errors).toEqual([]);
});
