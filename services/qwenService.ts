const QWEN_LAYERED_URL = 'https://gateway.pixazo.ai/qwen-image-layered/v1/qwen-image-layered-request';

/** Convert base64 data URL to a public URL via 0x0.st (free, no API key) for APIs that require URLs */
async function dataUrlToPublicUrl(dataUrl: string): Promise<string> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const form = new FormData();
  form.append('file', blob, 'image.png');
  const upload = await fetch('https://0x0.st', { method: 'POST', body: form });
  if (!upload.ok) throw new Error('Failed to upload image for diffusion');
  return (await upload.text()).trim();
}

export interface QwenLayeredOptions {
  num_inference_steps?: number;
  guidance_scale?: number;
  num_images?: number;
  enable_safety_checker?: boolean;
  output_format?: 'png' | 'jpeg';
  acceleration?: 'regular' | 'turbo';
}

/**
 * Diffuse an image using the Qwen Image Layered API.
 * @param imageDataUrl - Data URL (e.g. data:image/png;base64,...) or public image URL
 * @param apiKey - Pixazo subscription key
 * @param options - Optional API parameters
 * @returns Data URL of the diffused image
 */
export async function diffuseImage(
  imageDataUrl: string,
  apiKey: string,
  options: QwenLayeredOptions = {}
): Promise<string> {
  const {
    num_inference_steps = 28,
    guidance_scale = 5.0,
    num_images = 1,
    enable_safety_checker = true,
    output_format = 'png',
    acceleration = 'regular',
  } = options;

  // Pixazo expects a public URL; convert data URLs to hosted URL
  let imageUrl = imageDataUrl;
  if (imageDataUrl.startsWith('data:')) {
    imageUrl = await dataUrlToPublicUrl(imageDataUrl);
  }

  const data = {
    image_url: imageUrl,
    num_inference_steps,
    guidance_scale,
    num_images,
    enable_safety_checker,
    output_format,
    acceleration,
  };

  const response = await fetch(QWEN_LAYERED_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Ocp-Apim-Subscription-Key': apiKey,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const text = await response.text();
    let errMsg = `Qwen API error (${response.status})`;
    try {
      const json = JSON.parse(text);
      if (json.error?.message) errMsg = json.error.message;
      else if (json.message) errMsg = json.message;
    } catch {
      if (text) errMsg += `: ${text.slice(0, 200)}`;
    }
    throw new Error(errMsg);
  }

  const result = await response.json();

  // Pixazo may return data in different shapes; handle common structures
  const imageData =
    result.data?.[0]?.url ??
    result.data?.[0]?.b64_json ??
    result.output?.[0] ??
    result.images?.[0] ??
    result.image;

  if (typeof imageData === 'string') {
    if (imageData.startsWith('data:')) return imageData;
    if (imageData.startsWith('http')) {
      const imgRes = await fetch(imageData);
      const blob = await imgRes.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
    return `data:image/${output_format};base64,${imageData}`;
  }

  if (imageData?.url) {
    const imgRes = await fetch(imageData.url);
    const blob = await imgRes.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  if (imageData?.b64_json) {
    return `data:image/${output_format};base64,${imageData.b64_json}`;
  }

  throw new Error('No image data in Qwen API response');
}
