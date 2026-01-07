'use client';

import { ImageUploader } from '@/components/ImageUploader';
import { ConfigPanel } from '@/components/ConfigPanel';
import { useAppStore } from '@/store/useAppStore';

export default function Home() {
  const { uploadedImage } = useAppStore();

  return (
    <div className="flex h-screen bg-background">
      {/* Left Panel - Canvas Area (75%) */}
      <div className="w-[75%] border-r px-6 py-4">
        <div className="h-full flex flex-col">
          <div className="mb-3">
            <img 
              src="/uxpert-logo.svg" 
              alt="UXPERT" 
              className="h-8"
            />
          </div>
          <div className={`flex-1 min-h-0 ${uploadedImage ? 'bg-gray-50' : ''}`}>
            <ImageUploader />
          </div>
        </div>
      </div>

      {/* Right Panel - Control & Result (25%) */}
      <div className="w-[25%] overflow-y-auto">
        <ConfigPanel />
      </div>
    </div>
  );
}
