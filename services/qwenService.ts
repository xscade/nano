import { uploadImageToGcs } from './storageService';

const QWEN_LAYERED_URL = 'https://gateway.pixazo.ai/qwen-image-layered/v1/qwen-image-layered-request';

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

  // Pixazo expects a public URL; upload data URLs to GCS
  let imageUrl = imageDataUrl;
  if (imageDataUrl.startsWith('data:')) {
    imageUrl = await uploadImageToGcs(imageDataUrl);
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

  let dataUrl: string;

  if (typeof imageData === 'string') {
    if (imageData.startsWith('data:')) dataUrl = imageData;
    else if (imageData.startsWith('http')) {
      const imgRes = await fetch(imageData);
      const blob = await imgRes.blob();
      dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } else {
      dataUrl = `data:image/${output_format};base64,${imageData}`;
    }
  } else if (imageData?.url) {
    const imgRes = await fetch(imageData.url);
    const blob = await imgRes.blob();
    dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } else if (imageData?.b64_json) {
    dataUrl = `data:image/${output_format};base64,${imageData.b64_json}`;
  } else {
    throw new Error('No image data in Qwen API response');
  }

  // Store result in GCS and return the public URL
  return uploadImageToGcs(dataUrl);
}
