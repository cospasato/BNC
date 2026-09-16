const { neon } = require('@neondatabase/serverless');

// ── Telegram Bot Webhook ─────────────────────────────────────────────────────
// Deploy this at /api/telegram
// Set webhook: https://api.telegram.org/bot{TOKEN}/setWebhook?url=https://massagetz.com/api/telegram

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'GET') {
    // Setup endpoint — call this once to register webhook
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return res.status(400).json({ error: 'TELEGRAM_BOT_TOKEN not set in Vercel env vars' });
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://massagetz.com'}/api/telegram`;
    const r = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
    const d = await r.json();
    return res.status(200).json({ webhook_set: d.ok, result: d.description, webhook_url: webhookUrl });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const body = req.body || {};
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return res.status(400).json({ error: 'TELEGRAM_BOT_TOKEN not configured' });

  // Verify it came from Telegram (optional secret check)
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && req.headers['x-telegram-bot-api-secret-token'] !== secret) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const msg = body.message || body.channel_post;
  if (!msg) return res.status(200).json({ ok: true }); // ignore non-message updates

  // Only process messages with video or document (video file)
  const hasVideo    = !!msg.video;
  const hasDocument = msg.document && msg.document.mime_type?.startsWith('video/');
  const hasVideoNote= !!msg.video_note;

  if (!hasVideo && !hasDocument && !hasVideoNote) {
    return res.status(200).json({ ok: true, ignored: 'no video' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    // Ensure videos table exists
    await sql`CREATE TABLE IF NOT EXISTS videos (
      id           TEXT PRIMARY KEY DEFAULT 'VID' || upper(substr(md5(random()::text),1,6)),
      url          TEXT NOT NULL,
      source       TEXT NOT NULL DEFAULT 'telegram',
      title        TEXT NOT NULL DEFAULT '',
      thumbnail    TEXT,
      published_at TIMESTAMPTZ,
      active       BOOLEAN NOT NULL DEFAULT true,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`.catch(()=>{});
    await sql`ALTER TABLE videos ADD COLUMN IF NOT EXISTS thumbnail TEXT`.catch(()=>{});
    await sql`ALTER TABLE videos ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ`.catch(()=>{});

    // Get file info to build URL
    const fileObj = msg.video || msg.document || msg.video_note;
    const fileId  = fileObj.file_id;
    const caption = msg.caption || msg.text || '';

    // Get file path from Telegram
    const fileInfoRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
    const fileInfo    = await fileInfoRes.json();

    if (!fileInfo.ok || !fileInfo.result?.file_path) {
      console.warn('Could not get file path:', fileInfo);
      return res.status(200).json({ ok: true, warning: 'Could not get file path' });
    }

    const filePath = fileInfo.result.file_path;
    const videoUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;

    // Build channel post URL for display
    const chatId   = msg.chat?.id || msg.chat?.username;
    const msgId    = msg.message_id;
    const chatUser = msg.chat?.username;
    const postUrl  = chatUser
      ? `https://t.me/${chatUser}/${msgId}`
      : videoUrl; // fallback to direct file URL

    // Get thumbnail if available
    let thumbUrl = null;
    if (msg.video?.thumb || msg.video?.thumbnail) {
      const thumbId  = (msg.video.thumb || msg.video.thumbnail).file_id;
      const thumbRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${thumbId}`);
      const thumbData= await thumbRes.json();
      if (thumbData.ok && thumbData.result?.file_path) {
        thumbUrl = `https://api.telegram.org/file/bot${token}/${thumbData.result.file_path}`;
      }
    }

    // Check if video already exists (avoid duplicates)
    const existing = await sql`SELECT id FROM videos WHERE url=${videoUrl} OR url=${postUrl} LIMIT 1`;
    if (existing.length > 0) {
      return res.status(200).json({ ok: true, duplicate: true });
    }

    // Save to database
    const title = caption
      ? caption.slice(0, 80)
      : `Massage TZ Video — ${new Date().toLocaleDateString('en-TZ', {day:'numeric',month:'short',year:'numeric'})}`;

    const rows = await sql`
      INSERT INTO videos (url, source, title, thumbnail, published_at)
      VALUES (${videoUrl}, 'telegram', ${title}, ${thumbUrl}, ${new Date(msg.date * 1000).toISOString()})
      RETURNING *`;

    console.log('New Telegram video saved:', rows[0]?.id, title);
    return res.status(200).json({ ok: true, saved: true, id: rows[0]?.id });

  } catch(e) {
    console.error('Telegram webhook error:', e.message);
    return res.status(200).json({ ok: true, error: e.message }); // always 200 to Telegram
  }
};
