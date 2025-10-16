# 🧪 TESTING.md

> Document Extraction Tool — Manual & AI-Assisted Testing Workflow

This document explains how the current extraction logic is tested and verified.  
At present, **testing is done interactively on [ChatGPT.com](https://chat.openai.com)** using the same prompts and HTML content that the backend pipeline sends to OpenAI.

---

## 🎯 Goal

To verify that the **prompt**, **HTML preprocessing**, and **JSON output schema** work correctly before running them in the automated backend worker.

---

## 🧩 Current Testing Process (Manual via ChatGPT)

1. **Prepare one sample page**
   - Extract a single page from the uploaded PDF using `pdf-lib` or any PDF splitter.
   - Convert it to HTML using your `pdf-page.service.ts` logic or any text-to-HTML converter.
   - Copy the generated HTML (with DOCXT markers if available).

2. **Open ChatGPT.com**
   - Use the `gpt-4o-mini` model (same as backend `OPENAI_MODEL`).
   - Paste the **system prompt** and **user prompt** used in extraction:
     ```text
     You are a deterministic data extractor for ONE sanitized HTML page from a government or agricultural report...
     ```
   - Paste the HTML content between the markers:
     ```
     HTML_START
     ... <your extracted HTML> ...
     HTML_END
     ```

3. **Run the prompt**
   - Wait for ChatGPT to return JSON.
   - Validate that the structure matches the schema:
     ```json
     {
       "goals": [],
       "bmps": [],
       "implementation": [],
       "monitoring": [],
       "outreach": [],
       "geographicAreas": []
     }
     ```

4. **Check for accuracy**
   - Confirm that all relevant sections were captured (e.g., “Goals and Objectives”, “BMP Summary”, etc.).
   - Ensure numeric progress, targets, and evidence text were included.
   - If something was missed, refine the prompt wording in your extraction logic and retry.

5. **Record results**
   - Save the HTML and ChatGPT JSON output in:
     ```
     /tests/manual/page-1.html
     /tests/manual/page-1-output.json
     ```
   - Repeat for other pages or reports as needed.

---

## ✅ Validation Checklist

| Item                | Pass Criteria                                        |
| ------------------- | ---------------------------------------------------- |
| JSON valid          | Output parses without error                          |
| Schema match        | All top-level arrays exist                           |
| Data fidelity       | No hallucinations; all values come from visible text |
| Units consistency   | e.g., “%”, “mg/L”, “acres” normalized                |
| Evidence included   | Each record has at least one supporting quote        |
| Page ID consistency | Page ID in output matches test page                  |

---

## 🧠 Debugging Notes

- If ChatGPT outputs **non-JSON**, wrap the prompt with:
  Return ONLY valid JSON. No markdown, no explanations.

- If extracted data is **too generic**, add this line:

Focus on measurable details and page-specific values.

- For inconsistent table parsing, include the raw table text inside `<pre>` tags in the HTML.

---

## 🧰 Planned Automated Tests (Future)

When the backend stabilizes, migrate these manual checks into automated tests:

1. **Unit Tests (NestJS)**

- Validate JSON schema with Zod.
- Test slug generation and idempotent upserts.
- Mock OpenAI API using saved JSON responses.

2. **Integration Tests**

- Use sample PDFs under `/tests/golden`.
- Ensure end-to-end run produces deterministic `contentHash` and entities.

3. **Golden File Comparison**

- Compare new extraction output with baseline JSON to detect regressions.

---

## 📦 Example Command (Future Integration)

```bash
# Run all test suites
npm run test -w backend

# Compare extraction output with golden results
npm run test:e2e -w backend
```
