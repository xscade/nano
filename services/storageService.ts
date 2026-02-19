const UPLOAD_API = import.meta.env.VITE_UPLOAD_API_URL || '';

/**
 * Upload an image to Google Cloud Storage via our upload API.
 * Returns the public URL of the stored image.
 */
export async function uploadImageToGcs(imageDataUrl: string): Promise<string> {
  const url = UPLOAD_API ? `${UPLOAD_API.replace(/\/$/, '')}/api/upload` : '/api/upload';

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageDataUrl }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Upload failed (${res.status})`);
  }

  const data = await res.json();
  return data.url;
}
