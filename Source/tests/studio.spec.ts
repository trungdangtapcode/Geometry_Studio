import { expect, test } from "@playwright/test";
import { Buffer } from "node:buffer";

test("renders the studio and core controls", async ({ page }) => {
  test.setTimeout(360_000);
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
  await page.locator("#post-fxaa-toggle").check();
  await expect(page.locator("#renderer-mode")).toContainText("FXAA On");
  await page.locator("#post-fxaa-toggle").uncheck();
  await expect(page.locator("#post-ssao-radius")).toHaveValue("8");
  await page.locator("#post-bloom-toggle").uncheck();
  await page.locator("#post-vignette-toggle").uncheck();
  await expect(page.locator("#renderer-mode")).toContainText("Post Off");
  await expect(page.getByRole("button", { name: "Ceramic", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Metal", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Glass", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Metal", exact: true }).click();
  await expect(page.locator("#material-mode")).toHaveValue("standard");
  await expect(page.locator("#object-metalness")).toHaveValue("1");
  await expect(page.locator("#object-roughness")).toHaveValue("0.18");
  await expect(page.getByRole("button", { name: "Metal", exact: true })).toHaveClass(/active/);
  await page.getByRole("button", { name: "Glass", exact: true }).click();
  await expect(page.locator("#object-opacity")).toHaveValue("0.42");
  await expect(page.getByRole("button", { name: "Glass", exact: true })).toHaveClass(/active/);
  await expect(page.locator("#timeline-timecode")).toContainText("F0000");
  await expect(page.locator("#timeline-prev-frame")).toBeVisible();
  await expect(page.locator("#timeline-next-frame")).toBeVisible();
  await expect(page.locator("#timeline-selected-start")).toBeVisible();
  await expect(page.locator("#timeline-selected-end")).toBeVisible();
  await expect(page.locator("#timeline-prev-visible-keyframe")).toBeVisible();
  await expect(page.locator("#timeline-next-visible-keyframe")).toBeVisible();
  await expect(page.locator("#timeline-set-transform")).toBeVisible();
  await expect(page.locator("#timeline-set-visible")).toBeVisible();
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
  await expect(page.locator('.camera-track-label[data-track-kind="cameraPosition"]')).toBeVisible();
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
  await page.keyboard.press("=");
  await expect.poll(timelineZoom).toBeGreaterThan(initialTimelineZoom);
  const zoomedTimelineValue = await timelineZoom();
  await page.keyboard.press("-");
  await expect.poll(timelineZoom).toBeLessThan(zoomedTimelineValue);
  await page.keyboard.press("0");
  await expect(page.locator("#timeline-zoom-fit")).toBeVisible();
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
  const cameraTrackLabel = page.locator('.camera-track-label[data-track-kind="cameraPosition"]');
  await page.locator("#timeline-track-kind").selectOption("cameraPosition");
  await expect(cameraTrackLabel).toBeVisible();
  await cameraTrackLabel.click();
  await expect(page.locator("#timeline-track-kind")).toHaveValue("cameraPosition");
  await expect(cameraTrackLabel).toHaveClass(/active/);
  await cameraTrackLabel.locator(".timeline-row-key").click();
  await expect(page.locator("#timeline-key-label")).toContainText("Camera | Camera Position");
  const dockHeight = await page.locator("#keyframe-dock").evaluate((element) => element.getBoundingClientRect().height);
  const resizeBox = await page.locator("#timeline-resize-handle").boundingBox();
  expect(resizeBox).toBeTruthy();
  await page.mouse.move(resizeBox!.x + resizeBox!.width / 2, resizeBox!.y + 4);
  await page.mouse.down();
  await page.mouse.move(resizeBox!.x + resizeBox!.width / 2, resizeBox!.y - 120);
  await page.mouse.up();
  await expect.poll(() => page.locator("#keyframe-dock").evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThan(dockHeight + 20);
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
  await page.locator("#post-ssao-toggle").uncheck();
  await expect(page.locator("#renderer-mode")).toContainText("FXAA On");
  await page.locator("#post-fxaa-toggle").uncheck();
  await expect(page.locator("#renderer-mode")).toContainText("Post Off");
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
  await expect(page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="objectTextureRepeat"]')).toBeVisible();
  await expect(page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="objectTextureOffset"]')).toBeVisible();
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
    '.timeline-track-label[data-track-kind="objectTextureRepeat"], ' +
    '.timeline-track-label[data-track-kind="objectTextureOffset"], ' +
    '.timeline-track-label[data-track-kind="objectTextureRotation"]'
  );
  const visibleRowCount = await visibleTextureRows.count();
  expect(visibleRowCount).toBeGreaterThan(0);

  await page.locator("#timeline-set-visible").click();
  await expect(page.locator("#timeline-selection")).toContainText(`${visibleRowCount} keyframes selected`);
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-set-visible").click();
  await expect(page.locator("#timeline-selection")).toContainText(`${visibleRowCount} keyframes selected`);

  await page.locator("#timeline-select-visible").click();
  await expect(page.locator("#timeline-selection")).toContainText(`${visibleRowCount * 2} keyframes selected`);
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
  await expect(page.locator("#timeline-selection")).toContainText(`${visibleRowCount} keyframes selected`);
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
    '.timeline-track-label[data-track-kind="objectTextureRepeat"], ' +
    '.timeline-track-label[data-track-kind="objectTextureOffset"], ' +
    '.timeline-track-label[data-track-kind="objectTextureRotation"]'
  );
  const visibleRowCount = await visibleTextureRows.count();
  expect(visibleRowCount).toBeGreaterThan(0);

  await page.locator("#timeline-set-visible").click();
  await expect(page.locator("#timeline-selection")).toContainText(`${visibleRowCount} keyframes selected`);
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#timeline-set-visible").click();
  await page.locator("#timeline-select-visible").click();
  await expect(page.locator("#timeline-selection")).toContainText(`${visibleRowCount * 2} keyframes selected`);

  await page.locator("#timeline-select-time").click();
  await expect(page.locator("#timeline-selection")).toContainText(`${visibleRowCount} keyframes selected`);
  await page.locator("#timeline-delete-keyframe").click();
  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>("#save-scene")?.click();
  });
  const sceneText = await page.waitForFunction(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.at(-1) ?? null);
  const sceneJson = await sceneText.jsonValue();
  const sceneDocument = JSON.parse(sceneJson as string);
  const objectTimeline = sceneDocument.timeline.objects.find((object: { objectId: string }) => object.objectId === "object-1");
  (["objectTextureRepeat", "objectTextureOffset", "objectTextureRotation"] as const).forEach((kind) => {
    const track = objectTimeline.tracks.find((candidate: { kind: string }) => candidate.kind === kind);
    expect(track.keyframes.map((keyframe: { time: number }) => keyframe.time)).toEqual([0]);
  });

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "0";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.keyboard.press("Control+Alt+K");
  await expect(page.locator("#timeline-selection")).toContainText(`${visibleRowCount} keyframes selected`);
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
  await expect(page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="objectTextureRepeat"]')).toBeVisible();
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
  await expect(page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="objectTextureRepeat"]')).toBeVisible();
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
  await expect(page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="objectTextureRepeat"]')).toBeVisible();
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
  await expect(page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="objectTextureRepeat"]')).toBeVisible();
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
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-set-transform")).toBeVisible();

  await page.locator("#timeline-set-transform").click();
  await expect(page.locator("#timeline-key-label")).toContainText("Cube | Position");
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
  await page.locator("#timeline-ease-hold").click();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
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
  await expect(page.locator("#timeline-graph-title")).toContainText("Cube | Position X");
  const middleGraphKey = page.locator('.timeline-graph-key.graph-x[data-key-time="2"]').first();
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
  const restoredKey = page.locator('.timeline-graph-key.graph-x[data-key-time="2"]').first();
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
  const middleGraphKeyAgain = page.locator('.timeline-graph-key.graph-x[data-key-time="2"]').first();
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
  const deletableKey = page.locator('.timeline-graph-key.graph-x[data-key-time="2"]').first();
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
  const selectedMiddleKey = page.locator('.timeline-graph-key.graph-x.selected[data-key-time="2"]').first();
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
  const stretchMiddleKey = page.locator('.timeline-graph-key.graph-x.selected[data-key-time="2"]').first();
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
  const secondKey = page.locator('.timeline-graph-key.graph-x[data-key-time="2"]').first();
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

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("m");
  await expect(page.locator(".timeline-marker")).toHaveCount(2);
  await expect(page.locator(".timeline-marker").nth(1)).toContainText("Marker 2");

  await page.keyboard.press("Alt+M");
  expect(Number(await page.locator("#timeline-current-time").inputValue())).toBeCloseTo(0.267, 2);
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
      bloom: false,
      bloomStrength: 0.42,
      bloomRadius: 0.22,
      bloomThreshold: 0.72,
      ssao: false,
      ssaoRadius: 8,
      ssaoMinDistance: 0.005,
      ssaoMaxDistance: 0.12,
      vignette: false,
      vignetteDarkness: 0.75
    }
  });
  expect(sceneDocument.display.motionPath).toBe(true);
  expect(sceneDocument.timeline.version).toBe(9);
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
