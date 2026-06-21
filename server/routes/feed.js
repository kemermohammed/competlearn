const express = require('express');
const db = require('../db');
const { refreshCompetitorFeed } = require('../services/feedService');
const { serializeFeedItem } = require('../serialize');

const router = express.Router();

const listCompetitorIdsStmt = db.prepare(
  'SELECT competitor_company_id AS id FROM competitor_links WHERE user_company_id = ?'
);

function wrap(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

// POST /api/feed/refresh-all — refresh the feed for every competitor of a user company
router.post(
  '/refresh-all',
  wrap(async (req, res) => {
    const userCompanyId = Number(req.body?.user_company_id ?? req.body?.userCompanyId);
    if (!userCompanyId) {
      return res.status(400).json({ error: 'user_company_id is required.' });
    }

    const competitorIds = listCompetitorIdsStmt.all(userCompanyId).map((r) => r.id);
    if (competitorIds.length === 0) {
      return res.json({ items: [], errors: [], refreshed: 0 });
    }

    const items = [];
    const errors = [];
    for (const competitorId of competitorIds) {
      try {
        const item = await refreshCompetitorFeed(competitorId);
        items.push(serializeFeedItem(item));
      } catch (err) {
        errors.push({ competitor_company_id: competitorId, error: err.message });
      }
    }

    res.json({ items, errors, refreshed: items.length });
  })
);

module.exports = router;
