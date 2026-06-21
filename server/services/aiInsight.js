const config = require('../config');

let openaiClient = null;
function getOpenAI() {
  if (!config.openaiApiKey) return null;
  if (!openaiClient) {
    // Lazy-require so the package isn't initialized when running mock-only.
    const OpenAI = require('openai');
    openaiClient = new OpenAI({ apiKey: config.openaiApiKey });
  }
  return openaiClient;
}

function buildPrompt({ userCompany, competitor, calaFactText }) {
  return `You are a sharp, direct startup mentor. A user runs the following company:

Name: ${userCompany.name}
Domain: ${userCompany.domain || 'N/A'}
Description: ${userCompany.description || 'N/A'}

Here is a VERIFIED fact about one of their competitors, sourced from Cala (a verified structured knowledge graph). Do not add any claim that isn't grounded in the data below.

Competitor: ${competitor.name}
Fact data from Cala: ${calaFactText}

Write a response with exactly these three parts:

1. WHAT HAPPENED — one sentence, strictly factual, restating only what's in the data above.

2. WHY IT LIKELY MATTERS — one to two sentences of informed interpretation (e.g., growth strategy, retention play, margin protection, market signal). Clearly speculative framing ("likely," "this often signals") is fine here — this is the one place interpretation is allowed.

3. WHAT TO CONSIDER — one concrete, specific suggestion for ${userCompany.name}, tailored to their actual business description. Avoid generic advice like "consider improving X" — make it a specific next step tied to the fact above.

Return ONLY valid JSON in this exact shape, no markdown fences, no extra text:
{"what_happened": "...", "why_it_matters": "...", "consider": "..."}`;
}

function parseInsight(raw) {
  if (!raw) return null;
  let text = raw.trim();
  // Strip accidental markdown fences if the model added them.
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  }
  try {
    const parsed = JSON.parse(text);
    if (parsed && parsed.what_happened && parsed.why_it_matters && parsed.consider) {
      return {
        what_happened: String(parsed.what_happened),
        why_it_matters: String(parsed.why_it_matters),
        consider: String(parsed.consider),
      };
    }
  } catch {
    // fall through
  }
  return null;
}

function truncate(text, max = 220) {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trim()}…`;
}

function buildMockInsight({ userCompany, competitor, calaFactText }) {
  const snippet = truncate(calaFactText) || `recent verified activity for ${competitor.name}`;
  return {
    what_happened: `${competitor.name}: ${snippet}`,
    why_it_matters: `This likely signals a strategic move by ${competitor.name} worth watching, as shifts like this often reshape expectations in the space ${userCompany.name} operates in.`,
    consider: `Review where ${competitor.name}'s move overlaps with ${userCompany.name}'s focus${userCompany.description ? ` (${truncate(userCompany.description, 80)})` : ''}, and decide on one concrete response this week.`,
  };
}

/**
 * Generate an insight for a competitor fact.
 * If OPENAI_API_KEY is set, calls OpenAI. Otherwise returns a contextual mock.
 * Always returns { what_happened, why_it_matters, consider, is_mock }.
 */
async function generateInsight({ userCompany, competitor, calaFactText }) {
  const client = getOpenAI();
  if (!client) {
    return { ...buildMockInsight({ userCompany, competitor, calaFactText }), is_mock: true };
  }

  const basePrompt = buildPrompt({ userCompany, competitor, calaFactText });
  const messages = [{ role: 'user', content: basePrompt }];

  const attempt = async () => {
    const completion = await client.chat.completions.create({
      model: config.openaiModel,
      messages,
      temperature: 0.6,
    });
    return completion.choices?.[0]?.message?.content || '';
  };

  let content = await attempt();
  let parsed = parseInsight(content);

  if (!parsed) {
    // Retry once with an explicit JSON-only reminder.
    messages.push({ role: 'assistant', content });
    messages.push({
      role: 'user',
      content: 'Return ONLY valid JSON in the shape {"what_happened":"...","why_it_matters":"...","consider":"..."}, nothing else.',
    });
    content = await attempt();
    parsed = parseInsight(content);
  }

  if (!parsed) {
    // Fall back to a mock so the feed never breaks on a malformed response.
    return { ...buildMockInsight({ userCompany, competitor, calaFactText }), is_mock: true };
  }

  return { ...parsed, is_mock: false };
}

module.exports = { generateInsight, buildPrompt, parseInsight };
