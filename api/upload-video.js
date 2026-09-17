const { neon } = require('@neondatabase/serverless');

// Keep default bodyParser but increase size limit for base64 video
module.exports.config = { api: { bodyParser: { sizeLimit: '55mb' } } };

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const token   = process.env.TELEGRAM_BOT_TOKEN;
  const channel = process.env.TELEGRAM_CHANNEL_ID;
  if (!token)   return res.status(400).json({ error: 'TELEGRAM_BOT_TOKEN not set' });
  if (!channel) return res.status(400).json({ error: 'TELEGRAM_CHANNEL_ID not set' });

  try {
    const { fileData, fileName, caption, mimeType } = req.body || {};
    if (!fileData) return res.status(400).json({ error: 'No file data received' });

    // Strip data URL prefix if present
    const base64 = fileData.includes(',') ? fileData.split(',')[1] : fileData;
    const buffer = Buffer.from(base64, 'base64');
    const sizeMB = buffer.length / (1024 * 1024);

    if (sizeMB > 50) return res.status(400).json({ error: `File too large: ${sizeMB.toFixed(1)}MB. Max 50MB.` });

    const mime    = mimeType || 'video/mp4';
    const name    = fileName || 'video.mp4';
    const captionText = (caption || `Bodymelody Massage — ${new Date().toLocaleDateString('en-TZ',{day:'numeric',month:'short',year:'numeric'})}`).slice(0,1024);

    // Build multipart body manually — reliable way with Buffer
    const boundary = 'TGBoundary' + Date.now();
    const CRLF = '\r\n';

    const addField = (name, value) =>
      `--${boundary}${CRLF}Content-Disposition: form-data; name="${name}"${CRLF}${CRLF}${value}${CRLF}`;

    const textPart = [
      addField('chat_id', channel),
      addField('caption', captionText),
      addField('supports_streaming', 'true'),
    ].join('');

    const fileHeader =
      `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="video"; filename="${name}"${CRLF}` +
      `Content-Type: ${mime}${CRLF}${CRLF}`;

    const closing = `${CRLF}--${boundary}--${CRLF}`;

    const bodyBuf = Buffer.concat([
      Buffer.from(textPart, 'latin1'),
      Buffer.from(fileHeader, 'latin1'),
      buffer,
      Buffer.from(closing, 'latin1'),
    ]);

    const tgRes  = await fetch(`https://api.telegram.org/bot${token}/sendVideo`, {
      method:  'POST',
      headers: {
        'Content-Type':   `multipart/form-data; boundary=${boundary}`,
        'Content-Length': String(bodyBuf.length),
      },
      body: bodyBuf,
    });

    const tgData = await tgRes.json();
    if (!tgData.ok) {
      return res.status(400).json({ error: tgData.description || 'Telegram upload failed', details: tgData });
    }

    const msg      = tgData.result;
    const fileObj  = msg.video || msg.document;
    const chatUser = msg.chat?.username;
    const postUrl  = chatUser ? `https://t.me/${chatUser}/${msg.message_id}` : null;

    // Get direct playback URL
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
        if (tData.ok && tData.result?.file_path)
          thumbUrl = `https://api.telegram.org/file/bot${token}/${tData.result.file_path}`;
      } catch(e) {}
    }

    // Save to DB
    let savedId = null;
    if (videoUrl) {
      try {
        const sql = neon(process.env.DATABASE_URL);
        await sql`ALTER TABLE videos ADD COLUMN IF NOT EXISTS thumbnail TEXT`.catch(()=>{});
        await sql`ALTER TABLE videos ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ`.catch(()=>{});
        const titleText = captionText.slice(0,80);
        const exists = await sql`SELECT id FROM videos WHERE url=${videoUrl} LIMIT 1`;
        if (!exists.length) {
          const rows = await sql`INSERT INTO videos (url,source,title,thumbnail,published_at)
            VALUES (${videoUrl},'telegram',${titleText},${thumbUrl},NOW()) RETURNING id`;
          savedId = rows[0]?.id;
        } else {
          savedId = exists[0]?.id;
        }
      } catch(dbErr) { console.error('DB error:', dbErr.message); }
    }

    return res.status(200).json({
      ok: true, message_id: msg.message_id,
      post_url: postUrl, video_url: videoUrl,
      direct: isDirect, size_mb: sizeMB.toFixed(1), saved_id: savedId,
    });

  } catch(e) {
    console.error('Upload error:', e.message);
    return res.status(500).json({ error: e.message });
  }
};
