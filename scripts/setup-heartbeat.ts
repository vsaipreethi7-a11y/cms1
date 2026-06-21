const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const { query } = require('../lib/mysql');

async function setupHeartbeat() {
  console.log('💓 Adding heartbeat to bridge_config...');
  
  try {
    await query(\`
      ALTER TABLE bridge_config ADD COLUMN IF NOT EXISTS last_heartbeat DATETIME;
    \`);
    console.log('✅ last_heartbeat column ready');
  } catch (err) {
    console.error('❌ Heartbeat setup failed:', err);
  } finally {
    process.exit();
  }
}

setupHeartbeat();
