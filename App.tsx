import React, { useState, useEffect } from 'react';
import { PromptEngine } from './components/PromptEngine';
import { OutputGallery } from './components/OutputGallery';
import { ThemeToggle } from './components/ThemeToggle';
import { editImageWithPrompt, generateImageFromText } from './services/geminiService';
import { diffuseImage } from './services/qwenService';
import type { ImageFile } from './types';

type GenerationMode = 'image-to-image' | 'text-to-image';
type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('A futuristic city powered by nano technology, golden hour lighting, ultra detailed...');
  const [images, setImages] = useState<ImageFile[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<GenerationMode>('image-to-image');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'light');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [useProModel, setUseProModel] = useState<boolean>(false);
  const [isDiffusing, setIsDiffusing] = useState<boolean>(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const parseAspectRatio = (ratio: string): number => {
    const [width, height] = ratio.split(':').map(Number);
    if (!height || !width) return 1;
    return width / height;
  };
  
  async function processImageWithAspectRatio(imageFile: ImageFile, targetAspectRatio: string): Promise<{ base64ImageData: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
  
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }
  
        const TARGET_WIDTH = 1024;
        const numericTargetRatio = parseAspectRatio(targetAspectRatio);
        canvas.width = TARGET_WIDTH;
        canvas.height = Math.round(TARGET_WIDTH / numericTargetRatio);
  
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
  
        const sourceRatio = img.width / img.height;
        let drawWidth, drawHeight;
  
        if (sourceRatio > numericTargetRatio) {
          drawWidth = canvas.width;
          drawHeight = drawWidth / sourceRatio;
        } else {
          drawHeight = canvas.height;
          drawWidth = drawHeight * sourceRatio;
        }
  
        const offsetX = (canvas.width - drawWidth) / 2;
        const offsetY = (canvas.height - drawHeight) / 2;
  
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        const base64ImageData = dataUrl.split(',')[1];
        if (!base64ImageData) {
            reject(new Error('Failed to extract base64 data from canvas.'));
            return;
        }
        resolve({ base64ImageData, mimeType: 'image/jpeg' });
      };
      img.onerror = () => reject(new Error('Failed to load image for processing.'));
      img.src = imageFile.dataUrl;
    });
  }

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      // Check for API Key if using Pro model
      if (useProModel) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const win = window as any;
        
        // Robustly check for aistudio and its methods to avoid undefined errors
        if (win.aistudio && typeof win.aistudio.hasSelectedApiKey === 'function') {
          try {
            const hasKey = await win.aistudio.hasSelectedApiKey();
            if (!hasKey && typeof win.aistudio.openSelectKey === 'function') {
              await win.aistudio.openSelectKey();
            }
          } catch (keyError) {
            console.warn("Failed to check/request API key:", keyError);
            // Do not throw here, try to proceed with default env key
          }
        } else {
           console.log("window.aistudio not available; attempting generation with default environment key.");
        }
      }

      let resultImageUrl: string;
      
      if (mode === 'image-to-image') {
        if (images.length === 0 || !prompt) {
          setError('Please upload at least one image and provide a prompt.');
          setIsLoading(false);
          return;
        }
        
        const fullPrompt = `Please generate a new image with a strict aspect ratio of ${aspectRatio}. The content of the image should be based on the following instructions: ${prompt}`;
        const processedImageData = await Promise.all(
          images.map(img => processImageWithAspectRatio(img, aspectRatio))
        );
        
        resultImageUrl = await editImageWithPrompt(processedImageData, fullPrompt, useProModel);
      } else { // mode === 'text-to-image'
        if (!prompt) {
          setError('Please provide a prompt.');
          setIsLoading(false);
          return;
        }
        resultImageUrl = await generateImageFromText(prompt, aspectRatio, useProModel);
      }
      setGeneratedImage(resultImageUrl);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      
      // Provide a more helpful message for 403 errors
      if (errorMessage.includes('403') || errorMessage.includes('PERMISSION_DENIED') || errorMessage.includes('permission')) {
        setError('Permission denied. The Pro model requires a paid API key. Please check your access or try the Fast model.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiffuse = async () => {
    if (!generatedImage) return;
    const apiKey = process.env.PIXAZO_API_KEY;
    if (!apiKey) {
      setError('Pixazo API key not configured. Add PIXAZO_API_KEY to .env.local');
      return;
    }
    setIsDiffusing(true);
    setError(null);
    try {
      const diffused = await diffuseImage(generatedImage, apiKey);
      setGeneratedImage(diffused);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Diffusion failed');
    } finally {
      setIsDiffusing(false);
    }
  };

  const handleFollowUp = async () => {
    if (!generatedImage) return;

    try {
        const response = await fetch(generatedImage);
        const blob = await response.blob();
        const file = new File([blob], `follow-up-${Date.now()}.png`, { type: blob.type });

        const newImageFile: ImageFile = {
            file,
            dataUrl: generatedImage
        };
        
        // Add the new image, ensuring we don't exceed the 5 image limit
        setImages(prevImages => [...prevImages, newImageFile].slice(-5));
        setMode('image-to-image');
        setGeneratedImage(null); // Clear the output gallery to start the new cycle
        setError(null);
        
        // Optional: Scroll to the top to see the new reference image
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
        console.error("Failed to process follow-up image:", err);
        setError("Could not use the generated image as a reference. Please try downloading and re-uploading it.");
    }
  };


  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      <header className="text-center mb-8 relative">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">Xscade Creative Studio</h1>
        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mt-2">Transform any photo with simple text commands</p>
        <div className="absolute top-0 right-0">
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>
      </header>
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <PromptEngine
          prompt={prompt}
          setPrompt={setPrompt}
          images={images}
          setImages={setImages}
          onGenerate={handleGenerate}
          isLoading={isLoading}
          mode={mode}
          setMode={setMode}
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
          useProModel={useProModel}
          setUseProModel={setUseProModel}
        />
        <OutputGallery
          generatedImage={generatedImage}
          isLoading={isLoading}
          error={error}
          onFollowUp={handleFollowUp}
          onDiffuse={handleDiffuse}
          isDiffusing={isDiffusing}
        />
      </main>
    </div>
  );
};

export default App;