import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  Browsers,
  fetchLatestBaileysVersion,
  downloadContentFromMessage,
  WASocket
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import path from 'path';
import { query } from '../mysql';


export async function startWhatsApp(processMessage: Function) {
  const authPath = path.join(process.cwd(), 'prisma/auth_info_baileys');
  const { state, saveCreds } = await useMultiFileAuthState(authPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock: WASocket = makeWASocket({
    auth: state,
    version,
    printQRInTerminal: true,
    mobile: false,
    browser: Browsers.windows('Chrome'),
    syncFullHistory: false,
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 30000
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    // Save QR to DB for UI
    if (qr) {
      console.log('📡 Generating new QR Code...');
      qrcode.generate(qr, { small: true });
      try {
        await query('UPDATE bridge_config SET qr_code = ? WHERE id = 1', [qr]);
      } catch (e: any) {
        console.error('Failed to save QR to DB:', e.message);
      }
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
      if (statusCode !== DisconnectReason.loggedOut) {
        if (statusCode === 405 || statusCode === 401) {
          console.log('Clearing corrupted session...');
          fs.rmSync(authPath, { recursive: true, force: true });
        }
        setTimeout(() => startWhatsApp(processMessage), 5000);
      }
    } else if (connection === 'open') {
      console.log('WhatsApp connected successfully');
      // Clear QR on success
      try {
        await query('UPDATE bridge_config SET qr_code = NULL WHERE id = 1');
      } catch (e: any) {
        console.error('Failed to clear QR code from DB.');
      }
    }
  });


  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;
      const text = msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption || '';

      let imageBuffer: Buffer | null = null;
      if (msg.message.imageMessage) {
        try {
          const stream = await downloadContentFromMessage(msg.message.imageMessage, 'image');
          let buffer = Buffer.from([]);
          for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
          }
          imageBuffer = buffer;
        } catch (e: any) {
          console.error("Failed to download WA image:", e.message);
        }
      }

      console.log("WA Message:", text);
      processMessage({
        source: 'whatsapp',
        text,
        imageBuffer
      });
    }
  });
}
