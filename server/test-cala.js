/*
 * Standalone Cala API smoke test.
 * Makes one real call per endpoint for a known company ("OpenAI") and logs
 * the raw responses so we can confirm the request/response shapes.
 *
 * Run with: npm run test:cala   (from repo root)
 */
const config = require('./config');
const cala = require('./services/calaClient');

function header(title) {
  console.log(`\n${'='.repeat(70)}\n${title}\n${'='.repeat(70)}`);
}

async function main() {
  if (!config.calaApiKey) {
    console.error('✗ CALA_API_KEY is not set. Add it to .env.local before running.');
    process.exit(1);
  }
  console.log(`Using Cala base URL: ${config.calaBaseUrl}`);

  const company = process.argv[2] || 'OpenAI';

  try {
    header(`entitySearch("${company}")`);
    const entities = await cala.entitySearch(company, { entityTypes: ['Company'], limit: 3 });
    console.log(JSON.stringify(entities, null, 2));

    header(`knowledgeSearch — facts about ${company}`);
    const search = await cala.knowledgeSearch(
      `What is the latest funding, growth, and notable recent activity of ${company}?`
    );
    console.log(JSON.stringify(search, null, 2));

    header(`knowledgeQuery — competitors of ${company}`);
    const query = await cala.knowledgeQuery(`companies.competitor_of=${company}`);
    console.log(JSON.stringify(query, null, 2));

    console.log('\n✓ Cala smoke test completed.');
  } catch (err) {
    console.error(`\n✗ Cala call failed: ${err.message}`);
    process.exitCode = 1;
  }
}

main();
