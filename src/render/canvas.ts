import type { Project, Photo, CaptionCue } from "../types";
import { templates } from "../data/templates";
import { loadImage } from "../lib/images";
import { ctaText, formatPrice } from "../lib/project";
export interface Assets {
  photos: HTMLImageElement[];
  logo: HTMLImageElement | null;
  qr: HTMLImageElement | null;
}
export async function loadAssets(
  p: Pick<Project, "photos" | "logo" | "khqr">,
): Promise<Assets> {
  const [photos, logo, qr] = await Promise.all([
    Promise.all(p.photos.map((photo) => loadImage(photo.blob))),
    p.logo ? loadImage(p.logo) : null,
    p.khqr ? loadImage(p.khqr) : null,
  ]);
  await Promise.all([
    document.fonts.load("400 32px ShopKhmer"),
    document.fonts.load("600 40px ShopKhmer"),
  ]);
  await document.fonts.ready;
  return { photos, logo, qr };
}
export function captionCues(p: Project): CaptionCue[] {
  const texts = (
    p.outputLanguage === "both"
      ? `${p.copyKm}\n${p.copyEn}`
      : p.outputLanguage === "km"
        ? p.copyKm
        : p.copyEn
  )
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  return texts.map((text, i) => ({
    text,
    start: (i * p.duration * 0.76) / Math.max(texts.length, 1),
    end: ((i + 1) * p.duration * 0.76) / Math.max(texts.length, 1),
  }));
}
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
): string[] {
  const graphemes =
    typeof Intl.Segmenter === "function"
      ? [
          ...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(
            text,
          ),
        ].map((s) => s.segment)
      : Array.from(text);
  const lines: string[] = [];
  let line = "";
  for (const char of graphemes) {
    if (char === "\n") {
      lines.push(line);
      line = "";
      continue;
    }
    if (ctx.measureText(line + char).width > width && line) {
      lines.push(line.trim());
      line = char.trimStart();
    } else line += char;
  }
  if (line) lines.push(line.trim());
  return lines;
}
function textBlock(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  size: number,
  color: string,
  maxLines = 3,
  bold = false,
) {
  ctx.fillStyle = color;
  let fontSize = size;
  let lines: string[] = [];
  do {
    ctx.font = `${bold ? 600 : 400} ${fontSize}px ShopKhmer, sans-serif`;
    lines = wrapText(ctx, text, width);
    if (lines.length <= maxLines) break;
    fontSize -= 1;
  } while (fontSize >= Math.min(20, size));
  const shown = lines.slice(0, maxLines);
  if (lines.length > maxLines) {
    let last = shown.at(-1) ?? "";
    while (last && ctx.measureText(last + "…").width > width)
      last = last.slice(0, -1);
    shown[shown.length - 1] = last + "…";
  }
  shown.forEach((line, i) => ctx.fillText(line, x, y + i * fontSize * 1.6));
  return shown.length * fontSize * 1.6;
}
function cover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  photo: Photo,
  x: number,
  y: number,
  w: number,
  h: number,
  pan: number,
) {
  const scale =
    Math.max(w / image.naturalWidth, h / image.naturalHeight) *
    photo.zoom *
    (1 + pan * 0.025);
  const dw = image.naturalWidth * scale,
    dh = image.naturalHeight * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(
    image,
    x - ((dw - w) * photo.x) / 100,
    y - ((dh - h) * photo.y) / 100,
    dw,
    dh,
  );
  ctx.restore();
}
function contain(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const s = Math.min(w / image.naturalWidth, h / image.naturalHeight);
  ctx.drawImage(
    image,
    x + (w - image.naturalWidth * s) / 2,
    y + (h - image.naturalHeight * s) / 2,
    image.naturalWidth * s,
    image.naturalHeight * s,
  );
}
export function drawStory(
  canvas: HTMLCanvasElement,
  p: Project,
  assets: Assets,
  time: number,
  forceOrder = false,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("exportError");
  const palette = templates[p.template];
  ctx.save();
  ctx.scale(canvas.width / 720, canvas.height / 1280);
  ctx.textBaseline = "top";
  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, 720, 1280);
  const gradient = ctx.createLinearGradient(0, 0, 720, 500);
  gradient.addColorStop(0, `${palette.secondary}24`);
  gradient.addColorStop(1, palette.background);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 720, 300);
  ctx.fillStyle = palette.surface;
  ctx.beginPath();
  ctx.roundRect(40, 150, 640, 950, 28);
  ctx.fill();
  if (assets.logo) contain(ctx, assets.logo, 56, 42, 72, 72);
  textBlock(
    ctx,
    p.business.shop || "SHOP STORY",
    assets.logo ? 146 : 60,
    50,
    assets.logo ? 510 : 600,
    38,
    palette.text,
    1,
    true,
  );
  if (p.business.tagline)
    textBlock(ctx, p.business.tagline, 60, 120, 600, 20, palette.muted, 1);
  const isOrder = forceOrder || time >= p.duration * 0.76;
  textBlock(ctx, p.business.product, 60, 174, 600, 40, palette.text, 2, true);
  const price = formatPrice(
    p.business.khr,
    p.business.usd,
    p.business.currency,
  );
  textBlock(ctx, price, 60, 310, 600, 42, palette.accent, 1, true);
  if (isOrder) {
    textBlock(
      ctx,
      ctaText(p.cta, p.outputLanguage),
      60,
      425,
      590,
      40,
      palette.text,
      3,
      true,
    );
    if (assets.qr) {
      ctx.fillStyle = "#fff";
      ctx.fillRect(170, 640, 380, 320);
      contain(ctx, assets.qr, 185, 655, 350, 290);
    } else if (assets.photos[0])
      cover(ctx, assets.photos[0], p.photos[0], 80, 635, 560, 315, 0);
  } else {
    const index = Math.min(
      assets.photos.length - 1,
      Math.floor((time / (p.duration * 0.76)) * assets.photos.length),
    );
    if (index >= 0)
      cover(
        ctx,
        assets.photos[index],
        p.photos[index],
        60,
        410,
        600,
        430,
        time / p.duration,
      );
    else {
      ctx.fillStyle = palette.secondary;
      ctx.fillRect(60, 410, 600, 430);
      textBlock(ctx, "SHOP STORY", 110, 565, 500, 50, palette.text, 2, true);
    }
    const cue = captionCues(p).find((c) => time >= c.start && time < c.end);
    if (cue) {
      ctx.fillStyle = palette.surface;
      ctx.fillRect(60, p.captionPosition === "top" ? 410 : 850, 600, 160);
      textBlock(
        ctx,
        cue.text,
        76,
        p.captionPosition === "top" ? 420 : 860,
        568,
        p.captionSize,
        palette.text,
        2,
      );
    }
  }
  const contact = [
    p.business.phone,
    p.business.telegram,
    p.business.facebook,
    p.business.location,
    p.business.order,
  ]
    .filter(Boolean)
    .join(" · ");
  textBlock(ctx, contact, 60, 1016, 590, 24, palette.text, 3);
  // The large order CTA appears on the final frame; keep earlier photo frames
  // uncluttered and their contacts above social-app bottom controls.
  ctx.fillStyle = palette.muted;
  ctx.font = "400 18px ShopKhmer, sans-serif";
  ctx.fillText("Khmer One · Shop Story", 60, 1240);
  ctx.restore();
}
