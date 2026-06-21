const db = require('../db');
const intel = require('./intel');
const { generateInsight } = require('./aiInsight');

const getCompanyStmt = db.prepare('SELECT * FROM companies WHERE id = ?');
const getUserCompanyForCompetitorStmt = db.prepare(`
  SELECT c.* FROM companies c
  JOIN competitor_links l ON l.user_company_id = c.id
  WHERE l.competitor_company_id = ?
  ORDER BY l.created_at ASC
  LIMIT 1
`);
const insertFeedItemStmt = db.prepare(`
  INSERT INTO feed_items
    (competitor_company_id, fact_summary, ai_what_happened, ai_why_it_matters, ai_consider, source_url, is_mock)
  VALUES
    (@competitor_company_id, @fact_summary, @ai_what_happened, @ai_why_it_matters, @ai_consider, @source_url, @is_mock)
`);
const getFeedItemStmt = db.prepare(`
  SELECT f.*, c.name AS competitor_name, c.domain AS competitor_domain
  FROM feed_items f
  JOIN companies c ON c.id = f.competitor_company_id
  WHERE f.id = ?
`);

/**
 * Re-query Cala for the competitor's latest facts, run AI synthesis, and store
 * a new feed item. Returns the created feed item (joined with competitor name).
 */
async function refreshCompetitorFeed(competitorId) {
  const competitor = getCompanyStmt.get(competitorId);
  if (!competitor) {
    const err = new Error('Competitor company not found');
    err.status = 404;
    throw err;
  }

  const userCompany = getUserCompanyForCompetitorStmt.get(competitorId) || {
    name: 'your company',
    domain: null,
    description: null,
  };

  const { factText, sourceUrl } = await intel.fetchCompanyFacts(competitor);
  const safeFactText = factText || `No new verified facts were returned by Cala for ${competitor.name}.`;

  const insight = await generateInsight({
    userCompany,
    competitor,
    calaFactText: safeFactText,
  });

  const info = insertFeedItemStmt.run({
    competitor_company_id: competitor.id,
    fact_summary: safeFactText,
    ai_what_happened: insight.what_happened,
    ai_why_it_matters: insight.why_it_matters,
    ai_consider: insight.consider,
    source_url: sourceUrl,
    is_mock: insight.is_mock ? 1 : 0,
  });

  return getFeedItemStmt.get(info.lastInsertRowid);
}

module.exports = { refreshCompetitorFeed };
