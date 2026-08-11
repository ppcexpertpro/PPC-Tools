export type ClipboardResult =
  { ok: true; method: "clipboard-api" | "exec-command" } | { ok: false };

/**
 * Writes text to the clipboard per TRD §8: Clipboard API first, falling back
 * to a hidden-textarea + execCommand shim for older/non-HTTPS contexts.
 * Callers are expected to offer a manual "select and copy" affordance when
 * this resolves to { ok: false }.
 */
export async function copyToClipboard(text: string): Promise<ClipboardResult> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return { ok: true, method: "clipboard-api" };
    } catch {
      // Fall through to the legacy shim below.
    }
  }

  if (typeof document !== "undefined") {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    let succeeded = false;
    try {
      succeeded = document.execCommand("copy");
    } catch {
      succeeded = false;
    }
    document.body.removeChild(textarea);

    if (succeeded) {
      return { ok: true, method: "exec-command" };
    }
  }

  return { ok: false };
}
