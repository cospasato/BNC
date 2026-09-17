const { neon } = require('@neondatabase/serverless');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return res.status(400).json({ error: 'TELEGRAM_BOT_TOKEN not set in Vercel env vars' });

  // ── GET: Setup webhook OR debug status ──────────────────────────────────────
  if (req.method === 'GET') {
    const { action } = req.query;

    // Debug: show webhook info + recent videos
    if (action === 'debug') {
      try {
        const sql = neon(process.env.DATABASE_URL);
        const whInfo = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`).then(r=>r.json());
        const botInfo = await fetch(`https://api.telegram.org/bot${token}/getMe`).then(r=>r.json());
        const videos = await sql`SELECT id,url,source,title,created_at FROM videos WHERE source='telegram' ORDER BY created_at DESC LIMIT 5`.catch(()=>[]);
        return res.status(200).json({ bot: botInfo.result, webhook: whInfo.result, recent_telegram_videos: videos });
      } catch(e) { return res.status(200).json({ error: e.message }); }
    }

    // Register webhook
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://massagetz.com';
    const webhookUrl = `${appUrl}/api/telegram`;
    const r = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'channel_post'],
        drop_pending_updates: true
      })
    });
    const d = await r.json();
    return res.status(200).json({ webhook_set: d.ok, result: d.description, webhook_url: webhookUrl });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ── POST: Receive webhook from Telegram ─────────────────────────────────────
  const body = req.body || {};

  // Accept both private messages and channel posts
  const msg = body.channel_post || body.message;
  if (!msg) return res.status(200).json({ ok: true, ignored: 'not a message' });

  // Only process video content
  const fileObj = msg.video || msg.document || msg.video_note || msg.animation;
  const isVideoDoc = msg.document?.mime_type?.startsWith('video/');

  if (!fileObj && !isVideoDoc) {
    return res.status(200).json({ ok: true, ignored: 'no video content', type: Object.keys(msg).join(',') });
  }

  const actualFile = msg.video || (isVideoDoc ? msg.document : null) || msg.video_note || msg.animation;

  try {
    const sql = neon(process.env.DATABASE_URL);

    // Ensure table exists with all columns
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

    const fileId   = actualFile.file_id;
    const fileSize = actualFile.file_size || 0;
    const caption  = msg.caption || '';

    // Build channel post URL (always works regardless of file size)
    const chatUser = msg.chat?.username;
    const msgId    = msg.message_id;
    const postUrl  = chatUser ? `https://t.me/${chatUser}/${msgId}` : null;

    let videoUrl = postUrl; // default: use post link
    let isDirect = false;

    // For files under 20MB, get direct download URL
    if (fileSize < 20 * 1024 * 1024) {
      try {
        const fileRes  = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
        const fileData = await fileRes.json();
        if (fileData.ok && fileData.result?.file_path) {
          videoUrl = `https://api.telegram.org/file/bot${token}/${fileData.result.file_path}`;
          isDirect = true;
        }
      } catch(e) { console.warn('getFile failed:', e.message); }
    }

    if (!videoUrl) {
      return res.status(200).json({ ok: true, warning: 'No URL — video too large and no channel username' });
    }

    // Get thumbnail
    let thumbUrl = null;
    const thumbObj = actualFile.thumb || actualFile.thumbnail;
    if (thumbObj?.file_id) {
      try {
        const tRes  = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${thumbObj.file_id}`);
        const tData = await tRes.json();
        if (tData.ok && tData.result?.file_path) {
          thumbUrl = `https://api.telegram.org/file/bot${token}/${tData.result.file_path}`;
        }
      } catch(e) {}
    }

    // Avoid duplicates
    const check = await sql`SELECT id FROM videos WHERE url=${videoUrl} LIMIT 1`;
    if (check.length > 0) return res.status(200).json({ ok: true, duplicate: true });

    const title = caption
      ? caption.slice(0, 80)
      : `Bodymelody Massage — ${new Date(msg.date * 1000).toLocaleDateString('en-TZ', { day:'numeric', month:'short', year:'numeric' })}`;

    const rows = await sql`
      INSERT INTO videos (url, source, title, thumbnail, published_at)
      VALUES (${videoUrl}, 'telegram', ${title}, ${thumbUrl}, ${new Date(msg.date * 1000).toISOString()})
      RETURNING *`;

    return res.status(200).json({ ok: true, saved: true, id: rows[0]?.id, url: videoUrl, direct: isDirect });

  } catch(e) {
    console.error('Telegram webhook error:', e.message);
    return res.status(200).json({ ok: true, error: e.message });
  }
};
