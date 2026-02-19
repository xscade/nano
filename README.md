<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1MxA1VMlNXWCHkHIgdmAys2wpTqo_dnFR

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies: `npm install`
2. Set in [.env.local](.env.local):
   - `GEMINI_API_KEY` – your Gemini API key
   - `PIXAZO_API_KEY` – for Qwen Image Layered (diffuse)
   - `GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_CLOUD_BUCKET_NAME`, `GOOGLE_CLOUD_KEY_FILE` – for local dev (path to key JSON)
3. Run the app (both Vite + upload API):
   `npm run dev:all`
   - Or run separately: `npm run server` (port 3001) and `npm run dev` (port 3000)

Generated images and diffused outputs are stored in your GCS bucket (`xscade-files`). The bucket must allow public read for uploaded objects.

## Vercel deployment

On Vercel, set these environment variables:
- `GEMINI_API_KEY`, `PIXAZO_API_KEY` – as before
- `GOOGLE_CLOUD_PROJECT_ID` – e.g. `xscade`
- `GOOGLE_CLOUD_BUCKET_NAME` – e.g. `xscade-files`
- `GOOGLE_CLOUD_KEY_JSON` – the **entire contents** of `xscade-portal-storage-key.json` as a single string (paste the raw JSON)
