import { Storage } from '@google-cloud/storage';

function base64ToBuffer(dataUrl) {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64, 'base64');
}

function getMimeAndExt(dataUrl) {
  const match = dataUrl.match(/^data:image\/(\w+);base64,/);
  const ext = match ? match[1] : 'png';
  const mime = `image/${ext}`;
  return { mime, ext };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME;
  const keyJson =
    process.env.GOOGLE_CLOUD_KEY_JSON || process.env.GCLOUD_KEY_JSON;

  if (!projectId || !bucketName || !keyJson) {
    const missing = [];
    if (!projectId) missing.push('GOOGLE_CLOUD_PROJECT_ID');
    if (!bucketName) missing.push('GOOGLE_CLOUD_BUCKET_NAME');
    if (!keyJson) missing.push('GOOGLE_CLOUD_KEY_JSON');
    return res.status(500).json({
      error: `Add these in Vercel → Project Settings → Environment Variables: ${missing.join(', ')}. For GOOGLE_CLOUD_KEY_JSON, paste the full xscade-portal-storage-key.json contents.`,
    });
  }

  let credentials;
  try {
    credentials = typeof keyJson === 'string' ? JSON.parse(keyJson) : keyJson;
  } catch {
    return res.status(500).json({ error: 'Invalid GOOGLE_CLOUD_KEY_JSON' });
  }

  const storage = new Storage({
    projectId,
    credentials,
  });
  const bucket = storage.bucket(bucketName);

  try {
    const { image } = req.body || {};
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid image (base64 data URL)' });
    }

    const { mime, ext } = getMimeAndExt(image);
    const buffer = base64ToBuffer(image);
    const fileName = `generated/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const file = bucket.file(fileName);
    await file.save(buffer, { metadata: { contentType: mime } });

    try {
      await file.makePublic();
    } catch (pubErr) {
      console.warn('makePublic failed:', pubErr.message);
    }

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
    return res.status(200).json({ url: publicUrl });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
}
