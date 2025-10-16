# EXTRACTION_LOGIC.md

> Document Extraction Tool — deterministic per‑page pipeline for government and agricultural reports

This file defines the **end‑to‑end extraction logic**, the **HTML markers** we use for reliable parsing, the **prompting contract**, and the **idempotent upsert** flow. It fixes prior inconsistencies (tables/OCR/multipart uploads) and makes the system restartable and testable.

---

## Goals

1. Extract structured data from multi‑page PDFs with **deterministic, per‑page** logic.
2. Normalize inputs (text, tables, images) into **stable HTML with markers**.
3. Run a **guard‑railed LLM prompt** that outputs only JSON matching our schema.
4. **Merge** page‑level results into a single document record with **idempotent upserts**.
5. Be robust to missing fonts, scanned PDFs, and inconsistent tables.

---

## Canonical Data Schema (page & document aggregation)

```ts
// High‑level Typescript schema used across processing & persistence
export type UnitNumber = { value: number; unit: string } | null;

export type Goal = {
  id: string; // stable hash/slug from title+pageId
  title: string | null;
  description: string; // verbatim or concise sentence(s)
  pollutant: string | null; // e.g., TN, TP, TSS, E. coli
  target: UnitNumber; // { value: 30, unit: "% reduction" }
  progress: UnitNumber; // e.g., { value: 65, unit: "% complete" }
  deadline: string | null; // YYYY or YYYY-MM
  location: string | null;
  evidence: string[]; // snippets/quotes/row text
};

export type BMP = {
  id: string;
  name: string | null;
  type: string | null; // e.g., structural, non-structural
  quantity: UnitNumber; // e.g., { value: 12, unit: "units" }
  cost: { value: number; currency: string } | null;
  progress: UnitNumber; // % if available
  location: string | null;
  evidence: string[];
};

export type ImplementationActivity = {
  id: string;
  name: string | null;
  status: string | null; // planned/ongoing/completed
  startDate: string | null; // YYYY-MM or YYYY
  endDate: string | null; // YYYY-MM or YYYY
  metrics: UnitNumber; // numeric highlight if mentioned
  evidence: string[];
};

export type MonitoringMetric = {
  id: string;
  metric: string | null; // e.g., nitrate, turbidity
  value: number | null;
  unit: string | null; // mg/L, NTU, etc.
  station: string | null;
  timeframe: string | null; // e.g., 2021 Q3
  evidence: string[];
};

export type OutreachActivity = {
  id: string;
  audience: string | null; // farmers, residents, schools, etc.
  activity: string | null; // workshop, flyers, training, etc.
  count: UnitNumber; // participants/materials distributed
  evidence: string[];
};

export type GeographicArea = {
  id: string;
  name: string | null; // county, municipality, watershed, barangay, etc.
  type: string | null; // admin, hydrologic, project area
  evidence: string[];
};

export type ExtractedPage = {
  pageId: string; // UUID for page processing run
  pageNo: number; // 1-based
  goals: Goal[];
  bmps: BMP[];
  implementation: ImplementationActivity[];
  monitoring: MonitoringMetric[];
  outreach: OutreachActivity[];
  geographicAreas: GeographicArea[];
};

export type ExtractedDocument = {
  uploadId: string; // Upload entity id
  slug: string; // unique slug for document
  pages: ExtractedPage[]; // union of page results
  // Derived rollups for convenience
  rollup: {
    totalGoals: number;
    totalBMPs: number;
    completionRate: number | null; // computed if enough info
  };
};
```

---

## Pipeline Overview

1. **Split PDF → per‑page PDFs** using `pdf-lib`.
2. **Parse each page** with a resilient strategy:
   - Try **PDF text extraction** (pdf.js in Node‑safe mode).
   - Heuristic **table reconstruction** (text grid) _and/or_ `pdf-table-extractor`.
   - If no text found (scanned PDFs), run **OCR** (Tesseract) and rebuild layout.

3. **Normalize to HTML** with **canonical markers** (below) and minimal styling.
4. **Prompt the LLM** with: (a) strict system instruction, (b) page HTML, (c) output schema. Require **JSON only**.
5. **Validate JSON** (Zod/Yup), attach **evidence** strings, and **persist** page results.
6. **Upsert merge** into document‑level aggregates (idempotent by (uploadId, pageNo)).
7. **Resume/retry** safely using content hashing.

