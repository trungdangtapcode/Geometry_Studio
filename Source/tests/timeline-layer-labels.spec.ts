import { expect, test, type Page } from "@playwright/test";

type SceneExport = {
  selectedId: string;
  objects: Array<{ id: string; name: string; layerLabel?: string }>;
};

test("cycles layer label colors from the timeline and preserves them when duplicating layers", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  await installSceneDownloadCapture(page);
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  const cubeGroup = page.locator('.timeline-track-group[data-group-target-id="object-1"]');
  const swatch = cubeGroup.locator(".timeline-layer-label-swatch");
  await expect(swatch).toHaveAttribute("title", /Layer label: Source/);

  await swatch.click();
  await expect(swatch).toHaveAttribute("title", /Layer label: Red/);

  await runCommand(page, "cycle layer label color", "timeline.cycle-layer-label");
  await expect(swatch).toHaveAttribute("title", /Layer label: Orange/);

  const labeledScene = await saveScene(page);
  const cube = labeledScene.objects.find((object) => object.name === "Cube");
  expect(cube?.layerLabel).toBe("orange");

  await page.locator("#timeline-duplicate-layer").click();
  await expect(page.locator("#selection-summary")).toContainText("Cube Copy");

  const duplicatedScene = await saveScene(page);
  const duplicate = duplicatedScene.objects.find((object) => object.id === duplicatedScene.selectedId);
  expect(duplicate?.name).toBe("Cube Copy");
  expect(duplicate?.layerLabel).toBe("orange");
  expect(errors).toEqual([]);
});

async function runCommand(page: Page, query: string, commandId: string): Promise<void> {
  await page.keyboard.press("Control+K");
  await page.locator("#command-palette-search").fill(query);
  await expect(page.locator(`[data-command-id="${commandId}"]`)).toBeEnabled();
  await page.locator(`[data-command-id="${commandId}"]`).click({ force: true });
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
  await page.locator("#save-scene").click();
  const sceneText = await page.waitForFunction((count) => {
    const downloads = (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads;
    return downloads && downloads.length > count ? downloads.at(-1) : null;
  }, previousCount);
  return JSON.parse((await sceneText.jsonValue()) as string) as SceneExport;
}
