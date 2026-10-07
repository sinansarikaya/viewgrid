export function captureTiles(width: number, height: number, availableWidth: number, availableHeight: number) {
  if (![width, height, availableWidth, availableHeight].every(v => Number.isFinite(v) && v > 0)) throw new Error('Invalid capture dimensions');
  if (width * height > 32_000_000) throw new Error('Capture exceeds the 32 megapixel limit');
  const tiles = [];
  for (let y = 0; y < height; y += availableHeight) for (let x = 0; x < width; x += availableWidth) {
    tiles.push({ x, y, width: Math.min(availableWidth, width - x), height: Math.min(availableHeight, height - y) });
  }
  return tiles;
}
