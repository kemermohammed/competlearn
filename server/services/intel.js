const cala = require('./calaClient');

function normalizeName(name) {
  return (name || '').trim().toLowerCase();
}

// Entity types that can represent a competitor offering.
const COMPETITOR_ENTITY_TYPES = new Set(['Company', 'Organization', 'Product']);

function cleanCompetitorName(raw) {
  let name = (raw || '').replace(/\*\*/g, '').replace(/`/g, '').trim();
  // Drop qualifier parentheticals like "(by Atlassian)", "(formerly Clubhouse)", "(open-source)".
  name = name.replace(/\s*\([^)]*\)\s*$/g, '').trim();
  return name;
}

/**
 * Extract competitor names from a Cala markdown answer. Targets numbered or
 * bulleted list items whose label is bold, e.g. "### 1. **Jira (by Atlassian)**"
 * or "- **ClickUp** — ...".
 */
function parseCompetitorNamesFromMarkdown(markdown) {
  if (!markdown) return [];
  const names = [];
  const seen = new Set();
  const re = /^\s*(?:#{1,6}\s*)?(?:\d+[.)]\s*)?(?:[-*]\s*)?\*\*([^*]+?)\*\*/;
  for (const line of markdown.split('\n')) {
    const match = line.match(re);
    if (!match) continue;
    const name = cleanCompetitorName(match[1]);
    const key = normalizeName(name);
    if (!name || seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }
  return names;
}

function extractSourceUrl(answer) {
  if (!answer || !Array.isArray(answer.context)) return null;
  for (const knowBit of answer.context) {
    if (!Array.isArray(knowBit.origins)) continue;
    for (const origin of knowBit.origins) {
      const url = origin?.document?.url || origin?.source?.url;
      if (url) return url;
    }
  }
  return null;
}

/**
 * Discover 3-5 competitor companies for the given user company via Cala.
 * Returns [{ name, domain, description }]. Empty array if nothing usable.
 */
async function discoverCompetitors(userCompany, { limit = 5 } = {}) {
  const descPart = userCompany.description ? ` It is described as: ${userCompany.description}.` : '';
  const input = `Who are the main competitors of ${userCompany.name}${
    userCompany.domain ? ` (${userCompany.domain})` : ''
  }?${descPart} List the most similar companies.`;

  const answer = await cala.knowledgeSearch(input);
  const seen = new Set([normalizeName(userCompany.name)]);
  const competitors = [];

  // Index returned entities by name so we can attach canonical ids when known.
  const entityByName = new Map();
  for (const entity of answer.entities || []) {
    entityByName.set(normalizeName(entity.name), entity);
  }

  const add = (name, calaEntityId) => {
    const key = normalizeName(name);
    if (!name || seen.has(key)) return;
    seen.add(key);
    competitors.push({ name, domain: null, description: null, calaEntityId: calaEntityId || null });
  };

  // Primary signal: the model's own ranked list in the markdown answer.
  for (const name of parseCompetitorNamesFromMarkdown(answer.content)) {
    if (competitors.length >= limit) break;
    const entity = entityByName.get(normalizeName(name));
    add(entity ? entity.name : name, entity ? entity.id : null);
  }

  // Fallback: pull competitor-like entities directly if the markdown had none.
  if (competitors.length < 3) {
    for (const entity of answer.entities || []) {
      if (competitors.length >= limit) break;
      if (!COMPETITOR_ENTITY_TYPES.has(entity.entity_type)) continue;
      add(entity.name, entity.id);
    }
  }

  return { competitors, answerText: answer.content || '' };
}

// Strip Cala's inline reference ids and markdown markup so stored facts read as
// clean prose in the feed.
function cleanFactText(text) {
  if (!text) return '';
  return text
    .replace(/\[[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\]/gi, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .replace(/^-{3,}\s*$/gm, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Fetch current verified facts about a competitor company via Cala.
 * Returns { factText, sourceUrl }.
 */
async function fetchCompanyFacts(competitor) {
  const input = `What is the latest funding, revenue, growth, product launches, partnerships, hiring, and other notable recent activity of ${competitor.name}${
    competitor.domain ? ` (${competitor.domain})` : ''
  }?`;

  const answer = await cala.knowledgeSearch(input);
  const factText = cleanFactText(answer.content);
  const sourceUrl = extractSourceUrl(answer);
  return { factText, sourceUrl };
}

module.exports = { discoverCompetitors, fetchCompanyFacts, extractSourceUrl };
