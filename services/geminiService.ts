import { GoogleGenAI, Modality } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

export async function editImageWithPrompt(
  images: { base64ImageData: string; mimeType: string }[],
  prompt: string,
  useProModel: boolean = false
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = useProModel ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

  try {
    const imageParts = images.map(image => ({
      inlineData: {
        data: image.base64ImageData,
        mimeType: image.mimeType,
      },
    }));

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          ...imageParts,
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        const imageMimeType = part.inlineData.mimeType || 'image/png';
        return `data:${imageMimeType};base64,${base64ImageBytes}`;
      }
    }

    throw new Error('No image data found in the API response.');

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate image: ${error.message}`);
    }
    throw new Error('An unknown error occurred while generating the image.');
  }
}

export async function generateImageFromText(
  prompt: string,
  aspectRatio: string,
  useProModel: boolean = false
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    if (useProModel) {
        // Use Gemini 3 Pro Image (Nano Banana 2)
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: {
                parts: [{ text: prompt }]
            },
            config: {
                imageConfig: {
                    aspectRatio: aspectRatio as "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
                }
            }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              const base64ImageBytes: string = part.inlineData.data;
              const imageMimeType = part.inlineData.mimeType || 'image/png';
              return `data:${imageMimeType};base64,${base64ImageBytes}`;
            }
        }
         throw new Error('No image data found in the API response.');

    } else {
        // Use Imagen 4
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: aspectRatio as "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
            },
        });
    
        const generatedImage = response.generatedImages?.[0];
        if (generatedImage?.image?.imageBytes) {
          const base64ImageBytes: string = generatedImage.image.imageBytes;
          return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        
        throw new Error('No image data found in the API response.');
    }

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate image: ${error.message}`);
    }
    throw new Error('An unknown error occurred while generating the image.');
  }
}