const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const { query } = require('../lib/mysql');

async function fixSchema() {
  console.log('👷 Fixing bridge_config schema...');
  
  try {
    // Add columns one by one
    try {
      await query(`ALTER TABLE bridge_config ADD COLUMN last_heartbeat DATETIME;`);
      console.log('✅ last_heartbeat added');
    } catch (e) { console.log('ℹ️ last_heartbeat exists or error:', e.message); }
    
    try {
      await query(`ALTER TABLE bridge_config ADD COLUMN qr_code TEXT;`);
      console.log('✅ qr_code added');
    } catch (e) { console.log('ℹ️ qr_code exists or error:', e.message); }

    console.log('🏁 Schema fix complete');
  } catch (err) {
    console.error('❌ Schema fix failed:', err);
  } finally {
    process.exit();
  }
}

fixSchema();
