import React, { useCallback, useRef } from 'react';
import type { ImageFile } from '../types';
import { RocketIcon } from './icons/RocketIcon';
import { CameraIcon } from './icons/CameraIcon';
import { TextIcon } from './icons/TextIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ImageIcon } from './icons/ImageIcon';
import { MainPromptIcon } from './icons/MainPromptIcon';
import { CopyIcon } from './icons/CopyIcon';
import { LightningIcon } from './icons/LightningIcon';

type GenerationMode = 'image-to-image' | 'text-to-image';

interface PromptEngineProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  image: ImageFile | null;
  setImage: (image: ImageFile | null) => void;
  onGenerate: () => void;
  isLoading: boolean;
  mode: GenerationMode;
  setMode: (mode: GenerationMode) => void;
}

const ImageUpload: React.FC<{ image: ImageFile | null; onImageChange: (file: File) => void; }> = ({ image, onImageChange }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onImageChange(file);
        }
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const file = event.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            onImageChange(file);
        }
    };
    
    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    }

    return (
        <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-2">
                <ImageIcon />
                Reference Image 0/1
            </h3>
            <div 
                className="relative w-full h-48 border-2 border-dashed border-gray-600 rounded-lg flex flex-col justify-center items-center text-gray-400 cursor-pointer hover:border-yellow-500 transition-colors bg-[#1f2430]/30"
                onClick={handleClick}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                {image ? (
                     <img src={image.dataUrl} alt="Preview" className="w-full h-full object-contain rounded-lg p-1" />
                ) : (
                    <>
                        <div className="text-4xl">+</div>
                        <div className="mt-2 text-sm">Add Image</div>
                        <div className="text-xs text-gray-500">Max 10MB</div>
                    </>
                )}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                />
            </div>
        </div>
    );
};

export const PromptEngine: React.FC<PromptEngineProps> = ({ prompt, setPrompt, image, setImage, onGenerate, isLoading, mode, setMode }) => {
  
  const handleImageChange = useCallback((file: File) => {
    if (file.size > 10 * 1024 * 1024) {
        alert("File size exceeds 10MB limit.");
        return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
        setImage({ file, dataUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  }, [setImage]);

  const copyPrompt = () => {
    navigator.clipboard.writeText(prompt);
  };
    
  return (
    <div className="bg-[#1f2430]/50 border border-yellow-600/30 rounded-2xl p-6 relative flex flex-col h-full">
        <div className="flex-grow">
            <div className="flex items-center gap-4">
                <div className="bg-yellow-500/10 p-2 rounded-lg">
                    <RocketIcon />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Prompt Engine</h2>
                    <p className="text-sm text-gray-400">Transform your image with AI-powered editing</p>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2 p-1 bg-[#0b0f19] rounded-lg">
                <button 
                    onClick={() => setMode('image-to-image')}
                    className={`flex items-center justify-center gap-2 py-2 px-4 rounded-md font-semibold text-sm transition-all ${mode === 'image-to-image' ? 'bg-yellow-500 text-gray-900' : 'text-gray-400 hover:bg-gray-700/50'}`}
                >
                    <CameraIcon /> Image to Image
                </button>
                <button
                     onClick={() => setMode('text-to-image')}
                     className={`flex items-center justify-center gap-2 py-2 px-4 rounded-md font-semibold text-sm transition-all ${mode === 'text-to-image' ? 'bg-yellow-500 text-gray-900' : 'text-gray-400 hover:bg-gray-700/50'}`}
                >
                    <TextIcon /> Text to Image
                </button>
            </div>

            <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-2">
                    <SparklesIcon />
                    AI Model Selection
                </h3>
                <div className="relative">
                    <select className="w-full bg-[#0b0f19] border border-gray-600 rounded-lg py-2 px-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-yellow-500">
                        <option>Nano Banana</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.516 7.548c.436-.446 1.144-.446 1.58 0L10 10.402l2.904-2.854c.436-.446 1.144-.446 1.58 0 .436.446.436 1.164 0 1.61l-3.694 3.63c-.436.446-1.144.446-1.58 0L5.516 9.158c-.436-.446-.436-1.164 0-1.61z"/></svg>
                    </div>
                </div>
                 <p className="text-xs text-gray-500 mt-1">Different models offer unique characteristics and styles</p>
            </div>
            
            {mode === 'image-to-image' && <ImageUpload image={image} onImageChange={handleImageChange} />}

            <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-2">
                    <MainPromptIcon />
                    Main Prompt
                </h3>
                <div className="relative">
                    <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="A futuristic city..."
                        className="w-full h-24 bg-[#0b0f19] border border-gray-600 rounded-lg p-3 text-white resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                    <button onClick={copyPrompt} className="absolute bottom-2 right-2 flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors">
                        <CopyIcon /> Copy
                    </button>
                </div>
            </div>
        </div>
        
        <div className="mt-6">
            <button 
                onClick={onGenerate}
                disabled={isLoading || !prompt || (mode === 'image-to-image' && !image)}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-900 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                    </>
                ) : (
                    <>
                        <LightningIcon />
                        Generate Now
                    </>
                )}
            </button>
        </div>
    </div>
  );
};
