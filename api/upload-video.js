const { neon } = require('@neondatabase/serverless');

// Disable default body parser so we can handle multipart
module.exports.config = { api: { bodyParser: false } };

// Parse multipart form data manually using raw buffer
async function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const body = Buffer.concat(chunks);
      const contentType = req.headers['content-type'] || '';
      const boundaryMatch = contentType.match(/boundary=(.+)$/);
      if (!boundaryMatch) return reject(new Error('No boundary in content-type'));

      const boundary = boundaryMatch[1].trim();
      const boundaryBuf = Buffer.from('--' + boundary);
      const result = { fields: {}, file: null };

      // Split by boundary
      let start = 0;
      const parts = [];
      while (true) {
        const idx = body.indexOf(boundaryBuf, start);
        if (idx === -1) break;
        if (start > 0) parts.push(body.slice(start, idx - 2)); // -2 for \r\n
        start = idx + boundaryBuf.length + 2; // skip \r\n
      }

      for (const part of parts) {
        if (!part.length || part.slice(0,2).toString() === '--') continue;
        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd === -1) continue;
        const headerStr = part.slice(0, headerEnd).toString();
        const content   = part.slice(headerEnd + 4);

        const nameMatch     = headerStr.match(/name="([^"]+)"/);
        const filenameMatch = headerStr.match(/filename="([^"]+)"/);
        const ctMatch       = headerStr.match(/Content-Type:\s*(.+)/i);

        if (!nameMatch) continue;
        const fieldName = nameMatch[1];

        if (filenameMatch) {
          result.file = {
            name:        filenameMatch[1],
            contentType: ctMatch ? ctMatch[1].trim() : 'video/mp4',
            buffer:      content,
          };
        } else {
          result.fields[fieldName] = content.toString().trim();
        }
      }
      resolve(result);
    });
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'POST only' });

  const token   = process.env.TELEGRAM_BOT_TOKEN;
  const channel = process.env.TELEGRAM_CHANNEL_ID;
  if (!token)   return res.status(400).json({ error: 'TELEGRAM_BOT_TOKEN not set' });
  if (!channel) return res.status(400).json({ error: 'TELEGRAM_CHANNEL_ID not set' });

  try {
    const { fields, file } = await parseMultipart(req);

    if (!file || !file.buffer || !file.buffer.length) {
      return res.status(400).json({ error: 'No video file received' });
    }

    const sizeMB = file.buffer.length / (1024 * 1024);
    if (sizeMB > 50) return res.status(400).json({ error: `File too large: ${sizeMB.toFixed(1)}MB. Max 50MB.` });

    const caption  = fields.caption || `Bodymelody Massage — ${new Date().toLocaleDateString('en-TZ',{day:'numeric',month:'short',year:'numeric'})}`;
    const fileName = file.name || fields.fileName || 'video.mp4';
    const mimeType = file.contentType || fields.mimeType || 'video/mp4';

    // Build form for Telegram
    const blob = new Blob([file.buffer], { type: mimeType });
    const form = new FormData();
    form.append('chat_id',             channel);
    form.append('video',               blob, fileName);
    form.append('caption',             caption.slice(0, 1024));
    form.append('supports_streaming',  'true');

    const tgRes  = await fetch(`https://api.telegram.org/bot${token}/sendVideo`, {
      method: 'POST',
      body:   form,
    });
    const tgData = await tgRes.json();

    if (!tgData.ok) {
      return res.status(400).json({ error: tgData.description || 'Telegram upload failed' });
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
        if (tData.ok && tData.result?.file_path) {
          thumbUrl = `https://api.telegram.org/file/bot${token}/${tData.result.file_path}`;
        }
      } catch(e) {}
    }

    // Save to DB
    let savedId = null;
    if (videoUrl) {
      try {
        const sql = neon(process.env.DATABASE_URL);
        await sql`ALTER TABLE videos ADD COLUMN IF NOT EXISTS thumbnail TEXT`.catch(()=>{});
        await sql`ALTER TABLE videos ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ`.catch(()=>{});
        const titleText = caption.slice(0, 80);
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
    console.error('Upload error:', e.message);
    return res.status(500).json({ error: e.message });
  }
};
