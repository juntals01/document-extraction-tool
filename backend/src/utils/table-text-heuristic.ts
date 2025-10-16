// backend/src/processing/utils/table-text-heuristic.ts
import { escapeHtml } from './html-from-text';

export function splitColumns(line: string): string[] {
  return line
    .split(/\s{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function buildTablesFromPlainText(plain: string): string[] {
  const lines = plain.split(/\r?\n/).map((l) => l.trim());
  const tables: string[][][] = [];
  let cur: string[][] = [];
  const MIN_COLS = 3;

  for (const l of lines) {
    if (!l) {
      if (cur.length) {
        tables.push(cur);
        cur = [];
      }
      continue;
    }
    const cols = splitColumns(l);
    if (cols.length >= MIN_COLS) cur.push(cols);
    else if (cur.length) {
      tables.push(cur);
      cur = [];
    }
  }
  if (cur.length) tables.push(cur);

  return tables.map((rows) => {
    const maxCols = Math.max(...rows.map((r) => r.length));
    const thead = rows[0];
    const body = rows.slice(1);
    let html = `<table data-detected="text-heuristic"><thead><tr>`;
    for (let i = 0; i < maxCols; i++)
      html += `<th>${escapeHtml(thead?.[i] ?? '')}</th>`;
    html += `</tr></thead><tbody>`;
    for (const r of body) {
      html += `<tr>`;
      for (let i = 0; i < maxCols; i++)
        html += `<td>${escapeHtml(r?.[i] ?? '')}</td>`;
      html += `</tr>`;
    }
    html += `</tbody></table>`;
    return html;
  });
}
