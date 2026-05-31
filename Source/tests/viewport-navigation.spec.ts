import { expect, test, type Page } from "@playwright/test";

test("uses Blender-style middle mouse viewport navigation", async ({ page }) => {
  test.setTimeout(120_000);
  await installSceneExportCapture(page);
  await page.goto("/");

  const initial = await exportedScene(page);
  await dragViewport(page, "left", 130, -45);
  const leftOrbited = await exportedScene(page);
  expect(distance(initial.camera.position, leftOrbited.camera.position)).toBeGreaterThan(0.25);
  expect(distance(initial.camera.target, leftOrbited.camera.target)).toBeLessThan(0.001);
  expect(leftOrbited.selectedId).toBe(initial.selectedId);

  await dragViewport(page, "middle", 160, -70);
  const orbited = await exportedScene(page);
  expect(distance(leftOrbited.camera.position, orbited.camera.position)).toBeGreaterThan(0.25);
  expect(distance(initial.camera.target, orbited.camera.target)).toBeLessThan(0.001);
  expect(orbited.selectedId).toBe(initial.selectedId);

  await dragViewport(page, "middle", 90, 45, ["Shift"]);
  const panned = await exportedScene(page);
  expect(distance(orbited.camera.target, panned.camera.target)).toBeGreaterThan(0.05);

  const beforeZoomDistance = cameraTargetDistance(panned);
  await dragViewport(page, "middle", 0, -120, ["Control"]);
  const zoomed = await exportedScene(page);
  expect(Math.abs(cameraTargetDistance(zoomed) - beforeZoomDistance)).toBeGreaterThan(0.05);
});

test("frames selected object and full scene like a 3D editor viewport", async ({ page }) => {
  test.setTimeout(120_000);
  await installSceneExportCapture(page);
  await page.goto("/");

  const initial = await exportedScene(page);
  await page.locator("#frame-selected-view").click();
  const framedSelected = await exportedScene(page);
  expect(framedSelected.selectedId).toBe(initial.selectedId);
  expect(distance(initial.camera.position, framedSelected.camera.position)).toBeGreaterThan(0.05);
  expect(cameraTargetDistance(framedSelected)).toBeLessThan(cameraTargetDistance(initial));
  expect(Math.abs(framedSelected.camera.target[0])).toBeLessThan(0.4);
  expect(Math.abs(framedSelected.camera.target[2])).toBeLessThan(0.4);

  await page.keyboard.press("Control+Z");
  const undone = await exportedScene(page);
  expect(distance(undone.camera.target, initial.camera.target)).toBeLessThan(0.001);

  await page.keyboard.press("F");
  const shortcutFramed = await exportedScene(page);
  expect(distance(shortcutFramed.camera.target, framedSelected.camera.target)).toBeLessThan(0.001);

  await page.locator("#frame-all-view").click();
  const framedAll = await exportedScene(page);
  expect(cameraTargetDistance(framedAll)).toBeGreaterThan(cameraTargetDistance(shortcutFramed));
  expect(Math.abs(framedAll.camera.target[0])).toBeLessThan(1.5);
});

async function installSceneExportCapture(page: Page): Promise<void> {
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
}

async function dragViewport(
  page: Page,
  button: "left" | "middle" | "right",
  deltaX: number,
  deltaY: number,
  modifiers: Array<"Shift" | "Control"> = []
): Promise<void> {
  const canvasBox = await page.locator("#scene-canvas").boundingBox();
  expect(canvasBox).toBeTruthy();
  const startX = canvasBox!.x + canvasBox!.width * 0.42;
  const startY = canvasBox!.y + canvasBox!.height * 0.42;

  for (const modifier of modifiers) await page.keyboard.down(modifier);
  await page.mouse.move(startX, startY);
  await page.mouse.down({ button });
  await page.mouse.move(startX + deltaX, startY + deltaY, { steps: 10 });
  await page.mouse.up({ button });
  for (const modifier of modifiers.reverse()) await page.keyboard.up(modifier);
  await page.waitForTimeout(180);
}

async function exportedScene(page: Page): Promise<SceneDocumentExport> {
  const previousCount = await page.evaluate(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.length ?? 0);
  await page.locator("#save-scene").evaluate((button) => {
    (button as HTMLButtonElement).click();
  });
  const sceneText = await page.waitForFunction((count) => {
    const downloads = (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads;
    return downloads && downloads.length > count ? downloads.at(-1) : null;
  }, previousCount);
  const sceneJson = await sceneText.jsonValue();
  return JSON.parse(sceneJson as string) as SceneDocumentExport;
}

function cameraTargetDistance(sceneDocument: SceneDocumentExport): number {
  return distance(sceneDocument.camera.position, sceneDocument.camera.target);
}

function distance(left: [number, number, number], right: [number, number, number]): number {
  return Math.hypot(left[0] - right[0], left[1] - right[1], left[2] - right[2]);
}

interface SceneDocumentExport {
  selectedId: string | null;
  camera: {
    position: [number, number, number];
    target: [number, number, number];
  };
}
