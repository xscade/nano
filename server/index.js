import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { Storage } from '@google-cloud/storage';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME;
const keyFilePath = process.env.GOOGLE_CLOUD_KEY_FILE;

if (!projectId || !bucketName || !keyFilePath) {
  console.error('Missing GOOGLE_CLOUD_PROJECT_ID, GOOGLE_CLOUD_BUCKET_NAME, or GOOGLE_CLOUD_KEY_FILE');
  process.exit(1);
}

const storage = new Storage({
  projectId,
  keyFilename: path.resolve(process.cwd(), keyFilePath),
});
const bucket = storage.bucket(bucketName);

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

app.post('/api/upload', async (req, res) => {
  try {
    const { image } = req.body;
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
      console.warn('makePublic failed (bucket may restrict public access):', pubErr.message);
    }

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
    res.json({ url: publicUrl });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Upload API running on port ${PORT}`);
});
