import React from 'react';
import { ImageIcon } from './icons/ImageIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { WandIcon } from './icons/WandIcon';

interface OutputGalleryProps {
  generatedImage: string | null;
  isLoading: boolean;
  error: string | null;
  onFollowUp: () => void;
}

const Placeholder: React.FC = () => (
    <div className="text-center">
        <div className="mx-auto w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-gray-500 dark:text-gray-400" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Ready for instant generation</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Enter your prompt and unleash the power</p>
    </div>
);

const LoadingState: React.FC = () => (
    <div className="text-center">
        <div className="animate-pulse flex flex-col items-center">
            <div className="mx-auto w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                 <ImageIcon className="w-10 h-10 text-gray-600 dark:text-gray-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Generating your creation...</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">The AI is painting with pixels, please wait.</p>
        </div>
    </div>
);

const ErrorState: React.FC<{ message: string }> = ({ message }) => (
    <div className="text-center text-red-500">
        <h3 className="text-lg font-semibold">Generation Failed</h3>
        <p className="mt-1 text-sm">{message}</p>
    </div>
);

export const OutputGallery: React.FC<OutputGalleryProps> = ({ generatedImage, isLoading, error, onFollowUp }) => {
  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    const mimeType = generatedImage.split(';')[0].split(':')[1] || 'image/png';
    const extension = mimeType.split('/')[1] || 'png';
    link.download = `xscade-creative-studio.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Output Gallery</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Your ultra-fast AI creations appear here instantly</p>
      
      <div className={`relative flex items-center justify-center w-full h-[480px] rounded-lg bg-gray-50 dark:bg-gray-700/50 border-2 border-dashed border-gray-200 dark:border-gray-600 ${isLoading ? 'animate-pulse' : ''}`}>
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : generatedImage ? (
          <div className="relative w-full h-full group">
            <img src={generatedImage} alt="Generated output" className="w-full h-full object-contain rounded-lg" />
            <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                onClick={onFollowUp}
                className="bg-black bg-opacity-60 text-white p-2 rounded-full focus:opacity-100"
                aria-label="Use as reference"
                title="Use as reference"
                >
                <WandIcon />
                </button>
                <button
                onClick={handleDownload}
                className="bg-black bg-opacity-60 text-white p-2 rounded-full focus:opacity-100"
                aria-label="Download image"
                title="Download image"
                >
                <DownloadIcon />
                </button>
            </div>
          </div>
        ) : (
          <Placeholder />
        )}
      </div>
    </div>
  );
};