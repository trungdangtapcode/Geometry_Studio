import { expect, test, type Page } from "@playwright/test";

test("alt-dragging a layer edge time-stretches in-range object keyframes", async ({ page }) => {
  test.setTimeout(120_000);
  await installSceneExportCapture(page);
  await page.goto("/");

  await setTimelineNumber(page, "#timeline-snap-step", 1);
  await setTimelineNumber(page, "#timeline-current-time", 1);
  await clickButton(page, "#timeline-add-keyframe");
  await setTimelineNumber(page, "#timeline-current-time", 3);
  await clickButton(page, "#timeline-add-keyframe");
  await setTimelineNumber(page, "#timeline-current-time", 4);
  await clickButton(page, "#timeline-layer-out");
  await expect(page.locator('.timeline-layer-bar[data-object-id="object-1"]')).toHaveAttribute("data-layer-end", "4");

  await altDragLayerBarPart(page, "object-1", "end", 4);

  await expect(page.locator('.timeline-layer-bar[data-object-id="object-1"]')).toHaveAttribute("data-layer-start", "0");
  await expect(page.locator('.timeline-layer-bar[data-object-id="object-1"]')).toHaveAttribute("data-layer-end", "8");

  const sceneDocument = await exportedScene(page);
  const positionTrack = objectTrack(sceneDocument, "object-1", "position");
  const visibilityTrack = objectTrack(sceneDocument, "object-1", "objectVisibility");

  expect(positionTrack?.keyframes.map((keyframe) => keyframe.time)).toEqual([2, 6]);
  expect(visibilityTrack?.keyframes.map((keyframe) => [keyframe.time, keyframe.value[0], keyframe.interpolation])).toEqual([
    [0, 1, "hold"]
  ]);
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

async function setTimelineNumber(page: Page, selector: string, value: number): Promise<void> {
  await page.locator(selector).evaluate((input, nextValue) => {
    (input as HTMLInputElement).value = String(nextValue);
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

async function clickButton(page: Page, selector: string): Promise<void> {
  await page.locator(selector).evaluate((button) => {
    (button as HTMLButtonElement).click();
  });
}

async function altDragLayerBarPart(page: Page, objectId: string, part: "start" | "end", deltaSeconds: number): Promise<void> {
  const strip = page.locator("#timeline-layer-strip");
  const bar = page.locator(`.timeline-layer-bar[data-object-id="${objectId}"]`);
  const stripBox = await strip.boundingBox();
  const target = bar.locator(`[data-layer-action="${part === "start" ? "trim-start" : "trim-end"}"]`);
  const targetBox = await target.boundingBox();
  expect(stripBox).toBeTruthy();
  expect(targetBox).toBeTruthy();

  const startX = targetBox!.x + targetBox!.width / 2;
  const startY = targetBox!.y + targetBox!.height / 2;
  const duration = Number(await page.locator("#timeline-duration").inputValue());
  const deltaX = stripBox!.width * (deltaSeconds / duration);

  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Alt" })));
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + deltaX, startY, { steps: 8 });
  await page.mouse.up();
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "Alt" })));
}

async function exportedScene(page: Page): Promise<SceneDocumentExport> {
  const previousCount = await page.evaluate(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.length ?? 0);
  await clickButton(page, "#save-scene");
  const sceneText = await page.waitForFunction((count) => {
    const downloads = (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads;
    return downloads && downloads.length > count ? downloads.at(-1) : null;
  }, previousCount);
  const sceneJson = await sceneText.jsonValue();
  return JSON.parse(sceneJson as string) as SceneDocumentExport;
}

function objectTrack(sceneDocument: SceneDocumentExport, objectId: string, kind: string): TimelineTrackExport | undefined {
  return sceneDocument.timeline.objects
    .find((object) => object.objectId === objectId)
    ?.tracks.find((track) => track.kind === kind);
}

interface SceneDocumentExport {
  timeline: {
    objects: Array<{
      objectId: string;
      tracks: TimelineTrackExport[];
    }>;
  };
}

interface TimelineTrackExport {
  kind: string;
  keyframes: Array<{
    time: number;
    value: number[];
    interpolation: string;
  }>;
}
