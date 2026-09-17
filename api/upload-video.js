const { neon } = require('@neondatabase/serverless');

// Increase body size limit for video uploads (up to 50MB)
module.exports.config = { api: { bodyParser: { sizeLimit: '55mb' } } };

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const token   = process.env.TELEGRAM_BOT_TOKEN;
  const channel = process.env.TELEGRAM_CHANNEL_ID; // e.g. @bodymelodyspa or -100123456789

  if (!token)   return res.status(400).json({ error: 'TELEGRAM_BOT_TOKEN not set' });
  if (!channel) return res.status(400).json({ error: 'TELEGRAM_CHANNEL_ID not set' });

  try {
    const { fileData, fileName, caption, mimeType } = req.body || {};
    if (!fileData) return res.status(400).json({ error: 'No file data received' });

    // Convert base64 to buffer
    const base64 = fileData.includes(',') ? fileData.split(',')[1] : fileData;
    const buffer = Buffer.from(base64, 'base64');
    const mime   = mimeType || 'video/mp4';
    const name   = fileName || 'video.mp4';

    // Check size (Telegram bot API limit is 50MB)
    const sizeMB = buffer.length / (1024 * 1024);
    if (sizeMB > 50) return res.status(400).json({ error: `File too large: ${sizeMB.toFixed(1)}MB. Max 50MB.` });

    // Build multipart form data manually
    const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
    const parts = [];

    // chat_id field
    parts.push(
      `--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${channel}`
    );

    // caption field
    if (caption) {
      parts.push(
        `--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n${caption.slice(0,1024)}`
      );
    }

    // supports_streaming
    parts.push(
      `--${boundary}\r\nContent-Disposition: form-data; name="supports_streaming"\r\n\r\ntrue`
    );

    // video file
    const textParts = parts.join('\r\n') + '\r\n';
    const fileHeader = `--${boundary}\r\nContent-Disposition: form-data; name="video"; filename="${name}"\r\nContent-Type: ${mime}\r\n\r\n`;
    const closing    = `\r\n--${boundary}--\r\n`;

    const body = Buffer.concat([
      Buffer.from(textParts, 'utf8'),
      Buffer.from(fileHeader, 'utf8'),
      buffer,
      Buffer.from(closing, 'utf8'),
    ]);

    // Send to Telegram
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendVideo`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      },
      body,
    });

    const tgData = await tgRes.json();

    if (!tgData.ok) {
      return res.status(400).json({ error: tgData.description || 'Telegram upload failed' });
    }

    // Video posted to channel — webhook will auto-save to DB
    // But also save directly here in case webhook is slow
    const msg      = tgData.result;
    const fileObj  = msg.video || msg.document;
    const chatUser = msg.chat?.username;
    const postUrl  = chatUser ? `https://t.me/${chatUser}/${msg.message_id}` : null;

    // Get direct file URL
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
      } catch(e) {}
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

    // Save to DB directly (don't wait for webhook)
    if (videoUrl) {
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

      const titleText = caption || `Bodymelody Massage — ${new Date().toLocaleDateString('en-TZ',{day:'numeric',month:'short',year:'numeric'})}`;

      // Avoid duplicate (webhook may also save)
      const exists = await sql`SELECT id FROM videos WHERE url=${videoUrl} LIMIT 1`;
      if (!exists.length) {
        await sql`INSERT INTO videos (url, source, title, thumbnail, published_at)
          VALUES (${videoUrl},'telegram',${titleText.slice(0,80)},${thumbUrl},NOW())`;
      }
    }

    return res.status(200).json({
      ok: true,
      message_id: msg.message_id,
      post_url: postUrl,
      video_url: videoUrl,
      direct: isDirect,
      size_mb: sizeMB.toFixed(1),
    });

  } catch(e) {
    console.error('Upload error:', e.message);
    return res.status(500).json({ error: e.message });
  }
};
