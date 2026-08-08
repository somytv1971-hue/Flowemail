/**
 * Converts a message saved by the drag-and-drop builder ("FLOWMAIL_BUILDER:{json}")
 * into email-safe HTML. Plain HTML content is returned unchanged.
 */

type Json = Record<string, any>;

const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

function parseDocument(value: string | null | undefined): Json | null {
  if (!value?.startsWith("FLOWMAIL_BUILDER:")) return null;
  try {
    const parsed = JSON.parse(value.slice("FLOWMAIL_BUILDER:".length)) as Json;
    return Array.isArray(parsed?.blocks) ? parsed : null;
  } catch {
    return null;
  }
}

function blockHtml(block: Json): string {
  const align = block.align ?? "left";
  const color = block.color ?? "#111111";
  const size = block.fontSize ?? 15;
  const base = `text-align:${align};color:${color};font-size:${size}px;line-height:1.6;padding:8px 0;`;

  switch (block.type) {
    case "text":
    case "webinar":
      return `<div style="${base}">${block.content ?? ""}</div>`;
    case "html":
      return `<div style="${base}">${block.content ?? ""}</div>`;
    case "image":
      return block.url
        ? `<div style="text-align:${align};padding:8px 0"><img src="${esc(block.url)}" alt="" style="max-width:100%;border:0" /></div>`
        : "";
    case "button": {
      const bg = block.bgColor ?? "#2563eb";
      const href = block.url || "#";
      return `<div style="text-align:${align};padding:12px 0"><a href="${esc(href)}" style="background:${bg};color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:6px;display:inline-block;font-weight:600">${esc(
        block.content ?? "Click here",
      )}</a></div>`;
    }
    case "video":
      return block.url
        ? `<div style="text-align:${align};padding:8px 0"><a href="${esc(block.url)}">${esc(block.content || "Watch the video")}</a></div>`
        : "";
    case "spacer":
      return `<div style="height:${block.height ?? 24}px"></div>`;
    case "divider":
      return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0" />`;
    case "countdown":
      return `<div style="${base}font-weight:600">${esc(block.content || block.date || "")}</div>`;
    case "social": {
      const socials = (block.socials ?? {}) as Record<string, string>;
      const links = Object.entries(socials)
        .filter(([, url]) => !!url)
        .map(
          ([name, url]) =>
            `<a href="${esc(url)}" style="margin:0 6px;color:#2563eb;text-decoration:none">${esc(name)}</a>`,
        )
        .join("");
      return links ? `<div style="text-align:${align};padding:8px 0">${links}</div>` : "";
    }
    default:
      return block.content ? `<div style="${base}">${block.content}</div>` : "";
  }
}

/** Returns ready-to-send HTML for a stored message body. */
export function renderMessageHtml(contentHtml: string | null | undefined): string {
  const doc = parseDocument(contentHtml);
  if (!doc) return contentHtml ?? "";

  const style = (doc.style ?? {}) as Json;
  const header = (doc.header ?? {}) as Json;
  const footer = (doc.footer ?? {}) as Json;
  const width = Number(style.width ?? 600);
  const bg = style.backgroundColor ?? "#ffffff";

  const headerHtml = header.imageUrl
    ? `<div style="text-align:${header.alignment ?? "center"};background:${
        header.transparent ? "transparent" : (header.backgroundColor ?? "#ffffff")
      };padding:${header.padAll ?? 16}px"><img src="${esc(header.imageUrl)}" alt="${esc(
        header.altText ?? "",
      )}" style="max-width:100%;border:0" /></div>`
    : "";

  const footerHtml = footer.text
    ? `<div style="text-align:${footer.alignment ?? "center"};color:${
        footer.textColor ?? "#6b7280"
      };font-size:${footer.fontSize ?? 12}px;padding:${footer.padAll ?? 16}px;background:${
        footer.transparent ? "transparent" : (footer.backgroundColor ?? "#ffffff")
      }">${footer.text}</div>`
    : "";

  const body = (doc.blocks as Json[]).map(blockHtml).join("");

  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:${width}px;margin:0 auto;background:${bg};padding:24px">
${headerHtml}${body}${footerHtml}
</div>
</body></html>`;
}
