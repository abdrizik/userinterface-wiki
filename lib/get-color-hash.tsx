import ColorHash from "color-hash";

export function getColorHash(string: string): string {
  return new ColorHash({
    saturation: 0.6,
    lightness: 0.6,
  }).hex(string);
}
