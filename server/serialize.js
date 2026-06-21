function serializeCompany(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    domain: row.domain,
    description: row.description,
    is_user_company: !!row.is_user_company,
    created_at: row.created_at,
  };
}

function serializeFeedItem(row) {
  if (!row) return null;
  return {
    id: row.id,
    competitor_company_id: row.competitor_company_id,
    competitor_name: row.competitor_name,
    competitor_domain: row.competitor_domain,
    fact_summary: row.fact_summary,
    what_happened: row.ai_what_happened,
    why_it_matters: row.ai_why_it_matters,
    consider: row.ai_consider,
    source_url: row.source_url,
    is_mock: !!row.is_mock,
    created_at: row.created_at,
  };
}

module.exports = { serializeCompany, serializeFeedItem };
