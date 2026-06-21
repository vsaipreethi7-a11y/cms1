import { Telegraf } from 'telegraf';
import axios from 'axios';
import path from 'path';

export function startTelegram(token: string, processMessage: Function) {
  const bot = new Telegraf(token);

  async function downloadTelegramPhoto(fileId: string) {
    const fileRes = await axios.get(
      `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`
    );
    const filePath = fileRes.data.result.file_path;
    const fileUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;
    const imgRes = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    return {
      buffer: Buffer.from(imgRes.data),
      fileName: path.basename(filePath)
    };
  }


  bot.on('photo', async (ctx) => {
    const photos = ctx.message.photo;
    const best = photos[photos.length - 1];
    const { buffer, fileName } = await downloadTelegramPhoto(best.file_id);

    await processMessage({
      source: 'telegram',
      text: ctx.message.caption || '',
      imageBuffer: buffer,
      fileName,
      ctx
    });
  });

  bot.start((ctx) =>
    ctx.reply('👋 Send a photo with a hashtag caption (e.g. #SiteA) to publish.')
  );

  bot.launch();
  console.log('🤖 Telegram bot is running...');

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));

  return bot;
}
