const path = require('path');
const dotenv = require('dotenv');

// Load env from the repo root .env.local first, then fall back to .env
const rootDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(rootDir, '.env.local') });
dotenv.config({ path: path.join(rootDir, '.env') });

const config = {
  port: Number(process.env.PORT) || 3000,
  calaApiKey: process.env.CALA_API_KEY || '',
  calaBaseUrl: process.env.CALA_BASE_URL || 'https://api.cala.ai',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  dbPath: process.env.DB_PATH || path.join(__dirname, 'data', 'competlearn.sqlite'),
};

module.exports = config;
