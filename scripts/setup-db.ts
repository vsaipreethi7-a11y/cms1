const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const { query } = require('../lib/mysql');

async function setup() {
  console.log('🚀 Setting up Bridge tables...');
  
  try {
    // Activity Log Table
    await query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id VARCHAR(64) PRIMARY KEY,
        action VARCHAR(255) NOT NULL,
        details TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ activity_logs table ready');

    // Bridge Config Table
    await query(`
      CREATE TABLE IF NOT EXISTS bridge_config (
        id INT PRIMARY KEY DEFAULT 1,
        whatsapp_enabled BOOLEAN DEFAULT FALSE,
        telegram_token VARCHAR(255),
        telegram_enabled BOOLEAN DEFAULT FALSE,
        email_user VARCHAR(255),
        email_pass VARCHAR(255),
        email_enabled BOOLEAN DEFAULT FALSE,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT one_row CHECK (id = 1)
      )
    `);
    console.log('✅ bridge_config table ready');

    // Initialize Bridge Config if not exists
    const configs = await query('SELECT id FROM bridge_config WHERE id = 1');
    if (configs.length === 0) {
      await query('INSERT INTO bridge_config (id) VALUES (1)');
      console.log('✅ bridge_config initialized');
    }

    // Bridge Mappings Table
    await query(`
      CREATE TABLE IF NOT EXISTS bridge_mappings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hashtag VARCHAR(64) UNIQUE NOT NULL,
        connection_id VARCHAR(64) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_mapping_connection FOREIGN KEY (connection_id) REFERENCES cms_connections(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ bridge_mappings table ready');

  } catch (err) {
    console.error('❌ Setup failed:', err);
  } finally {
    process.exit();
  }
}

setup();
