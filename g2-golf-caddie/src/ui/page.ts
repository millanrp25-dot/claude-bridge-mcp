/**
 * Page model for the G2 heads-up display.
 *
 * The SDK speaks in protobuf-shaped container properties with a set of rules
 * that fail at runtime if you get them wrong (container counts, a single event
 * capture, all-or-nothing z-ordering). This module is the one place that knows
 * those rules, so screens can describe a layout and get a validation error at
 * build time instead of a silent `StartUpPageCreateResult.invalid` on device.
 */

/** Physical display, in pixels. Origin is top-left. */
export const CANVAS_WIDTH = 576;
export const CANVAS_HEIGHT = 288;

/** Limits straight from the SDK contract. */
export const MAX_CONTAINERS = 12;
export const MAX_TEXT_CONTAINERS = 8;

export interface TextBox {
  /** Stable across rebuilds — the renderer diffs on it to avoid flicker. */
  id: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  /** Exactly one container per page must capture input. */
  capture?: boolean;
}

export interface ListBox {
  id: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  items: string[];
  capture?: boolean;
  /** Draw a border around the highlighted row. */
  selectBorder?: boolean;
  /** Row to highlight when the page is built. */
  selectedIndex?: number;
}

export interface Page {
  texts: TextBox[];
  lists: ListBox[];
}

export class PageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PageValidationError';
  }
}

function boxes(page: Page): Array<{ id: number; name: string; x: number; y: number; width: number; height: number; capture?: boolean }> {
  return [...page.lists, ...page.texts];
}

/**
 * Enforce every rule the device cares about before anything crosses the bridge.
 */
export function validatePage(page: Page): void {
  const all = boxes(page);

  if (all.length === 0) {
    throw new PageValidationError('a page needs at least one container');
  }
  if (all.length > MAX_CONTAINERS) {
    throw new PageValidationError(
      `page has ${all.length} containers, the device allows ${MAX_CONTAINERS}`,
    );
  }
  if (page.texts.length > MAX_TEXT_CONTAINERS) {
    throw new PageValidationError(
      `page has ${page.texts.length} text containers, the device allows ${MAX_TEXT_CONTAINERS}`,
    );
  }

  const captures = all.filter((box) => box.capture);
  if (captures.length !== 1) {
    throw new PageValidationError(
      `exactly one container must set capture; found ${captures.length}`,
    );
  }

  const seenIds = new Set<number>();
  for (const box of all) {
    if (seenIds.has(box.id)) {
      throw new PageValidationError(`duplicate container id ${box.id}`);
    }
    seenIds.add(box.id);

    if (box.width <= 0 || box.height <= 0) {
      throw new PageValidationError(`container ${box.name} has a non-positive size`);
    }
    if (
      box.x < 0 ||
      box.y < 0 ||
      box.x + box.width > CANVAS_WIDTH ||
      box.y + box.height > CANVAS_HEIGHT
    ) {
      throw new PageValidationError(
        `container ${box.name} (${box.x},${box.y} ${box.width}×${box.height}) ` +
          `falls outside the ${CANVAS_WIDTH}×${CANVAS_HEIGHT} display`,
      );
    }
  }
}

/**
 * Signature of everything except text content.
 *
 * Two pages with the same signature differ only in the strings inside text
 * containers, which is exactly the case `textContainerUpgrade` handles without
 * the visible flicker of a full rebuild.
 */
export function structuralSignature(page: Page): string {
  const lists = page.lists
    .map(
      (list) =>
        `L${list.id}:${list.x},${list.y},${list.width},${list.height}:` +
        `${list.items.join('')}:${list.selectedIndex ?? 0}:${list.capture ? 1 : 0}`,
    )
    .join('|');
  const texts = page.texts
    .map(
      (text) =>
        `T${text.id}:${text.x},${text.y},${text.width},${text.height}:${text.capture ? 1 : 0}`,
    )
    .join('|');
  return `${lists}#${texts}`;
}

/** Text containers whose content changed between two structurally equal pages. */
export function changedTexts(previous: Page, next: Page): TextBox[] {
  const before = new Map(previous.texts.map((text) => [text.id, text.content]));
  return next.texts.filter((text) => before.get(text.id) !== text.content);
}