---

## HTML Markers (the “marker” system)

Markers make parsing **deterministic** regardless of fonts/spacing. All render as HTML comments or data attributes so they don’t change visible text.

### Page markers

```html
<!-- DOCXT:PAGE index=5 id="b040a992-9236-42e6-bbea-67b39a935c42" slug="report-2022" -->
```

### Section markers

We wrap detected headings and semantic blocks. The `kind` is one of:
`summary|goal|bmp|implementation|monitoring|outreach|administrative|table|figure|footnote|generic`.

```html
<!-- DOCXT:SECTION_START kind="goal" level=2 text="Goals and Objectives" -->
<h2>Goals and Objectives</h2>
<p>Reduce nutrient and sediment loading...</p>
<!-- DOCXT:SECTION_END kind="goal" -->
```

### Table markers

```html
<!-- DOCXT:TABLE_START id="tbl-5" title="Implementation Schedule" -->
<table data-docxt="table" data-id="tbl-5" data-title="Implementation Schedule">
  <thead>
    ...
  </thead>
  <tbody>
    ...
  </tbody>
</table>
<!-- DOCXT:TABLE_END id="tbl-5" rows=14 cols=6 source="pdf-table-extractor|heuristic" -->
```

### Figure/Image markers

```html
<!-- DOCXT:FIGURE id="fig-3" caption="Monitoring stations" src="/images/page-5-fig-3.png" -->
```

### Provenance markers

Attach the original span/row text used as evidence for each extracted item.

```html
<span data-docxt="evidence" data-key="goal:abc123"
  >Target: 30% reduction in TN by 2026</span
>
```

> **Regex anchors** (parser side):
>
> - `<!--\s*DOCXT:PAGE[^>]*-->`
> - `<!--\s*DOCXT:SECTION_START[^>]*-->` … `<!--\s*DOCXT:SECTION_END[^>]*-->`
> - `<!--\s*DOCXT:TABLE_START[^>]*-->` … `<!--\s*DOCXT:TABLE_END[^>]*-->`

---

## Deterministic IDs & Idempotency

- **pageId**: UUID v4 created on first process of (uploadId, pageNo) and persisted.
- **contentHash**: SHA‑256 of the **normalized HTML w/ markers**.
- **entity id** (e.g., goal.id): `slugify(title||first10words)-shortHash(pageId+evidence)`.
- **Idempotent upsert key**: `(uploadId, pageNo, entityType, entityId)`.
- If **contentHash** unchanged, **skip re‑persist** (no‑op). Enables safe resume.

```ts
const upsertKey = {
  uploadId,
  pageNo,
  entityType: 'goal',
  entityId: goal.id,
};
```

---

## Prompt Contract (single page)

```bash
const system = `You are a deterministic data extractor for ONE sanitized HTML page from a government or agricultural report. Return valid JSON only. No markdown. No comments.`;

    const user = `
Your goal is to identify and extract structured information from this page into a JSON object that fits the schema below.
Use only evidence explicitly found in the page text and headings.

------------------------------------------------------------
✅ OUTPUT SCHEMA
{
  "goals": Goal[],
  "bmps": BMP[],
  "implementation": ImplementationActivity[],
  "monitoring": MonitoringMetric[],
  "outreach": OutreachActivity[],
  "geographicAreas": GeographicArea[]
}

Each array may be empty if no relevant content is found.

------------------------------------------------------------
🏗️ TYPE DEFINITIONS

Goal = {
  "id": string,
  "title": string | null,
  "description": string,
  "pollutant": string | null,
  "target": { "value": number, "unit": string } | null,
  "progress": { "value": number, "unit": string } | null,
  "deadline": string | null,
  "location": string | null,
  "evidence": string[]
}

BMP = {
  "id": string,
  "name": string | null,
  "type": string | null,
  "quantity": { "value": number, "unit": string } | null,
  "cost": { "value": number, "currency": string } | null,
  "progress": { "value": number, "unit": string } | null,
  "location": string | null,
  "responsibleParty": string | null,
  "schedule": { "start": string | null, "end": string | null },
  "relatedGoals": string[],
  "evidence": string[]
}

