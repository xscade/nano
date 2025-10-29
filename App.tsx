import React, { useState, useEffect } from 'react';
import { PromptEngine } from './components/PromptEngine';
import { OutputGallery } from './components/OutputGallery';
import { ThemeToggle } from './components/ThemeToggle';
import { editImageWithPrompt, generateImageFromText } from './services/geminiService';
import type { ImageFile } from './types';

type GenerationMode = 'image-to-image' | 'text-to-image';
type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('A futuristic city powered by nano technology, golden hour lighting, ultra detailed...');
  const [image, setImage] = useState<ImageFile | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<GenerationMode>('image-to-image');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'light');

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

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