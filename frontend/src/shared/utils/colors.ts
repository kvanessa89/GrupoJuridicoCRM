// Matches the reference's `color + '1F'` pattern: an 8-digit hex color with a
// fixed alpha suffix, used to tint badge backgrounds from a stage/source color.
export function withAlpha(hex: string, alphaHex = '1F'): string {
  return `${hex}${alphaHex}`;
}
