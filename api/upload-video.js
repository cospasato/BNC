const { neon } = require('@neondatabase/serverless');

module.exports.config = { api: { bodyParser: { sizeLimit: '55mb' } } };

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const token   = process.env.TELEGRAM_BOT_TOKEN;
  const channel = process.env.TELEGRAM_CHANNEL_ID;

  if (!token)   return res.status(400).json({ error: 'TELEGRAM_BOT_TOKEN not set in Vercel env vars' });
  if (!channel) return res.status(400).json({ error: 'TELEGRAM_CHANNEL_ID not set in Vercel env vars' });

  try {
    const { fileData, fileName, caption, mimeType } = req.body || {};
    if (!fileData) return res.status(400).json({ error: 'No file data received' });

    // Convert base64 to Buffer
    const base64  = fileData.includes(',') ? fileData.split(',')[1] : fileData;
    const buffer  = Buffer.from(base64, 'base64');
    const mime    = mimeType || 'video/mp4';
    const name    = fileName || 'video.mp4';
    const sizeMB  = buffer.length / (1024 * 1024);

    if (sizeMB > 50) return res.status(400).json({ error: `File too large: ${sizeMB.toFixed(1)}MB. Max 50MB.` });

    // Use Blob + FormData — clean and reliable
    const blob = new Blob([buffer], { type: mime });
    const form = new FormData();
    form.append('chat_id', channel);
    form.append('video',   blob, name);
    form.append('supports_streaming', 'true');
    if (caption && caption.trim()) form.append('caption', caption.trim().slice(0, 1024));

    const tgRes  = await fetch(`https://api.telegram.org/bot${token}/sendVideo`, {
      method: 'POST',
      body:   form,
    });
    const tgData = await tgRes.json();

    if (!tgData.ok) {
      return res.status(400).json({ error: tgData.description || 'Telegram upload failed', tg: tgData });
    }

    const msg      = tgData.result;
    const fileObj  = msg.video || msg.document;
    const chatUser = msg.chat?.username;
    const postUrl  = chatUser ? `https://t.me/${chatUser}/${msg.message_id}` : null;

    // Get direct file URL for playback
    let videoUrl = postUrl;
    let isDirect = false;
    if (fileObj?.file_id) {
      try {
        const fRes  = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileObj.file_id}`);
        const fData = await fRes.json();
        if (fData.ok && fData.result?.file_path) {
          videoUrl = `https://api.telegram.org/file/bot${token}/${fData.result.file_path}`;
          isDirect = true;
        }
      } catch(e) { console.warn('getFile failed:', e.message); }
    }

    // Get thumbnail
    let thumbUrl = null;
    const thumbObj = fileObj?.thumb || fileObj?.thumbnail;
    if (thumbObj?.file_id) {
      try {
        const tRes  = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${thumbObj.file_id}`);
        const tData = await tRes.json();
        if (tData.ok && tData.result?.file_path) {
          thumbUrl = `https://api.telegram.org/file/bot${token}/${tData.result.file_path}`;
        }
      } catch(e) {}
    }

    // Save to DB
    if (videoUrl) {
      try {
        const sql = neon(process.env.DATABASE_URL);
        await sql`CREATE TABLE IF NOT EXISTS videos (
          id TEXT PRIMARY KEY DEFAULT 'VID'||upper(substr(md5(random()::text),1,6)),
          url TEXT NOT NULL, source TEXT NOT NULL DEFAULT 'telegram',
          title TEXT NOT NULL DEFAULT '', thumbnail TEXT,
          published_at TIMESTAMPTZ, active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`.catch(()=>{});
        await sql`ALTER TABLE videos ADD COLUMN IF NOT EXISTS thumbnail TEXT`.catch(()=>{});
        await sql`ALTER TABLE videos ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ`.catch(()=>{});

        const titleText = (caption || `Bodymelody Massage — ${new Date().toLocaleDateString('en-TZ',{day:'numeric',month:'short',year:'numeric'})}`).slice(0,80);
        const exists = await sql`SELECT id FROM videos WHERE url=${videoUrl} LIMIT 1`;
        let saved = null;
        if (!exists.length) {
          const rows = await sql`INSERT INTO videos (url, source, title, thumbnail, published_at)
            VALUES (${videoUrl},'telegram',${titleText},${thumbUrl},NOW()) RETURNING *`;
          saved = rows[0];
        } else {
          saved = exists[0];
        }

        return res.status(200).json({
          ok: true, message_id: msg.message_id,
          post_url: postUrl, video_url: videoUrl,
          direct: isDirect, size_mb: sizeMB.toFixed(1),
          saved_id: saved?.id,
        });
      } catch(dbErr) {
        // Still return success even if DB save fails — webhook will catch it
        console.error('DB save error:', dbErr.message);
        return res.status(200).json({ ok: true, message_id: msg.message_id, post_url: postUrl, video_url: videoUrl, db_error: dbErr.message });
      }
    }

    return res.status(200).json({ ok: true, message_id: msg.message_id, post_url: postUrl });

  } catch(e) {
    console.error('Upload error:', e.message, e.stack);
    return res.status(500).json({ error: e.message });
  }
};
