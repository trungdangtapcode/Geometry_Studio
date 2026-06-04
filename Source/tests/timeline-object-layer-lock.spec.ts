import { expect, test, type Page } from "@playwright/test";

type SceneExport = {
  selectedId: string;
  objects: Array<{ id: string; name: string; locked?: boolean }>;
};

test("locks selected object layer against destructive object edits", async ({ page }) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  await installSceneDownloadCapture(page);
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  const cubeGroup = page.locator('.timeline-track-group[data-group-target-id="object-1"]');
  const cubeOutliner = page.locator('.outliner-item[data-id="object-1"]');
  const nameInput = page.locator("#object-name");

  await runCommand(page, "toggle selected object layer lock", "timeline.toggle-object-layer-lock");
  await expect(cubeGroup).toHaveClass(/locked-object-layer/);
  await expect(cubeGroup.locator(".track-label-text small")).toContainText("Locked");
  await expect(cubeOutliner).toHaveClass(/locked-object/);
  await expect(page.locator("#selection-summary")).toContainText("Locked");

  const lockedScene = await saveScene(page);
  expect(lockedScene.objects.find((object) => object.id === "object-1")?.locked).toBe(true);

  await nameInput.fill("Locked Cube");
  await nameInput.blur();
  await expect(page.locator("#selection-summary")).toContainText("Cube");
  await expect(page.locator("#selection-summary")).not.toContainText("Locked Cube");

  await page.locator("#delete-selected").click();
  await expect(cubeOutliner).toBeVisible();
  await expect(page.locator("#selection-summary")).toContainText("Cube");

  await runCommand(page, "toggle selected object layer lock", "timeline.toggle-object-layer-lock");
  await expect(cubeGroup).not.toHaveClass(/locked-object-layer/);
  await expect(cubeOutliner).not.toHaveClass(/locked-object/);

  await nameInput.fill("Unlocked Cube");
  await nameInput.blur();
  await expect(page.locator("#selection-summary")).toContainText("Unlocked Cube");

  const unlockedScene = await saveScene(page);
  const selectedObject = unlockedScene.objects.find((object) => object.id === unlockedScene.selectedId);
  expect(selectedObject?.name).toBe("Unlocked Cube");
  expect(selectedObject?.locked).toBe(false);
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
  await page.locator("#save-scene").click({ force: true });
  const sceneText = await page.waitForFunction((count) => {
    const downloads = (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads;
    return downloads && downloads.length > count ? downloads.at(-1) : null;
  }, previousCount);
  return JSON.parse((await sceneText.jsonValue()) as string) as SceneExport;
}
