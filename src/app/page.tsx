'use client';

import React, { useState } from 'react';
import { useTechPackStore } from '@/store/techpack-store';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { Step1Intake } from '@/components/steps/Step1Intake';
import { Step2Visuals } from '@/components/steps/Step2Visuals';
import { Step3Fabric } from '@/components/steps/Step3Fabric';
import { Step4SizeChart } from '@/components/steps/Step4SizeChart';
import { TechPackPreview } from '@/components/tech-pack/TechPackPreview';
import { FileText, RotateCcw } from 'lucide-react';

export default function Home() {
  const store = useTechPackStore();
  const { data } = store;
  const [showPreview, setShowPreview] = useState(false);

  const steps = [
    { label: 'Intake', status: data.stepStatuses[0] },
    { label: 'Visuals', status: data.stepStatuses[1] },
    { label: 'Fabric', status: data.stepStatuses[2] },
    { label: 'Size Chart', status: data.stepStatuses[3] },
  ];

  const allComplete = data.stepStatuses.every((s) => s === 'completed');

  const handleStepClick = (step: number) => {
    store.setStep(step);
    setShowPreview(false);
  };

  const renderStep = () => {
    if (showPreview || allComplete) {
      return <TechPackPreview />;
    }

    switch (data.currentStep) {
      case 1:
        return <Step1Intake />;
      case 2:
        return <Step2Visuals />;
      case 3:
        return <Step3Fabric />;
      case 4:
        return <Step4SizeChart />;
      default:
        return <Step1Intake />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 no-print">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900">Tech Pack Generator</h1>
                {data.sampleNumber && (
                  <p className="text-xs text-gray-400">
                    {data.sampleNumber} — {data.brand || 'No brand'} — {data.category || 'No category'} — {data.season || 'No season'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {data.stepStatuses[0] === 'completed' && (
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    showPreview
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {showPreview ? 'Back to Steps' : 'Preview Tech Pack'}
                </button>
              )}
              <button
                onClick={() => {
                  if (confirm('Start a new tech pack? This will clear all current data.')) {
                    store.reset();
                    setShowPreview(false);
                  }
                }}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                title="New Tech Pack"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Step Indicator */}
          {!showPreview && (
            <StepIndicator
              steps={steps}
              currentStep={data.currentStep}
              onStepClick={handleStepClick}
            />
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-fade-in">
          {renderStep()}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 text-center no-print">
        <p className="text-xs text-gray-400">Tech Pack Generator — Professional garment tech packs</p>
      </footer>
    </div>
  );
}
