import type { AssetSourceMetadata, SceneEntry, ToastTone } from "../editor/types";
import { query } from "../utils/dom";

interface AssetSourcePanelCallbacks {
  getSelectedEntry(): SceneEntry | null;
  copyText(text: string): Promise<void>;
  onStatus(message: string, tone: ToastTone): void;
}

export class AssetSourcePanel {
  private readonly section = query<HTMLElement>("#asset-source-section");
  private readonly preview = query<HTMLImageElement>("#asset-source-preview");
  private readonly provider = query<HTMLElement>("#asset-source-provider");
  private readonly license = query<HTMLElement>("#asset-source-license");
  private readonly credit = query<HTMLElement>("#asset-source-title");
  private readonly sourceLink = query<HTMLAnchorElement>("#asset-source-link");
  private readonly copyButton = query<HTMLButtonElement>("#copy-asset-citation");

  constructor(private readonly callbacks: AssetSourcePanelCallbacks) {
    this.copyButton.addEventListener("click", () => {
      void this.copySelectedCitation();
    });
  }

  sync(entry: SceneEntry | null): void {
    const source = entry?.assetSource;
    this.section.hidden = !source;
    if (!source) return;

    this.preview.src = source.previewUrl ?? "";
    this.preview.alt = `${source.title} preview`;
    this.provider.textContent = source.providerLabel;
    this.license.textContent = source.license;
    this.credit.textContent = source.attribution ?? source.title;
    this.sourceLink.href = source.sourceUrl;
    this.sourceLink.title = source.sourceUrl;
  }

  private async copySelectedCitation(): Promise<void> {
    const source = this.callbacks.getSelectedEntry()?.assetSource;
    if (!source) {
      this.callbacks.onStatus("Select an imported catalog asset before copying a citation.", "bad");
      return;
    }

    try {
      await this.callbacks.copyText(assetSourceCitation(source));
      this.callbacks.onStatus("Asset citation copied", "good");
    } catch {
      this.callbacks.onStatus("Clipboard access is unavailable in this browser.", "bad");
    }
  }
}

export function assetSourceCitation(source: AssetSourceMetadata): string {
  return `${source.title}. ${source.providerLabel}. ${source.license}.${source.attribution ? ` Credit: ${source.attribution}.` : ""} Source: ${source.sourceUrl}`;
}
