const config = require('../config');

class CalaError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'CalaError';
    this.status = status;
  }
}

function ensureKey() {
  if (!config.calaApiKey) {
    throw new CalaError('CALA_API_KEY is not set. Add it to .env.local.', 500);
  }
}

async function request(method, pathname, { body, query } = {}) {
  ensureKey();
  const url = new URL(pathname, config.calaBaseUrl);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        for (const v of value) url.searchParams.append(key, v);
      } else {
        url.searchParams.set(key, String(value));
      }
    }
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: {
        'X-API-KEY': config.calaApiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new CalaError(`Could not reach Cala API: ${err.message}`, 502);
  }

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const detail =
      (data && typeof data === 'object' && (data.message || JSON.stringify(data.detail || data))) ||
      text ||
      res.statusText;
    throw new CalaError(`Cala API error (${res.status}): ${detail}`, res.status);
  }

  return data;
}

// POST /v1/knowledge/query — structured, typed JSON rows
function knowledgeQuery(input, { returnEntities = true } = {}) {
  return request('POST', '/v1/knowledge/query', {
    body: { input, return_entities: returnEntities },
  });
}

// POST /v1/knowledge/search — natural-language markdown answer with citations
function knowledgeSearch(input, { explainability = true, returnEntities = true } = {}) {
  return request('POST', '/v1/knowledge/search', {
    body: { input, explainability, return_entities: returnEntities },
  });
}

// GET /v1/entities — fuzzy entity search by name
function entitySearch(name, { entityTypes, limit } = {}) {
  return request('GET', '/v1/entities', {
    query: { name, entity_types: entityTypes, limit },
  });
}

// GET /v1/entities/{id} — full entity profile
function getEntity(id) {
  return request('GET', `/v1/entities/${encodeURIComponent(id)}`);
}

module.exports = {
  CalaError,
  knowledgeQuery,
  knowledgeSearch,
  entitySearch,
  getEntity,
};
