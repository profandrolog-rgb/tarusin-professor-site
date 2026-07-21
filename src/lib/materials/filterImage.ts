// Общие фильтры для извлечённых изображений: отсекаем мелочь и однотонные картинки
// (логотипы, линейки, элементы вёрстки).

export const MIN_DIM = 200;

export function getImageDims(blob: Blob): Promise<{ w: number; h: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve({ w: img.naturalWidth, h: img.naturalHeight }); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

/** Возвращает stdev яркости по сэмплу — если < 8, картинка считается однотонной. */
export async function measureVariance(blob: Blob): Promise<number> {
  try {
    const bmp = await createImageBitmap(blob);
    const size = 32;
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext("2d");
    if (!ctx) return 999;
    ctx.drawImage(bmp, 0, 0, size, size);
    const d = ctx.getImageData(0, 0, size, size).data;
    const lums: number[] = [];
    for (let i = 0; i < d.length; i += 4) {
      lums.push(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
    }
    const mean = lums.reduce((a, b) => a + b, 0) / lums.length;
    const varSum = lums.reduce((a, b) => a + (b - mean) ** 2, 0) / lums.length;
    return Math.sqrt(varSum);
  } catch {
    return 999;
  }
}

export async function shouldKeepImage(blob: Blob): Promise<{ keep: boolean; w: number; h: number }> {
  const dims = await getImageDims(blob);
  if (!dims) return { keep: false, w: 0, h: 0 };
  if (dims.w < MIN_DIM || dims.h < MIN_DIM) return { keep: false, ...dims };
  const stdev = await measureVariance(blob);
  if (stdev < 8) return { keep: false, ...dims };
  return { keep: true, ...dims };
}
