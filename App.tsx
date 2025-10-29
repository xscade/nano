import React, { useState } from 'react';
import { PromptEngine } from './components/PromptEngine';
import { OutputGallery } from './components/OutputGallery';
import { editImageWithPrompt, generateImageFromText } from './services/geminiService';
import type { ImageFile } from './types';

type GenerationMode = 'image-to-image' | 'text-to-image';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('A futuristic city powered by nano technology, golden hour lighting, ultra detailed...');
  const [image, setImage] = useState<ImageFile | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<GenerationMode>('image-to-image');

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      let resultImageUrl: string;
      if (mode === 'image-to-image') {
        if (!image || !prompt) {
          setError('Please upload an image and provide a prompt.');
          setIsLoading(false);
          return;
        }
        const base64Data = image.dataUrl.split(',')[1];
        if (!base64Data) {
          throw new Error('Invalid image data URL.');
        }
        resultImageUrl = await editImageWithPrompt(base64Data, image.file.type, prompt);
      } else { // mode === 'text-to-image'
        if (!prompt) {
          setError('Please provide a prompt.');
          setIsLoading(false);
          return;
        }
        resultImageUrl = await generateImageFromText(prompt);
      }
      setGeneratedImage(resultImageUrl);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-300 font-sans p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Image Generation Studio</h1>
        <p className="text-lg sm:text-xl text-gray-400 mt-2">Transform any photo with simple text commands</p>
      </header>
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <PromptEngine
          prompt={prompt}
          setPrompt={setPrompt}
          image={image}
          setImage={setImage}
          onGenerate={handleGenerate}
          isLoading={isLoading}
          mode={mode}
          setMode={setMode}
        />
        <OutputGallery
          generatedImage={generatedImage}
          isLoading={isLoading}
          error={error}
        />
      </main>
    </div>
  );
};

export default App;
