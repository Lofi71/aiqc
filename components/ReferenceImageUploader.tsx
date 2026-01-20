'use client';

import { useState, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ReferenceImageType } from '@/types';
import { X, Plus, Image as ImageIcon } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const MAX_REF_IMAGES = 5;

const REFERENCE_TYPES: { value: ReferenceImageType; label: string }[] = [
    { value: 'parent_page', label: '상위/이전 페이지' },
    { value: 'child_page', label: '하위/다음 페이지' },
    { value: 'error_state', label: '에러/예외 케이스' },
    { value: 'empty_state', label: '데이터 없음(Empty)' },
    { value: 'style_guide', label: '스타일 가이드' },
];

export default function ReferenceImageUploader() {
    const { referenceImages, addReferenceImage, removeReferenceImage, updateReferenceImageType, isAnalyzing } = useAppStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            processFiles(Array.from(files));
        }
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const processFiles = (files: File[]) => {
        const remainingSlots = MAX_REF_IMAGES - referenceImages.length;
        const filesToProcess = files.slice(0, remainingSlots);

        filesToProcess.forEach((file) => {
            if (!file.type.startsWith('image/')) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target?.result as string;
                addReferenceImage({
                    id: Math.random().toString(36).substring(7),
                    base64,
                    fileName: file.name,
                    type: 'parent_page', // Default type
                });
            };
            reader.readAsDataURL(file);
        });
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    if (referenceImages.length === 0) {
        return (
            <div className="mt-4">
                <label className="text-xs font-semibold text-gray-500 mb-2 block">
                    참고 이미지 (선택, 최대 5장)
                </label>
                <div
                    onClick={handleClick}
                    className="border border-dashed border-gray-300 bg-gray-50/50 rounded-lg p-4 flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-100/50 transition-colors h-20"
                >
                    <Plus className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-500">맥락 분석을 위한 참고 이미지 추가</span>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        multiple
                        className="hidden"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-gray-500">
                    참고 이미지 ({referenceImages.length}/{MAX_REF_IMAGES})
                </label>
                {(referenceImages.length < MAX_REF_IMAGES && !isAnalyzing) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClick}
                        disabled={isAnalyzing}
                        className="h-6 text-xs text-blue-500 hover:text-blue-600 px-2 hover:bg-blue-50"
                    >
                        <Plus className="w-3 h-3 mr-1" />
                        추가
                    </Button>
                )}
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {referenceImages.map((img) => (
                    <div key={img.id} className="flex-shrink-0 w-48 group">
                        <div className="relative h-24 mb-1 rounded-md overflow-hidden bg-white border border-gray-200">
                            <img
                                src={img.base64}
                                alt={img.fileName}
                                className="w-full h-full object-contain"
                            />
                            <button
                                onClick={() => removeReferenceImage(img.id)}
                                disabled={isAnalyzing}
                                className="absolute top-1 right-1 p-0.5 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 disabled:opacity-0"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>

                        <Select
                            value={img.type}
                            onValueChange={(value) => updateReferenceImageType(img.id, value as ReferenceImageType)}
                            disabled={isAnalyzing}
                        >
                            <SelectTrigger className="h-7 text-xs bg-white border-gray-300 text-gray-900 focus:ring-1 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {REFERENCE_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value} className="text-xs">
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                ))}

                {/* Add Button as a card if less than max */}
                {referenceImages.length < MAX_REF_IMAGES && (
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        multiple
                        className="hidden"
                    />
                )}
            </div>
        </div>
    );
}
