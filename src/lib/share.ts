export interface ShareContent {
  title: string;
  text?: string;
  url: string;
}

export type ShareResult = "shared" | "copied" | "cancelled";

function copyWithDocument(url: string): boolean {
  const input = document.createElement("textarea");
  input.value = url;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  try {
    input.focus();
    input.select();
    return document.execCommand("copy");
  } finally {
    input.remove();
  }
}

export async function shareContent(content: ShareContent): Promise<ShareResult> {
  if (typeof navigator === "undefined" || typeof window === "undefined") {
    throw new Error("Sharing is not available in this environment.");
  }

  if (typeof navigator.share === "function") {
    try {
      await navigator.share(content);
      return "shared";
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return "cancelled";
      }
    }
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(content.url);
      return "copied";
    }
    if (copyWithDocument(content.url)) return "copied";
  } catch {
    if (copyWithDocument(content.url)) return "copied";
  }

  throw new Error("Could not share or copy this link. Please copy the URL manually.");
}
