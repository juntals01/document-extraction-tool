// backend/src/processing/utils/html-from-text.ts

export function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function buildHtmlFromTextItems(
  items: Array<any>,
  pageWidth: number,
  pageHeight: number,
): { html: string; plain: string } {
  type Line = { y: number; parts: { text: string; fontSize: number }[] };
  const lines: Line[] = [];
  const yEps = 2.0;

  const getFontSize = (t: number[]) =>
    Math.abs(Math.hypot(t?.[2] ?? 0, t?.[3] ?? 0) || 0);

  for (const it of items) {
    if (!it?.str) continue;
    const y = it.transform?.[5] ?? 0;
    const fontSize = getFontSize(it.transform || []);
    let line = lines.find((l) => Math.abs(l.y - y) <= yEps);
    if (!line) {
      line = { y, parts: [] };
      lines.push(line);
    }
    line.parts.push({ text: it.str, fontSize });
  }

  // sort top→bottom visually (pdf.js y grows upwards)
  lines.sort((a, b) => b.y - a.y);

  const fontSizes = lines.flatMap((l) => l.parts.map((p) => p.fontSize));
  const avg = fontSizes.length
    ? fontSizes.reduce((s, v) => s + v, 0) / fontSizes.length
    : 0;
  const max = fontSizes.length ? Math.max(...fontSizes) : 0;

  const h1Thresh = Math.max(avg * 1.45, max * 0.9);
  const h2Thresh = Math.max(avg * 1.2, max * 0.75);

  const asTextLines: string[] = [];
  let html = `<div class="pdf-page" data-width="${pageWidth}" data-height="${pageHeight}">`;

  for (const line of lines) {
    const text = line.parts
      .map((p) => p.text)
      .join('')
      .trim();
    if (!text) continue;
    asTextLines.push(text);

    const lineAvg =
      line.parts.reduce((s, p) => s + p.fontSize, 0) /
      Math.max(1, line.parts.length);

    if (lineAvg >= h1Thresh) html += `<h1>${escapeHtml(text)}</h1>`;
    else if (lineAvg >= h2Thresh) html += `<h2>${escapeHtml(text)}</h2>`;
    else html += `<p>${escapeHtml(text)}</p>`;
  }

  html += `</div>`;
  return { html, plain: asTextLines.join('\n') };
}
