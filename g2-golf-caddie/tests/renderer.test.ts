import { describe, expect, it } from 'vitest';

import { listScreen, textScreen } from '../src/ui/layout.js';
import {
  CANVAS_HEIGHT,
  PageValidationError,
  changedTexts,
  structuralSignature,
  validatePage,
  type Page,
} from '../src/ui/page.js';
import { Renderer } from '../src/ui/renderer.js';
import { justify, truncate } from '../src/ui/text.js';
import { FakeHost } from './fixtures.js';

const screen = (body: string[]) =>
  textScreen({ header: 'H1 PAR 4', body, footer: 'tap: mark' });

describe('page validation', () => {
  it('accepts the standard text screen', () => {
    expect(() => validatePage(screen(['CENTER 152']))).not.toThrow();
  });

  it('requires exactly one capture container', () => {
    const page = screen(['x']);
    const noCapture: Page = {
      ...page,
      texts: page.texts.map((text) => ({ ...text, capture: false })),
    };
    expect(() => validatePage(noCapture)).toThrow(PageValidationError);

    const twoCaptures: Page = {
      ...page,
      texts: page.texts.map((text) => ({ ...text, capture: true })),
    };
    expect(() => validatePage(twoCaptures)).toThrow(/exactly one/);
  });

  it('rejects a container that falls off the display', () => {
    const page = screen(['x']);
    const offscreen: Page = {
      ...page,
      texts: page.texts.map((text, index) =>
        index === 0 ? { ...text, y: CANVAS_HEIGHT - 4, height: 40 } : text,
      ),
    };
    expect(() => validatePage(offscreen)).toThrow(/outside the/);
  });

  it('rejects duplicate container ids', () => {
    const page = screen(['x']);
    const duplicated: Page = {
      ...page,
      texts: page.texts.map((text) => ({ ...text, id: 1 })),
    };
    expect(() => validatePage(duplicated)).toThrow(/duplicate container id/);
  });

  it('rejects an empty page', () => {
    expect(() => validatePage({ texts: [], lists: [] })).toThrow(/at least one/);
  });

  it('keeps the list screen within limits too', () => {
    expect(() =>
      validatePage(listScreen({ header: 'Menu', items: ['a', 'b'], footer: '' })),
    ).not.toThrow();
  });
});

describe('structural diffing', () => {
  it('treats a text-only change as structurally identical', () => {
    expect(structuralSignature(screen(['A']))).toBe(structuralSignature(screen(['B'])));
  });

  it('treats a list change as structural', () => {
    const one = listScreen({ header: 'M', items: ['a'], footer: '' });
    const two = listScreen({ header: 'M', items: ['a', 'b'], footer: '' });
    expect(structuralSignature(one)).not.toBe(structuralSignature(two));
  });

  it('lists only the text containers whose content moved', () => {
    const changed = changedTexts(screen(['A']), screen(['B']));
    expect(changed).toHaveLength(1);
    expect(changed[0]?.name).toBe('body');
  });
});

describe('Renderer', () => {
  it('creates the startup page once, then updates text in place', async () => {
    const host = new FakeHost();
    const renderer = new Renderer(host);

    expect(await renderer.render(screen(['CENTER 152']))).toBe('created');
    expect(await renderer.render(screen(['CENTER 151']))).toBe('updated');

    expect(host.calls.filter((call) => call.kind === 'create')).toHaveLength(1);
    expect(host.calls.filter((call) => call.kind === 'rebuild')).toHaveLength(0);
    expect(host.calls.at(-1)).toMatchObject({ kind: 'text', content: 'CENTER 151' });
  });

  it('skips the bridge entirely when nothing changed', async () => {
    const host = new FakeHost();
    const renderer = new Renderer(host);

    await renderer.render(screen(['CENTER 152']));
    const before = host.calls.length;
    expect(await renderer.render(screen(['CENTER 152']))).toBe('skipped');
    expect(host.calls).toHaveLength(before);
  });

  it('rebuilds when the layout actually changes', async () => {
    const host = new FakeHost();
    const renderer = new Renderer(host);

    await renderer.render(screen(['CENTER 152']));
    expect(
      await renderer.render(listScreen({ header: 'Menu', items: ['a'], footer: '' })),
    ).toBe('rebuilt');
  });

  it('serialises overlapping renders', async () => {
    const host = new FakeHost();
    const renderer = new Renderer(host);

    const results = await Promise.all([
      renderer.render(screen(['A'])),
      renderer.render(screen(['B'])),
      renderer.render(screen(['C'])),
    ]);

    expect(results).toEqual(['created', 'updated', 'updated']);
    expect(host.calls.filter((call) => call.kind === 'create')).toHaveLength(1);
  });

  it('re-creates the page after a reset', async () => {
    const host = new FakeHost();
    const renderer = new Renderer(host);

    await renderer.render(screen(['A']));
    renderer.reset();
    expect(await renderer.render(screen(['A']))).toBe('created');
  });
});

describe('text helpers', () => {
  it('truncates with an ellipsis', () => {
    expect(truncate('Pine Hollow Golf Club', 10)).toBe('Pine Holl…');
    expect(truncate('short', 10)).toBe('short');
  });

  it('justifies a label and value to the edges', () => {
    expect(justify('CENTER', '152', 12)).toBe('CENTER   152');
  });

  it('degrades gracefully when a row will not fit', () => {
    expect(justify('CENTERLINE', '152', 8)).toHaveLength(8);
  });
});
