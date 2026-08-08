/**
 * Text fitting for the HUD.
 *
 * The device renders text containers with its own LVGL font, so exact pixel
 * metrics are not available to the web layer. Everything here works in
 * characters against a conservative average width — the practical consequence
 * is that a line budget is a *floor*, not a promise, and layouts leave slack
 * rather than assuming a perfect fit.
 */

/** Conservative average glyph width, in pixels, for the default HUD font. */
export const CHAR_WIDTH_PX = 12;

/** Line box height used by the device's default text rendering. */
export const LINE_HEIGHT_PX = 28;

export function charsForWidth(widthPx: number): number {
  return Math.max(1, Math.floor(widthPx / CHAR_WIDTH_PX));
}

export function linesForHeight(heightPx: number): number {
  return Math.max(1, Math.floor(heightPx / LINE_HEIGHT_PX));
}

/** Truncate with an ellipsis so long course names cannot break a layout. */
export function truncate(text: string, maxChars: number): string {
  if (maxChars <= 0) return '';
  if (text.length <= maxChars) return text;
  if (maxChars === 1) return '…';
  return `${text.slice(0, maxChars - 1)}…`;
}

export function padEnd(text: string, width: number): string {
  return text.length >= width ? text : text + ' '.repeat(width - text.length);
}

/**
 * Left/right justified row, e.g. `Putts            2`.
 *
 * Used everywhere a label needs a value hard against the right edge; falls back
 * to a single space when the pair simply will not fit.
 */
export function justify(left: string, right: string, width: number): string {
  const gap = width - left.length - right.length;
  if (gap >= 1) return left + ' '.repeat(gap) + right;
  return `${truncate(left, Math.max(1, width - right.length - 1))} ${right}`;
}

/** Fixed-width columns, joined by a single space. */
export function columns(cells: string[], widths: number[]): string {
  return cells
    .map((cell, index) => padEnd(truncate(cell, widths[index] ?? cell.length), widths[index] ?? cell.length))
    .join(' ')
    .trimEnd();
}
