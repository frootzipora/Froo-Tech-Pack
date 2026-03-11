'use client';

import React from 'react';
import { StepStatus } from '@/lib/types';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  steps: { label: string; status: StepStatus }[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0 w-full max-w-2xl mx-auto">
      {steps.map((step, i) => {
        const isActive = i + 1 === currentStep;
        const isCompleted = step.status === 'completed';
        const isClickable = isCompleted || isActive;

        return (
          <React.Fragment key={i}>
            {i > 0 && (
              <div
                className={`flex-1 h-0.5 mx-1 ${
                  isCompleted || (i + 1 <= currentStep) ? 'bg-gray-900' : 'bg-gray-200'
                }`}
              />
            )}
            <button
              onClick={() => isClickable && onStepClick?.(i + 1)}
              disabled={!isClickable}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-gray-900 text-white'
                  : isCompleted
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-gray-50 text-gray-400'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isActive
                    ? 'bg-white text-gray-900'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompleted ? <Check className="w-3 h-3" /> : i + 1}
              </span>
              {step.label}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}
