export const MAX_IMAGE_SIZE = 12 * 1024 * 1024;
export function validateImage(
  file: Pick<File, "type" | "size">,
): string | null {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    return "imageType";
  if (file.size === 0 || file.size > MAX_IMAGE_SIZE) return "imageSize";
  return null;
}
export async function hasImageSignature(blob: Blob): Promise<boolean> {
  const a = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
  return (
    (a[0] === 255 && a[1] === 216 && a[2] === 255) ||
    (a[0] === 137 && a[1] === 80 && a[2] === 78 && a[3] === 71) ||
    (a[0] === 82 &&
      a[1] === 73 &&
      a[2] === 70 &&
      a[3] === 70 &&
      a[8] === 87 &&
      a[9] === 69 &&
      a[10] === 66 &&
      a[11] === 80)
  );
}
export async function loadImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("imageDecode"));
    };
    image.src = url;
  });
}
export function resizeDimensions(width: number, height: number, max = 1600) {
  const scale = Math.min(1, max / Math.max(width, height));
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}
export async function compressImage(file: File, qr = false): Promise<Blob> {
  const invalid = validateImage(file);
  if (invalid) throw new Error(invalid);
  if (!(await hasImageSignature(file))) throw new Error("imageDecode");
  const image = await loadImage(file);
  if (image.naturalWidth * image.naturalHeight > 45_000_000)
    throw new Error("imageSize");
  const size = resizeDimensions(
    image.naturalWidth,
    image.naturalHeight,
    qr ? 1400 : 1600,
  );
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("imageDecode");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, size.width, size.height);
  ctx.drawImage(image, 0, 0, size.width, size.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("imageDecode"))),
      qr ? "image/png" : "image/jpeg",
      0.86,
    ),
  );
}
