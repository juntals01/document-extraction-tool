import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

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
   * Analyze a document’s page texts and produce a structured outline (titles, subheadings, sections).
   * You can change the prompt to match your schema.
   */
  async analyzeDocumentStructure(pages: string[]): Promise<any | null> {
    if (!this.client) {
      this.logger.warn('OpenAI client unavailable; returning null.');
      return null;
    }

    const system = `You are a PDF structure analyzer. Extract a clean outline:
- titles, subheadings, and section text per page
- infer hierarchy when obvious
- return strict JSON: { pages: [{ page: number, blocks: [{ type: "title"|"heading"|"paragraph"|"list"|"table"|"figure", text: string, level?: number }] }] }`;

    const user = [
      `Document has ${pages.length} pages.`,
      `Provide JSON only, no markdown.`,
      `Pages:`,
      ...pages.map((t, i) => `--- Page ${i + 1} ---\n${t}`),
    ].join('\n');

    const resp = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });

    const content = resp.choices?.[0]?.message?.content?.trim();
    if (!content) return null;

    try {
      return JSON.parse(content);
    } catch (e) {
      this.logger.warn(
        'OpenAI returned non-JSON content; returning raw string.',
      );
      return content;
    }
  }
}
