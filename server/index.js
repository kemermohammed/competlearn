const express = require('express');
const cors = require('cors');
const config = require('./config');
require('./db'); // initialize schema on startup

const companiesRouter = require('./routes/companies');
const feedRouter = require('./routes/feed');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    ai_mode: config.openaiApiKey ? 'live' : 'mock',
    cala_configured: !!config.calaApiKey,
  });
});

app.use('/api/companies', companiesRouter);
app.use('/api/feed', feedRouter);

// 404 for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Centralized error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.message || 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`✓ competiLearn backend listening on http://localhost:${config.port}`);
  if (config.calaApiKey) {
    console.log('✓ CALA_API_KEY found — Cala integration enabled');
  } else {
    console.log('⚠ No CALA_API_KEY set — add it to .env.local to enable competitor data.');
  }
  if (config.openaiApiKey) {
    console.log('✓ OPENAI_API_KEY found — live AI insights enabled');
  } else {
    console.log(
      '⚠ No OPENAI_API_KEY set — using mock AI insights. Add it to .env.local to enable real analysis.'
    );
  }
});

module.exports = app;
