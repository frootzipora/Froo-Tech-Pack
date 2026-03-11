'use client';

import React, { useState, useEffect } from 'react';
import { useTechPackStore } from '@/store/techpack-store';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { Step1Intake } from '@/components/steps/Step1Intake';
import { Step2Visuals } from '@/components/steps/Step2Visuals';
import { Step3Fabric } from '@/components/steps/Step3Fabric';
import { Step4SizeChart } from '@/components/steps/Step4SizeChart';
import { TechPackPreview } from '@/components/tech-pack/TechPackPreview';
import { Dashboard } from '@/components/Dashboard';
import { FileText, RotateCcw, ArrowLeft } from 'lucide-react';

type View = 'dashboard' | 'editor' | 'preview';

export default function Home() {
  const store = useTechPackStore();
  const { data } = store;
  const [view, setView] = useState<View>('dashboard');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    store.loadSavedPacks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleNewTechPack = () => {
    store.reset();
    setShowPreview(false);
    setView('editor');
  };

  const handleOpenTechPack = (id: string) => {
    store.loadTechPack(id);
    setShowPreview(true);
    setView('preview');
  };

  const handleEditTechPack = (id: string) => {
    store.loadTechPack(id);
    setShowPreview(false);
    setView('editor');
  };

  const handleBackToDashboard = () => {
    // Auto-save current state
    if (data.sampleNumber) {
      store.saveCurrent();
    }
    setView('dashboard');
    setShowPreview(false);
  };

  const handleEditStep = (step: number) => {
    store.setStep(step);
    store.setStepStatus(step, 'active');
    setShowPreview(false);
    setView('editor');
  };

  // Handle going back one step
  const handleBackStep = () => {
    const prevStep = data.currentStep - 1;
    if (prevStep >= 1) {
      store.setStep(prevStep);
      store.setStepStatus(prevStep, 'active');
    }
  };

  // Dashboard view
  if (view === 'dashboard') {
    return (
      <Dashboard
        onNewTechPack={handleNewTechPack}
        onOpenTechPack={handleOpenTechPack}
        onEditTechPack={handleEditTechPack}
      />
    );
  }

  // Preview view (from dashboard click)
  if (view === 'preview' || (showPreview && !allComplete)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 no-print">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBackToDashboard}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </button>
              </div>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setView('editor');
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
              >
                Edit Steps
              </button>
            </div>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">
          <TechPackPreview
            onBackToDashboard={handleBackToDashboard}
            onEditStep={handleEditStep}
          />
        </main>
      </div>
    );
  }

  const renderStep = () => {
    if (showPreview || allComplete) {
      return (
        <TechPackPreview
          onBackToDashboard={handleBackToDashboard}
          onEditStep={handleEditStep}
        />
      );
    }

    switch (data.currentStep) {
      case 1:
        return <Step1Intake onBack={handleBackToDashboard} />;
      case 2:
        return <Step2Visuals onBack={handleBackStep} />;
      case 3:
        return <Step3Fabric onBack={handleBackStep} />;
      case 4:
        return <Step4SizeChart onBack={handleBackStep} />;
      default:
        return <Step1Intake onBack={handleBackToDashboard} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 no-print">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToDashboard}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors mr-2"
              >
                <ArrowLeft className="w-4 h-4" /> Dashboard
              </button>
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900">Tech Pack Generator</h1>
                {data.sampleNumber && (
                  <p className="text-xs text-gray-400">
                    {data.sampleNumber} \u2014 {data.brand || 'No brand'} \u2014 {data.category || 'No category'} \u2014 {data.season || 'No season'}
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
          {!showPreview && !allComplete && (
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
        <p className="text-xs text-gray-400">Tech Pack Generator \u2014 Professional garment tech packs</p>
      </footer>
    </div>
  );
}
