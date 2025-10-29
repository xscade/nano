
import React from 'react';
import { ImageIcon } from './icons/ImageIcon';

interface OutputGalleryProps {
  generatedImage: string | null;
  isLoading: boolean;
  error: string | null;
}

const Placeholder: React.FC = () => (
    <div className="text-center">
        <div className="mx-auto w-20 h-20 bg-gray-700/50 rounded-full flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-gray-500" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-white">Ready for instant generation</h3>
        <p className="mt-1 text-sm text-gray-400">Enter your prompt and unleash the power</p>
    </div>
);

const LoadingState: React.FC = () => (
    <div className="text-center">
        <div className="animate-pulse flex flex-col items-center">
            <div className="mx-auto w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center">
                 <ImageIcon className="w-10 h-10 text-yellow-500" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">Generating your creation...</h3>
            <p className="mt-1 text-sm text-gray-400">The AI is painting with pixels, please wait.</p>
        </div>
    </div>
);

const ErrorState: React.FC<{ message: string }> = ({ message }) => (
    <div className="text-center text-red-400">
        <h3 className="text-lg font-semibold">Generation Failed</h3>
        <p className="mt-1 text-sm">{message}</p>
    </div>
);

export const OutputGallery: React.FC<OutputGalleryProps> = ({ generatedImage, isLoading, error }) => {
  return (
    <div className="bg-[#1f2430]/50 border border-yellow-600/30 rounded-2xl p-6">
      <h2 className="text-xl font-bold text-white">Output Gallery</h2>
      <p className="text-sm text-gray-400 mb-6">Your ultra-fast AI creations appear here instantly</p>
      
      <div className={`relative flex items-center justify-center w-full h-[480px] rounded-lg bg-[#0b0f19]/50 border-2 border-dashed border-gray-600/50 ${isLoading ? 'animate-pulse' : ''}`}>
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : generatedImage ? (
          <img src={generatedImage} alt="Generated output" className="w-full h-full object-contain rounded-lg" />
        ) : (
          <Placeholder />
        )}
      </div>
    </div>
  );
};
