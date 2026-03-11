'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  onUpload: (file: File, dataUrl: string) => void;
  accept?: Record<string, string[]>;
  label?: string;
  className?: string;
  multiple?: boolean;
}

export function FileUpload({
  onUpload,
  accept = { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
  label = 'Drop files here or click to upload',
  className = '',
  multiple = false,
}: FileUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          onUpload(file, reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
        isDragActive
          ? 'border-gray-900 bg-gray-50'
          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
      } ${className}`}
    >
      <input {...getInputProps()} />
      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
      <p className="text-sm text-gray-600">{isDragActive ? 'Drop files here...' : label}</p>
      <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP accepted</p>
    </div>
  );
}
