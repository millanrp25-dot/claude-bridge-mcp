/**
 * Shared screen frame.
 *
 * The HUD API offers no font sizing, so every screen is the same three-band
 * layout — a header line, a body block, and a hint footer — and differences
 * between screens live entirely in the strings. Keeping the geometry identical
 * across text screens also means moving between them is a `textContainerUpgrade`
 * rather than a rebuild, so navigation does not flash.
 */

import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  type ListBox,
  type Page,
  type TextBox,
} from './page.js';
import { charsForWidth, linesForHeight, truncate } from './text.js';

/** Stable container ids; the renderer diffs on these. */
export const CONTAINER = {
  header: 1,
  body: 2,
  footer: 3,
  list: 4,
} as const;

const MARGIN_X = 8;
const CONTENT_WIDTH = CANVAS_WIDTH - MARGIN_X * 2;

const HEADER = { x: MARGIN_X, y: 0, width: CONTENT_WIDTH, height: 28 };
const BODY = { x: MARGIN_X, y: 34, width: CONTENT_WIDTH, height: 210 };
const FOOTER = { x: MARGIN_X, y: 250, width: CONTENT_WIDTH, height: 28 };

if (FOOTER.y + FOOTER.height > CANVAS_HEIGHT) {
  throw new Error('layout bands exceed the display height');
}

/** Characters that fit on one line of the content area. */
export const CONTENT_CHARS = charsForWidth(CONTENT_WIDTH);

/** Body lines available before content is clipped by the device. */
export const BODY_LINES = linesForHeight(BODY.height);

export interface TextScreenOptions {
  header: string;
  /** Rendered as one container with embedded newlines. */
  body: string[];
  footer: string;
}

/**
 * Body lines are joined into a single container rather than one container per
 * line: the device allows only 8 text containers but 10 visible lines, and a
 * single multi-line label sidesteps that ceiling entirely.
 */
export function textScreen({ header, body, footer }: TextScreenOptions): Page {
  const texts: TextBox[] = [
    {
      id: CONTAINER.header,
      name: 'header',
      ...HEADER,
      content: truncate(header, CONTENT_CHARS),
    },
    {
      id: CONTAINER.body,
      name: 'body',
      ...BODY,
      content: body
        .slice(0, BODY_LINES)
        .map((line) => truncate(line, CONTENT_CHARS))
        .join('\n'),
      // The body captures input on text screens; there is no list to take it.
      capture: true,
    },
    {
      id: CONTAINER.footer,
      name: 'footer',
      ...FOOTER,
      content: truncate(footer, CONTENT_CHARS),
    },
  ];

  return { texts, lists: [] };
}

/**
 * Overlay an active toast onto a page's footer.
 *
 * Applied centrally by the app so transient feedback ("Ball marked", "No GPS fix
 * yet") shows on every screen, not just the ones that remembered to render it.
 */
export function applyToast(
  page: Page,
  toast: { text: string; until: number } | undefined,
  now: number,
): Page {
  if (!toast || toast.until <= now) return page;
  return {
    ...page,
    texts: page.texts.map((text) =>
      text.id === CONTAINER.footer
        ? { ...text, content: truncate(toast.text, CONTENT_CHARS) }
        : text,
    ),
  };
}

export interface ListScreenOptions {
  header: string;
  items: string[];
  selectedIndex?: number;
  footer: string;
}

export function listScreen({
  header,
  items,
  selectedIndex,
  footer,
}: ListScreenOptions): Page {
  const list: ListBox = {
    id: CONTAINER.list,
    name: 'menu',
    ...BODY,
    items: items.map((item) => truncate(item, CONTENT_CHARS)),
    capture: true,
    selectBorder: true,
    ...(selectedIndex !== undefined ? { selectedIndex } : {}),
  };

  return {
    lists: [list],
    texts: [
      {
        id: CONTAINER.header,
        name: 'header',
        ...HEADER,
        content: truncate(header, CONTENT_CHARS),
      },
      {
        id: CONTAINER.footer,
        name: 'footer',
        ...FOOTER,
        content: truncate(footer, CONTENT_CHARS),
      },
    ],
  };
}
