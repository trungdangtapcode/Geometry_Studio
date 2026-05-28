import { expect, test } from "@playwright/test";

test("renders the studio and core controls", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Geometry Studio" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cube", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Render mode" })).toBeVisible();

  const canvas = page.locator("canvas").first();
  await expect(canvas).toBeVisible();
  await page.waitForFunction(() => {
    const canvas = document.querySelector("canvas");
    if (!(canvas instanceof HTMLCanvasElement)) return false;
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) return false;
    const pixels = new Uint8Array(4);
    gl.readPixels(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    return pixels.some((value) => value > 0);
  });

  await page.getByRole("button", { name: "Sphere", exact: true }).click();
  await expect(page.locator("#selection-summary")).toContainText("Sphere");

  await page.locator('[data-render="lines"]').click({ force: true });
  await expect(page.locator("#selection-summary")).toContainText("Lines");

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("button", { name: "Cube", exact: true })).toBeVisible();
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
  await expect(page.getByText("Evaluation Tour: required primitives are visible.")).toBeVisible();
});

test("creates and saves transform keyframes on the timeline", async ({ page }) => {
  test.setTimeout(90_000);
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

  await page.locator("#timeline-add-keyframe").click();
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
  await page.locator("#timeline-interpolation").selectOption("smooth");

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

  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>("#save-scene")?.click();
  });
  const sceneText = await page.waitForFunction(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.at(-1) ?? null);
  const sceneJson = await sceneText.jsonValue();
  expect(sceneJson).toBeTruthy();
  const sceneDocument = JSON.parse(sceneJson as string);

  expect(sceneDocument.version).toBe(2);
  expect(sceneDocument.timeline.version).toBe(3);
  expect(sceneDocument.timeline.duration).toBe(8);
  expect(sceneDocument.timeline.autoKey).toBe(true);
  expect(sceneDocument.timeline.camera.tracks).toHaveLength(1);
  expect(sceneDocument.timeline.camera.tracks[0].kind).toBe("cameraPosition");
  expect(sceneDocument.timeline.camera.tracks[0].keyframes).toHaveLength(2);
  expect(sceneDocument.timeline.camera.tracks[0].keyframes[1].value[0]).toBe(9);
  expect(sceneDocument.timeline.objects).toHaveLength(1);
  expect(sceneDocument.timeline.objects[0].tracks[0].kind).toBe("position");
  expect(sceneDocument.timeline.objects[0].tracks[0].keyframes).toHaveLength(3);
  expect(sceneDocument.timeline.objects[0].tracks[0].keyframes[1].value[0]).toBe(2);
  expect(sceneDocument.timeline.objects[0].tracks[0].keyframes[1].interpolation).toBe("smooth");

  await page.locator("#timeline-track-kind").selectOption("position");
  await page.locator("#timeline-clear-track").click({ force: true });
  await expect(page.locator("#selection-summary")).toContainText("Static");
  expect(errors).toEqual([]);
});
