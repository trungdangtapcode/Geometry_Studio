import { expect, test, type Page } from "@playwright/test";
import { Buffer } from "node:buffer";

type SceneExport = {
  selectedId: string | null;
  objects: Array<{ id: string; name: string; parentId?: string | null; position: number[]; scale: number[] }>;
};

test("parents layers to a null controller and persists the link", async ({ page }) => {
  test.setTimeout(180_000);
  await installSceneDownloadCapture(page);
  await page.goto("/");

  await expect(page.locator("#parent-select")).toHaveValue("");
  await page.locator("#parent-to-null").click();
  await expect(page.locator("#selection-summary")).toContainText("Cube");
  await expect(page.locator("#parent-select")).not.toHaveValue("");
  await expect(page.getByRole("button", { name: "Select Cube", exact: true })).toContainText("Parent: Null Controller");

  const parented = await saveScene(page);
  const cube = parented.objects.find((object) => object.name === "Cube");
  const parent = parented.objects.find((object) => object.name === "Null Controller");
  expect(cube?.parentId).toBe(parent?.id);
  expect(parented.selectedId).toBe(cube?.id);

  await page.locator("#scene-input").setInputFiles({
    name: "parented.scene.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(parented))
  });
  await expect(page.locator("#parent-select")).not.toHaveValue("");
  await expect(page.getByRole("button", { name: "Select Cube", exact: true })).toContainText("Parent: Null Controller");

  await page.locator("#clear-parent").click();
  await expect(page.locator("#parent-select")).toHaveValue("");
  const cleared = await saveScene(page);
  expect(cleared.objects.find((object) => object.name === "Cube")?.parentId ?? null).toBeNull();
});

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
