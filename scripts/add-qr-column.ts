const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const { query } = require('../lib/mysql');

async function addQRCodeColumn() {
  console.log('🖼️ Attempting to add qr_code column to bridge_config...');
  
  try {
    await query(`ALTER TABLE bridge_config ADD COLUMN qr_code TEXT;`);
    console.log('✅ qr_code column added');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️ Column qr_code already exists, skipping.');
    } else {
      console.error('❌ QR Code column setup failed:', err);
    }
  } finally {
    process.exit();
  }
}

addQRCodeColumn();
