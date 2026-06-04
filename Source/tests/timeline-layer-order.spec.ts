import { expect, test, type Page } from "@playwright/test";

type SceneExport = {
  selectedId: string;
  objects: Array<{ id: string; name: string }>;
};

test("moves selected layers through the timeline stack and persists object order", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  await installSceneDownloadCapture(page);
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator('.outliner-item[data-id="object-3"]')).toBeVisible();
  expect(await outlinerOrder(page)).toEqual(["object-1", "object-2", "object-3"]);

  await page.locator('.outliner-item[data-id="object-3"]').click({ force: true });
  await runCommand(page, "move selected layer up", "timeline.move-layer-up");
  expect(await outlinerOrder(page)).toEqual(["object-1", "object-3", "object-2"]);

  await runCommand(page, "move selected layer to top", "timeline.move-layer-top");
  expect(await outlinerOrder(page)).toEqual(["object-3", "object-1", "object-2"]);

  await runCommand(page, "move selected layer down", "timeline.move-layer-down");
  expect(await outlinerOrder(page)).toEqual(["object-1", "object-3", "object-2"]);

  const scene = await saveScene(page);
  expect(scene.selectedId).toBe("object-3");
  expect(scene.objects.map((object) => object.id)).toEqual(["object-1", "object-3", "object-2"]);
  expect(errors).toEqual([]);
});

async function runCommand(page: Page, query: string, commandId: string): Promise<void> {
  await page.keyboard.press("Control+K");
  await page.locator("#command-palette-search").fill(query);
  await expect(page.locator(`[data-command-id="${commandId}"]`)).toBeEnabled();
  await page.locator(`[data-command-id="${commandId}"]`).click({ force: true });
}

async function outlinerOrder(page: Page): Promise<string[]> {
  return page.locator(".outliner-item").evaluateAll((items) =>
    items.map((item) => (item as HTMLElement).dataset.id ?? "")
  );
}

async function installSceneDownloadCapture(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const downloads: string[] = [];
    (window as unknown as { __sceneDownloads: string[] }).__sceneDownloads = downloads;
    const createObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (object: Blob | MediaSource) => {
      if (object instanceof Blob) void object.text().then((text) => downloads.push(text));
      return createObjectURL(object);
    };
  });
}

async function saveScene(page: Page): Promise<SceneExport> {
  const previousCount = await page.evaluate(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.length ?? 0);
  await page.evaluate(() => document.querySelector<HTMLButtonElement>("#save-scene")?.click());
  const sceneText = await page.waitForFunction((count) => {
    const downloads = (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads;
    return downloads && downloads.length > count ? downloads.at(-1) : null;
  }, previousCount);
  return JSON.parse((await sceneText.jsonValue()) as string) as SceneExport;
}
