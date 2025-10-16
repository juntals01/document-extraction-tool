import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

export type ReconcileDecision =
  | { action: 'insert' }
  | { action: 'ignore' }
  | { action: 'match'; updates?: Record<string, any> | null }
  | { action: 'update'; updates: Record<string, any> };

@Injectable()
export class OpenAiService {
  private readonly logger = new Logger(OpenAiService.name);
  private readonly client?: OpenAI;
  private readonly model: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    this.model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not set. OpenAI calls will be skipped.');
      this.client = undefined;
    } else {
      this.client = new OpenAI({ apiKey });
    }
  }

  /**
   * Deterministic per-page extractor using your revised schema for gov/agri reports.
   * Returns parsed JSON (or string if model fails JSON).
   */
  async extractGovAgriPage(html: string): Promise<any | null> {
    if (!this.client) {
      this.logger.warn('OpenAI client unavailable; skipping AI extraction.');
      return null;
    }

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
`.trim();

    const resp = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });

    const raw = resp.choices?.[0]?.message?.content?.trim();
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      this.logger.warn('Extractor returned non-JSON; storing raw string.');
      return raw;
    }
  }

  /**
   * Small helper: ask for strict JSON and parse it.
   */
  private async chatJson<T>(system: string, user: string): Promise<T | null> {
    if (!this.client) return null;

    const resp = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });

    const raw = resp.choices?.[0]?.message?.content?.trim();
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch (e) {
      this.logger.warn(`chatJson parse error: ${String(e)}`);
      return null;
    }
  }

  /**
   * 🔴 NEW: Ask the model to decide how to reconcile an incoming AI row vs an existing DB row.
   * Returns one of: {insert} | {ignore} | {match, updates?} | {update, updates}.
   */
  async decideMerge(
    entityLabel: string,
    existing: Record<string, any>,
    incoming: Record<string, any>,
  ): Promise<ReconcileDecision | null> {
    if (!this.client) return null;

    const system = `You return strict JSON only. No prose. You are a deterministic merge oracle for "${entityLabel}" rows.`;

    const user = `
Compare "existing" (DB) vs "incoming" (AI result for the same upload) and return ONE of:

- {"action":"match"}                      // same real-world record; optional "updates" if some fields should change
- {"action":"update","updates":{...}}     // definitely the same record with concrete fields to overwrite in DB
- {"action":"insert"}                     // clearly a new record not present in DB
- {"action":"ignore"}                     // noise/duplicate/insufficient

Rules:
- Be conservative. Update only when incoming is clearly more specific or correct.
- Keep arrays like "evidence" or "relatedGoals" as SET-unions if both exist.
- Prefer numeric/percentage "progress" or "target" from incoming if DB is null.
- Treat titles/names that are very similar (small edit distance) as the same record.
- Return only valid JSON with one of the shapes above.

existing:
${JSON.stringify(existing)}

incoming:
${JSON.stringify(incoming)}
`.trim();

    return this.chatJson<ReconcileDecision>(system, user);
  }
}