ImplementationActivity = {
  "id": string,
  "action": string,
  "actor": string | null,
  "start": string | null,
  "end": string | null,
  "budget": { "value": number, "currency": string } | null,
  "status": "planned" | "in-progress" | "completed" | null,
  "progress": { "value": number, "unit": string } | null,
  "dependencies": string[],
  "location": string | null,
  "evidence": string[]
}

MonitoringMetric = {
  "id": string,
  "parameter": string,
  "method": string | null,
  "frequency": string | null,
  "threshold": { "value": number, "unit": string } | null,
  "progress": { "value": number, "unit": string } | null,
  "location": string | null,
  "responsibleParty": string | null,
  "evidence": string[]
}

OutreachActivity = {
  "id": string,
  "audience": string | null,
  "channel": string | null,
  "message": string | null,
  "kpi": { "value": number, "unit": string } | null,
  "progress": { "value": number, "unit": string } | null,
  "schedule": { "start": string | null, "end": string | null },
  "responsibleParty": string | null,
  "evidence": string[]
}

GeographicArea = {
  "id": string,
  "name": string | null,
  "huc": string | null,
  "coordinates": Array<{ "lat": number, "lon": number }> | null,
  "description": string | null,
  "evidence": string[]
}

------------------------------------------------------------
📏 EXTRACTION RULES
- Use only data clearly present in the page text.
- Identify sections through <h1>–<h6> headings or strong contextual phrases like “Objectives”, “Implementation Plan”, “Monitoring”, etc.
- A single page can contain multiple sections — extract all relevant ones.
- Capture all numeric and percentage values linked to progress, completion, targets, or outputs.
- Use concise, verbatim snippets for evidence (short sentences or bullet points, trimmed cleanly).
- Stop a section’s extraction when a new heading for another section begins.
- Return empty arrays for sections not present.
- Return only valid JSON, no explanations or extra text.

------------------------------------------------------------
extractedHtml:
${html}
```

**Post‑validation**

- Parse JSON → validate with Zod → normalize numbers/units → attach `pageId`, `pageNo`.

---

## Per‑Page Processor (pseudo‑code)

```ts
async function processPage(uploadId: string, pageNo: number) {
  const pagePdf = await splitPageWithPdfLib(uploadId, pageNo);

  const htmlParts: string[] = [];
  htmlParts.push(pageMarker(uploadId, pageNo));

  const textRes = await extractTextWithPdfJs(pagePdf);
  const tableRes = await tryExtractTables(pagePdf, textRes);

  if (textRes.empty && tableRes.empty) {
    const ocrRes = await ocrWithTesseract(pagePdf); // fallback
    htmlParts.push(buildHtmlFromOCR(ocrRes));
  } else {
    htmlParts.push(buildHtmlFromText(textRes));
    htmlParts.push(buildHtmlTables(tableRes));
  }

  const normalizedHtml = normalizeAndMark(htmlParts.join('\n'));
  const contentHash = sha256(normalizedHtml);
  if (await isSameHash(uploadId, pageNo, contentHash)) return 'unchanged';

  const llmJson = await runExtractionPrompt(normalizedHtml, { pageNo });
  const data = validateAndNormalize(llmJson);

  await persistPageResults(uploadId, pageNo, data, contentHash);
  await mergeIntoDocument(uploadId, pageNo, data);
}
```

---

## Table Extraction Strategy

1. **Primary**: `pdf-table-extractor` when available.
2. **Heuristic**: build tables from positioned text boxes (tolerance grid, column snapping).
3. **CSV mirror**: every table gets a CSV rendition for QA.
4. **Markers**: always wrap with `DOCXT:TABLE_START/END` and include `source`.
5. **Evidence**: store original row text used for numeric fields.

**Heuristic knobs**

- `colSnapTolerance = 4–8 px`
- `rowSnapTolerance = 3–6 px`
- `minTextHeight = 6 px` to filter headers/footers noise

---

## Persistence & Upserts

- Repositories per entity (`GoalRepository`, `BMPRepository`, etc.).
- **Upsert** by (uploadId, pageNo, entityId). If a later run updates values/evidence, we **replace** row contents but preserve createdAt.
- Document rollups recomputed after each page persist.

---

## Resume & Retry

- **Page status**: `pending → processed → failed` with `error_message`, `attempts`.
- **Backoff**: 0s, 5s, 30s, 2m (max 4 attempts).
- Safe to **re‑enqueue** a single page; idempotent via `contentHash` & upsert keys.

---

## Normalization Rules

- Trim whitespace, collapse multiple spaces, preserve numeric punctuation.
- Convert `“smart quotes”` → `"` for stable hashing.
- Standardize `%`, `mg/L`, `kg/yr`, `NTU`, `acres` units.
- Slugify `id` bases with `[a-z0-9-]` only.

