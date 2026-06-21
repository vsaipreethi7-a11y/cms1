import { query } from '../mysql';
import axios from 'axios';
import { randomUUID } from 'crypto';

interface ProcessMessageArgs {
  source: 'whatsapp' | 'telegram' | 'email';
  text: string;
  imageBuffer?: Buffer | null;
  fileName?: string;
  ctx?: any; // For Telegram reply
}

export async function processMessage({ source, text, imageBuffer, fileName = 'image.jpg', ctx = null }: ProcessMessageArgs) {
  try {
    const match = text.match(/#(\w+)/);
    if (!match) {
      const reply = '❌ No hashtag found. Include a hashtag like #SiteA in your message.';
      if (ctx && ctx.reply) await ctx.reply(reply);
      console.log(`[${source}] No hashtag found in: ${text}`);
      return;
    }
    const hashtag = match[1];

    // 1. Find mapping
    const [mapping] = await query<any[]>('SELECT connection_id FROM bridge_mappings WHERE hashtag = ?', [hashtag]);
    if (!mapping) {
      const reply = `❌ Hashtag #${hashtag} is not mapped to any CMS connection.`;
      if (ctx && ctx.reply) await ctx.reply(reply);
      console.log(`[${source}] Unmapped hashtag: ${hashtag}`);
      return;
    }

    // 2. Get connection details
    const [connection] = await query<any[]>('SELECT * FROM cms_connections WHERE id = ?', [mapping.connection_id]);
    if (!connection) {
       console.log(`[${source}] Connection for hashtag #${hashtag} not found: ${mapping.connection_id}`);
       return;
    }

    if (ctx && ctx.reply) await ctx.reply(`⏳ Processing for ${connection.name}...`);

    // 3. Log Activity
    const logId = randomUUID();
    await query('INSERT INTO activity_logs (id, action, details) VALUES (?, ?, ?)', [
      logId,
      'Bridge Message Received',
      `Source: ${source}, Hashtag: #${hashtag}, Target: ${connection.name}`
    ]);

    // 4. Create local content item
    const contentId = randomUUID();
    await query(
      `INSERT INTO cms_content_items (id, cms_id, title, body, author, status, date, tags, word_count) VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        contentId,
        connection.id,
        text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        text,
        `Bridge (${source})`,
        'draft',
        new Date(),
        JSON.stringify([hashtag, source]),
        text.split(/\s+/).filter(Boolean).length
      ]
    );

    // 5. Push to remote CMS (WordPress example)
    if (connection.type === 'wordpress') {
      await pushToWordPress(connection, text, imageBuffer, fileName);
    } else {
      console.log(`[${source}] Pushing to ${connection.type} not yet implemented via Bridge.`);
    }


    if (ctx && ctx.reply) await ctx.reply(`✅ Successfully processed and posted to ${connection.name}`);

  } catch (err: any) {
    console.error(`[${source}] Process error:`, err.message);
    if (ctx && ctx.reply) await ctx.reply('❌ Upload failed. Check server logs.');
  }
}

async function pushToWordPress(connection: any, text: string, imageBuffer: Buffer | null | undefined, fileName: string) {
  const [username, appPassword] = connection.api_key.includes(':') 
    ? connection.api_key.split(':') 
    : ['admin', connection.api_key];

  const authHeader = 'Basic ' + Buffer.from(`${username}:${appPassword}`).toString('base64');
  const base = connection.url.replace(/\/$/, '');
  
  let mediaId = null;
  let postContent = text;

  if (imageBuffer) {
    try {
      const mediaRes = await axios.post(`${base}/wp-json/wp/v2/media`, imageBuffer, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'image/jpeg',
          'Content-Disposition': `attachment; filename="${fileName}"`
        }
      });
      mediaId = mediaRes.data.id;
      postContent = `<img src="${mediaRes.data.source_url}" alt="Bridge Image" />\n\n${text}`;
    } catch (e: any) {
      console.error("[WP MEDIA ERROR]", e.response?.data || e.message);
    }
  }

  await axios.post(`${base}/wp-json/wp/v2/posts`, {
    title: text.substring(0, 50),
    content: postContent,
    status: 'publish'
  }, {
    headers: { 'Authorization': authHeader }
  });

}
