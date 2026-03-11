'use client';

import React from 'react';

interface Option {
  label: string;
  value: string;
}

interface OptionButtonsProps {
  options: Option[];
  onSelect: (value: string) => void;
  selected?: string;
  className?: string;
}

export function OptionButtons({ options, onSelect, selected, className = '' }: OptionButtonsProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
            selected === opt.value
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
