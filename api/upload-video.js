const { neon }     = require('@neondatabase/serverless');
const formidable   = require('formidable');
const fs           = require('fs');

// Disable Vercel's body parser — formidable handles the stream directly
module.exports.config = { api: { bodyParser: false } };

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'POST only' });

  const token   = process.env.TELEGRAM_BOT_TOKEN;
  const channel = process.env.TELEGRAM_CHANNEL_ID;
  if (!token)   return res.status(400).json({ error: 'TELEGRAM_BOT_TOKEN not set in Vercel env vars' });
  if (!channel) return res.status(400).json({ error: 'TELEGRAM_CHANNEL_ID not set in Vercel env vars' });

  // Parse multipart using formidable
  const form = formidable({ maxFileSize: 52 * 1024 * 1024, keepExtensions: true });

  let fields, files;
  try {
    [fields, files] = await form.parse(req);
  } catch(e) {
    return res.status(400).json({ error: 'Failed to parse upload: ' + e.message });
  }

  const videoFile = files.video?.[0] || files.video;
  if (!videoFile) return res.status(400).json({ error: 'No video file in request' });

  const filePath  = videoFile.filepath;
  const fileName  = (fields.fileName?.[0] || fields.fileName || videoFile.originalFilename || 'video.mp4');
  const mimeType  = (fields.mimeType?.[0] || fields.mimeType || videoFile.mimetype || 'video/mp4');
  const caption   = (fields.caption?.[0]  || fields.caption  || `Bodymelody Massage — ${new Date().toLocaleDateString('en-TZ',{day:'numeric',month:'short',year:'numeric'})}`).slice(0,1024);

  try {
    const fileBuffer = fs.readFileSync(filePath);
    const sizeMB     = fileBuffer.length / (1024 * 1024);

    if (sizeMB > 50) return res.status(400).json({ error: `File too large: ${sizeMB.toFixed(1)}MB. Max 50MB.` });

    // Build multipart body for Telegram
    const boundary = 'TGBound' + Date.now();
    const CRLF     = '\r\n';

    const field = (name, value) =>
      Buffer.from(`--${boundary}${CRLF}Content-Disposition: form-data; name="${name}"${CRLF}${CRLF}${value}${CRLF}`, 'utf8');

    const filePart = Buffer.concat([
      Buffer.from(`--${boundary}${CRLF}Content-Disposition: form-data; name="video"; filename="${fileName}"${CRLF}Content-Type: ${mimeType}${CRLF}${CRLF}`, 'utf8'),
      fileBuffer,
      Buffer.from(CRLF, 'utf8'),
    ]);

    const body = Buffer.concat([
      field('chat_id', channel),
      field('caption', caption),
      field('supports_streaming', 'true'),
      filePart,
      Buffer.from(`--${boundary}--${CRLF}`, 'utf8'),
    ]);

    // Upload to Telegram
    const tgRes  = await fetch(`https://api.telegram.org/bot${token}/sendVideo`, {
      method:  'POST',
      headers: {
        'Content-Type':   `multipart/form-data; boundary=${boundary}`,
        'Content-Length': String(body.length),
      },
      body,
    });

    const tgData = await tgRes.json();

    // Clean up temp file
    try { fs.unlinkSync(filePath); } catch(e) {}

    if (!tgData.ok) {
      return res.status(400).json({ error: tgData.description || 'Telegram upload failed', code: tgData.error_code });
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
      } catch(e) {}
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
        const titleText = caption.slice(0,80);
        const exists = await sql`SELECT id FROM videos WHERE url=${videoUrl} LIMIT 1`;
        if (!exists.length) {
          const rows = await sql`INSERT INTO videos (url,source,title,thumbnail,published_at)
            VALUES (${videoUrl},'telegram',${titleText},${thumbUrl},NOW()) RETURNING id`;
          savedId = rows[0]?.id;
        } else { savedId = exists[0]?.id; }
      } catch(dbErr) { console.error('DB error:', dbErr.message); }
    }

    return res.status(200).json({
      ok: true, message_id: msg.message_id,
      post_url: postUrl, video_url: videoUrl,
      direct: isDirect, size_mb: sizeMB.toFixed(1), saved_id: savedId,
    });

  } catch(e) {
    try { fs.unlinkSync(filePath); } catch(_) {}
    console.error('Upload error:', e.message);
    return res.status(500).json({ error: e.message });
  }
};
