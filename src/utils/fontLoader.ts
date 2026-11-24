import { CV_FONTS, getFontById } from '../data/themes';
import type { CVFontId } from '../types/cv';

const loadedFontQueries = new Set<string>();
let catalogLoaded = false;

function injectGoogleFontLink(idAttr: string, href: string): Promise<void> {
  if (typeof document === 'undefined') {
    return Promise.resolve();
  }

  const existing = document.querySelector<HTMLLinkElement>(`link[data-cv-font="${idAttr}"]`);
  if (existing) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-cv-font', idAttr);
    link.onload = () => resolve();
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });
}

/**
 * Loads a single selected Google Font stylesheet on demand (deduplicated).
 */
export async function ensureFontLoaded(fontId: CVFontId): Promise<void> {
  const font = getFontById(fontId);
  if (!font.googleQuery || loadedFontQueries.has(font.googleQuery)) {
    return;
  }
  loadedFontQueries.add(font.googleQuery);
  const href = `https://fonts.googleapis.com/css2?family=${font.googleQuery}&display=swap`;
  await injectGoogleFontLink(font.id, href);
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready;
  }
}

/**
 * Loads all catalog Google Fonts stylesheets when the user opens the Fonts picker
 * so every font option previews its true typeface immediately.
 */
export async function ensureAllCatalogFontsLoaded(): Promise<void> {
  if (catalogLoaded || typeof document === 'undefined') {
    return;
  }
  catalogLoaded = true;

  const queries = CV_FONTS.map((f) => f.googleQuery).filter(
    (q): q is string => q !== null && !loadedFontQueries.has(q)
  );
  if (queries.length === 0) return;

  for (const q of queries) {
    loadedFontQueries.add(q);
  }

  // Split into two compact Google Fonts CSS2 requests to stay well under URL length limits
  const midpoint = Math.ceil(queries.length / 2);
  const chunks = [queries.slice(0, midpoint), queries.slice(midpoint)].filter((c) => c.length > 0);

  await Promise.all(
    chunks.map((chunk, idx) => {
      const familyParams = chunk.map((q) => `family=${q}`).join('&');
      const href = `https://fonts.googleapis.com/css2?${familyParams}&display=swap`;
      return injectGoogleFontLink(`catalog-${idx}`, href);
    })
  );
}
