'use client';

import React from 'react';
import { ChatMessage } from '@/lib/types';

interface ChatBubbleProps {
  message: ChatMessage;
  onOptionSelect?: (value: string) => void;
}

export function ChatBubble({ message, onOptionSelect }: ChatBubbleProps) {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isAssistant
            ? 'bg-white border border-gray-200 text-gray-800'
            : 'bg-gray-900 text-white'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>

        {message.images && message.images.length > 0 && (
          <div className="mt-2 flex gap-2 flex-wrap">
            {message.images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`Uploaded ${i + 1}`}
                className="w-24 h-24 object-cover rounded-lg"
              />
            ))}
          </div>
        )}

        {message.options && message.options.length > 0 && onOptionSelect && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onOptionSelect(opt.value)}
                className="px-3 py-1.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors border border-gray-200"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
