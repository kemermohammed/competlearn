const cala = require('./calaClient');

function normalizeName(name) {
  return (name || '').trim().toLowerCase();
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

  for (const entity of answer.entities || []) {
    if (entity.entity_type !== 'Company' && entity.entity_type !== 'Organization') continue;
    const key = normalizeName(entity.name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    competitors.push({ name: entity.name, domain: null, description: null, calaEntityId: entity.id });
    if (competitors.length >= limit) break;
  }

  return { competitors, answerText: answer.content || '' };
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
  const factText = (answer.content || '').trim();
  const sourceUrl = extractSourceUrl(answer);
  return { factText, sourceUrl };
}

module.exports = { discoverCompetitors, fetchCompanyFacts, extractSourceUrl };
