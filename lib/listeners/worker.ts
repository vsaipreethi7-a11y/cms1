import { query } from '../mysql';

import { processMessage } from './processor';
import { startWhatsApp } from './whatsapp';
import { startTelegram } from './telegram';
import { startEmailListener } from './email';

let activeChannels = {
  whatsapp: false,
  telegram: false,
  email: false
};

async function checkAndStart() {
  try {
    const [config] = await query<any[]>('SELECT * FROM bridge_config WHERE id = 1');
    if (!config) return;

    if (config.whatsapp_enabled && !activeChannels.whatsapp) {
      console.log('✅ Starting WhatsApp bridge...');
      startWhatsApp(processMessage);
      activeChannels.whatsapp = true;
    }

    if (config.telegram_enabled && config.telegram_token && !activeChannels.telegram) {
      console.log('✅ Starting Telegram bridge...');
      startTelegram(config.telegram_token, processMessage);
      activeChannels.telegram = true;
    }

    if (config.email_enabled && config.email_user && config.email_pass && !activeChannels.email) {
      console.log('✅ Starting Email bridge...');
      startEmailListener({
        user: config.email_user,
        pass: config.email_pass
      }, processMessage);
      activeChannels.email = true;
    }

  } catch (err: any) {
    console.error('❌ Check error:', err.message);
  }
}

async function main() {
  console.log('👷 Bridge Worker starting...');
  await checkAndStart();
  console.log('🚀 Bridge Worker is active.');

  // Check for new config every 10s
  setInterval(checkAndStart, 10000);

  // Update heartbeat every minute
  setInterval(async () => {
    try {
      await query('UPDATE bridge_config SET last_heartbeat = NOW() WHERE id = 1');
    } catch (e: any) {
      console.error('Failed to update heartbeat:', e.message);
    }
  }, 60000);
}

main();

