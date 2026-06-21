const express = require('express');
const db = require('../db');
const intel = require('../services/intel');
const { refreshCompetitorFeed } = require('../services/feedService');
const { serializeCompany, serializeFeedItem } = require('../serialize');

const router = express.Router();

const insertCompanyStmt = db.prepare(`
  INSERT INTO companies (name, domain, description, is_user_company)
  VALUES (@name, @domain, @description, @is_user_company)
`);
const getCompanyStmt = db.prepare('SELECT * FROM companies WHERE id = ?');
const getCurrentUserCompanyStmt = db.prepare(
  'SELECT * FROM companies WHERE is_user_company = 1 ORDER BY created_at DESC, id DESC LIMIT 1'
);
const findCompanyByNameStmt = db.prepare(
  'SELECT * FROM companies WHERE lower(name) = lower(?) ORDER BY id ASC LIMIT 1'
);
const linkStmt = db.prepare(`
  INSERT OR IGNORE INTO competitor_links (user_company_id, competitor_company_id)
  VALUES (?, ?)
`);
const listCompetitorsStmt = db.prepare(`
  SELECT c.* FROM companies c
  JOIN competitor_links l ON l.competitor_company_id = c.id
  WHERE l.user_company_id = ?
  ORDER BY c.created_at ASC, c.id ASC
`);
const feedForUserCompanyStmt = db.prepare(`
  SELECT f.*, c.name AS competitor_name, c.domain AS competitor_domain
  FROM feed_items f
  JOIN companies c ON c.id = f.competitor_company_id
  JOIN competitor_links l ON l.competitor_company_id = c.id
  WHERE l.user_company_id = ?
  ORDER BY f.created_at DESC, f.id DESC
`);

function wrap(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

// GET /api/companies/current — the registered user company (or null)
router.get('/current', (req, res) => {
  const company = getCurrentUserCompanyStmt.get();
  res.json({ company: serializeCompany(company) });
});

// POST /api/companies/register
router.post('/register', (req, res) => {
  const { name, domain, description } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Company name is required.' });
  }
  const info = insertCompanyStmt.run({
    name: String(name).trim(),
    domain: domain ? String(domain).trim() : null,
    description: description ? String(description).trim() : null,
    is_user_company: 1,
  });
  const company = getCompanyStmt.get(info.lastInsertRowid);
  res.status(201).json({ company: serializeCompany(company) });
});

// GET /api/companies/:id/competitors — list linked competitors
router.get('/:id/competitors', (req, res) => {
  const competitors = listCompetitorsStmt.all(req.params.id).map(serializeCompany);
  res.json({ competitors });
});

// POST /api/companies/:id/discover-competitors
router.post(
  '/:id/discover-competitors',
  wrap(async (req, res) => {
    const userCompany = getCompanyStmt.get(req.params.id);
    if (!userCompany) return res.status(404).json({ error: 'Company not found.' });

    const { competitors, answerText } = await intel.discoverCompetitors(userCompany);

    const saved = [];
    const tx = db.transaction((items) => {
      for (const item of items) {
        let company = findCompanyByNameStmt.get(item.name);
        if (!company) {
          const info = insertCompanyStmt.run({
            name: item.name,
            domain: item.domain,
            description: item.description,
            is_user_company: 0,
          });
          company = getCompanyStmt.get(info.lastInsertRowid);
        }
        linkStmt.run(userCompany.id, company.id);
        saved.push(company);
      }
    });
    tx(competitors);

    res.json({
      competitors: saved.map(serializeCompany),
      answer_text: answerText,
      ambiguous: saved.length === 0,
    });
  })
);

// POST /api/companies/:id/competitors — manually add a competitor (fallback)
router.post('/:id/competitors', (req, res) => {
  const userCompany = getCompanyStmt.get(req.params.id);
  if (!userCompany) return res.status(404).json({ error: 'Company not found.' });

  const { name, domain, description } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Competitor name is required.' });
  }

  let company = findCompanyByNameStmt.get(String(name).trim());
  if (!company) {
    const info = insertCompanyStmt.run({
      name: String(name).trim(),
      domain: domain ? String(domain).trim() : null,
      description: description ? String(description).trim() : null,
      is_user_company: 0,
    });
    company = getCompanyStmt.get(info.lastInsertRowid);
  }
  linkStmt.run(userCompany.id, company.id);

  res.status(201).json({ competitor: serializeCompany(company) });
});

// POST /api/companies/:id/refresh-feed — :id is a COMPETITOR company id
router.post(
  '/:id/refresh-feed',
  wrap(async (req, res) => {
    const item = await refreshCompetitorFeed(Number(req.params.id));
    res.status(201).json({ item: serializeFeedItem(item) });
  })
);

// GET /api/companies/:id/feed — :id is the USER company id
router.get('/:id/feed', (req, res) => {
  const items = feedForUserCompanyStmt.all(req.params.id).map(serializeFeedItem);
  res.json({ items });
});

module.exports = router;