---

## Error Classes (common failures)

- **PdfCanvasContextError**: `canvas.getContext is not a function` → ensure Node‑safe pdf.js (legacy build) or headless Canvas polyfill not required.
- **EmptyContentError**: no text nor OCR result → flag page as `failed`.
- **InvalidJsonError**: LLM returned non‑JSON → retry with _repair_ pass (`json repair` guard) then re‑validate.
- **TableDriftWarning**: heuristic columns not stable across rows → mark table source `heuristic` with confidence.

---

## Testing

- **Unit**: hash stability, marker injection, id generation.
- **Integration**: end‑to‑end on sample PDFs (text‑based and scanned).
- **Golden files**: store normalized HTML & JSON outputs under `tests/golden/` to detect regressions.

---

## CLI / Worker Flow

- Worker starts with `npm run worker:dev -w backend`.
- Jobs: `enqueueUpload(uploadId)` → pages fan‑out → per‑page processors.
- Logs include `pageNo`, `pageId`, `contentHash`, and counts for entities found.

---

## Practical Notes & Fixes vs Previous Attempts

- **“Uploading entire PDF to AI”**: replaced by **per‑page** deterministic pipeline to avoid context overflow and drifting summaries.
- **Inconsistent table extraction**: dual strategy (library + heuristic) with CSV mirror and markers.
- **HTML conversion**: now **normalized & marked**; hashes ensure idempotency and accurate change detection.
- **Upsert on new page**: first iteration creates rows; later runs **update** rows via conflict keys; document rollups recomputed.

---

## Example: Minimal End‑to‑End (TypeScript sketch)

```ts
for (let pageNo = 1; pageNo <= numPages; pageNo++) {
  try {
    await processPage(uploadId, pageNo);
  } catch (err) {
    await markPageFailed(uploadId, pageNo, String(err));
  }
}
```

---

## Migration Checklist

- [ ] Add unique indexes per page entity.
- [ ] Add `pages` table with `content_hash`, `status`, `attempts`, `error_message`.
- [ ] Store normalized HTML for QA under `/storage/pages/{slug}/page-{n}.html`.
- [ ] Store table CSV mirrors under `/storage/pages/{slug}/tables/{tblId}.csv`.

---

## Commit Template

```
feat(processing): deterministic per-page pipeline with HTML markers and idempotent upserts

- add DOCXT markers for page/section/table/figure/evidence
- normalize HTML and compute contentHash for skip logic
- dual table extraction (library + heuristic) with CSV mirror
- strict JSON prompt + Zod validation
- idempotent upserts keyed by (uploadId, pageNo, entityId)
```

---

## Troubleshooting Quick Wins

- **Node pdf.js error** (`canvas.getContext`): import `pdfjs-dist/legacy/build/pdf.mjs` and avoid DOM canvas in Node.
- **OCR slow**: only trigger OCR when **no text** found; cache OCR text per page.
- **LLM JSON drift**: enforce `response_format: json_schema` (if your SDK supports), otherwise retry with JSON repair.
- **Units inconsistent**: run a unit‑normalization pass and store both raw & normalized values.

---

## Future Enhancements

- Table type classifiers (implementation schedule vs cost summary) to auto‑map columns.
- Confidence scoring per entity and page.
- Layout‑aware HTML with coordinates for richer evidence links.
- Streaming tokenizer to pre‑filter boilerplate (headers/footers).
