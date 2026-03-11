'use client';

import React, { useState } from 'react';
import { useTechPackStore } from '@/store/techpack-store';
import { Button } from '@/components/ui/Button';
import { FileUpload } from '@/components/ui/FileUpload';
import { ArrowRight, ArrowLeft, Factory, CheckCircle2, Upload, AlertCircle } from 'lucide-react';
import { KEY_TRIMS } from '@/lib/types';

type FabricPhase = 'start' | 'base-fabric' | 'lining' | 'trims' | 'done';
type SourceMode = 'upload' | 'ai-source' | 'factory-source' | null;

export function Step3Fabric({ onBack }: { onBack?: () => void }) {
  const store = useTechPackStore();
  const { data } = store;

  const [phase, setPhase] = useState<FabricPhase>('start');
  const [sourceMode, setSourceMode] = useState<SourceMode>(null);
  const [factoryNote, setFactoryNote] = useState('');
  const [currentTrimIdx, setCurrentTrimIdx] = useState(0);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);

  // Filter trims to only key trims (buttons, lace, contrast fabric, etc.)
  const [detectedTrims] = useState<string[]>(() => {
    if (data.designNotes?.trims) {
      const rawTrims = data.designNotes.trims
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      // Only keep key trims, filter out same-fabric items like cuffs/collars
      return rawTrims.filter((t) => {
        const lower = t.toLowerCase();
        return KEY_TRIMS.some((kt) => lower.includes(kt.toLowerCase())) ||
          lower.includes('button') ||
          lower.includes('lace') ||
          lower.includes('contrast') ||
          lower.includes('embroidery') ||
          lower.includes('ribbon') ||
          lower.includes('piping') ||
          lower.includes('appliq');
      });
    }
    return [];
  });

  const clearUploadState = () => {
    setUploadPreview(null);
    setUploadSuccess(false);
    setReferenceImage(null);
  };

  const handleSkip = () => {
    store.setFabricStepSkipped(true);
    store.setDraft(true);
    store.setStepStatus(3, 'completed');
    store.setStepStatus(4, 'active');
    store.setStep(4);
  };

  const handleStartFabric = () => {
    setPhase('base-fabric');
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      store.setStep(2);
      store.setStepStatus(2, 'active');
    }
  };

  // --- Base Fabric ---
  const handleFabricUpload = (_file: File, dataUrl: string) => {
    setUploadPreview(dataUrl);
    setUploadSuccess(true);
    store.setBaseFabric({
      type: 'uploaded',
      cardImage: dataUrl,
      description: 'Uploaded fabric card',
    });
    setTimeout(() => {
      setPhase('lining');
      clearUploadState();
    }, 1500);
  };

  const handleFabricFactorySource = () => {
    store.setBaseFabric({
      type: 'factory-source',
      description: 'Factory to source',
      factoryNote: factoryNote,
      referenceImage: referenceImage || undefined,
    });
    setFactoryNote('');
    setSourceMode(null);
    clearUploadState();
    setPhase('lining');
  };

  // --- Lining ---
  const handleLiningUpload = (_file: File, dataUrl: string) => {
    setUploadPreview(dataUrl);
    setUploadSuccess(true);
    store.setLining({
      type: 'uploaded',
      cardImage: dataUrl,
      description: 'Uploaded lining card',
    });
    setTimeout(() => {
      setPhase(detectedTrims.length > 0 ? 'trims' : 'done');
      clearUploadState();
    }, 1500);
  };

  const handleLiningFactorySource = () => {
    store.setLining({
      type: 'factory-source',
      description: 'Factory to source',
      factoryNote: factoryNote,
      referenceImage: referenceImage || undefined,
    });
    setFactoryNote('');
    setSourceMode(null);
    clearUploadState();
    setPhase(detectedTrims.length > 0 ? 'trims' : 'done');
  };

  const handleSkipLining = () => {
    store.setLining(undefined);
    clearUploadState();
    setPhase(detectedTrims.length > 0 ? 'trims' : 'done');
  };

  // --- Trims ---
  const currentTrim = detectedTrims[currentTrimIdx];

  const handleTrimUpload = (_file: File, dataUrl: string) => {
    setUploadPreview(dataUrl);
    setUploadSuccess(true);
    store.addTrim({
      trimType: currentTrim,
      type: 'uploaded',
      cardImage: dataUrl,
      description: `Uploaded card for ${currentTrim}`,
    });
    setTimeout(() => {
      advanceTrim();
      clearUploadState();
    }, 1500);
  };

  const handleTrimFactorySource = () => {
    store.addTrim({
      trimType: currentTrim,
      type: 'factory-source',
      description: `Factory to source \u2014 ${currentTrim}`,
      factoryNote: factoryNote,
      referenceImage: referenceImage || undefined,
    });
    setFactoryNote('');
    setSourceMode(null);
    clearUploadState();
    advanceTrim();
  };

  const handleSkipTrim = () => {
    clearUploadState();
    advanceTrim();
  };

  const advanceTrim = () => {
    if (currentTrimIdx < detectedTrims.length - 1) {
      setCurrentTrimIdx((i) => i + 1);
    } else {
      setPhase('done');
    }
  };

  // --- Done ---
  const handleContinue = () => {
    store.setStepStatus(3, 'completed');
    store.setStepStatus(4, 'active');
    store.setStep(4);
  };

  const handleReferenceImageUpload = (_file: File, dataUrl: string) => {
    setReferenceImage(dataUrl);
  };

  // Render helper for source choice
  const renderSourceOptions = (
    onUpload: (file: File, dataUrl: string) => void,
    onFactorySource: () => void,
    onSkip?: () => void,
    label?: string,
    skipLabel?: string
  ) => {
    // "Source for me" (AI source) - show mill list not updated message
    if (sourceMode === 'ai-source') {
      return (
        <div className="space-y-3">
          <div className="flex items-start gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800">Factory mill list is not yet updated in the system.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSourceMode(null)}>
            Back to options
          </Button>
        </div>
      );
    }

    if (sourceMode === 'factory-source') {
      return (
        <div className="space-y-3">
          <textarea
            value={factoryNote}
            onChange={(e) => setFactoryNote(e.target.value)}
            placeholder="Brief instruction for the factory..."
            className="w-full h-20 px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
          />
          {/* Reference image upload */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Upload reference image (optional)</p>
            <FileUpload onUpload={handleReferenceImageUpload} label="Upload reference image" />
            {referenceImage && (
              <div className="mt-2">
                <img src={referenceImage} alt="Reference" className="w-24 h-24 object-cover rounded-lg border border-gray-200" />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={onFactorySource}>Confirm</Button>
            <Button variant="ghost" onClick={() => { setSourceMode(null); setReferenceImage(null); }}>Back</Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {label && <p className="text-sm text-gray-600 mb-2">{label}</p>}

        {/* Upload preview */}
        {uploadPreview && (
          <div className="mb-3">
            <img src={uploadPreview} alt="Uploaded" className="w-32 h-32 object-cover rounded-xl border border-gray-200" />
            {uploadSuccess && (
              <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Fabric card successfully uploaded 🎉
              </p>
            )}
          </div>
        )}

        {!uploadSuccess && (
          <>
            <FileUpload onUpload={onUpload} label="Upload fabric/trim card" />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSourceMode('ai-source')} className="flex-1">
                <Upload className="w-4 h-4 mr-2" /> Source for me
              </Button>
              <Button variant="outline" onClick={() => setSourceMode('factory-source')} className="flex-1">
                <Factory className="w-4 h-4 mr-2" /> Factory to source
              </Button>
            </div>
            {onSkip && (
              <Button variant="ghost" size="sm" onClick={onSkip} className="w-full mt-1">
                {skipLabel || 'Skip'}
              </Button>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold">3</div>
          <h2 className="text-lg font-semibold text-gray-900">Fabric & Trims</h2>
        </div>

        {/* Start Phase */}
        {phase === 'start' && (
          <div className="text-center py-6">
            <p className="text-sm text-gray-600 mb-6">Do you have your fabric and trim details ready?</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleStartFabric} size="lg">
                Yes, let&apos;s go
              </Button>
              <Button variant="outline" onClick={handleSkip} size="lg">
                Come back to this later
              </Button>
            </div>
          </div>
        )}

        {/* Base Fabric */}
        {phase === 'base-fabric' && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Base Fabric</h3>
            {data.baseFabric ? (
              <div className="mb-3">
                <div className="flex items-center gap-2 text-sm text-green-600 mb-2">
                  <CheckCircle2 className="w-4 h-4" /> Base fabric confirmed
                </div>
                {data.baseFabric.cardImage && (
                  <img src={data.baseFabric.cardImage} alt="Fabric" className="w-24 h-24 object-cover rounded-lg border border-gray-200 mb-2" />
                )}
                <p className="text-sm text-gray-600">{data.baseFabric.description}</p>
                {data.baseFabric.vendorName && (
                  <p className="text-xs text-gray-500">Supplier: {data.baseFabric.vendorName}</p>
                )}
                {data.baseFabric.vendorContact && (
                  <p className="text-xs text-gray-500">Contact: {data.baseFabric.vendorContact}</p>
                )}
              </div>
            ) : (
              renderSourceOptions(
                handleFabricUpload,
                handleFabricFactorySource
              )
            )}
          </div>
        )}

        {/* Lining */}
        {phase === 'lining' && (
          <div>
            <div className="flex items-center gap-2 text-sm text-green-600 mb-4">
              <CheckCircle2 className="w-4 h-4" /> Base fabric: {data.baseFabric?.description}
            </div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Lining</h3>
            {renderSourceOptions(
              handleLiningUpload,
              handleLiningFactorySource,
              handleSkipLining,
              'Does this garment need a lining?',
              'Skip \u2014 no lining needed'
            )}
          </div>
        )}

        {/* Trims */}
        {phase === 'trims' && detectedTrims.length > 0 && (
          <div>
            <div className="space-y-1 mb-4">
              {data.baseFabric && (
                <div className="flex items-center gap-2 text-xs text-green-600">
                  <CheckCircle2 className="w-3 h-3" /> Base fabric confirmed
                </div>
              )}
              {data.lining && (
                <div className="flex items-center gap-2 text-xs text-green-600">
                  <CheckCircle2 className="w-3 h-3" /> Lining confirmed
                </div>
              )}
            </div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">
              Trim: {currentTrim} ({currentTrimIdx + 1}/{detectedTrims.length})
            </h3>
            {renderSourceOptions(
              handleTrimUpload,
              handleTrimFactorySource,
              handleSkipTrim,
              undefined,
              'Skip this trim'
            )}
          </div>
        )}

        {/* Done */}
        {phase === 'done' && (
          <div className="text-center py-4">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-4">All fabric and trim information collected!</p>

            <div className="text-left bg-gray-50 rounded-xl p-4 mb-6 text-sm space-y-2">
              {data.baseFabric && (
                <div>
                  <p><span className="font-medium text-gray-500">Base Fabric:</span> {data.baseFabric.description}</p>
                  {data.baseFabric.cardImage && (
                    <img src={data.baseFabric.cardImage} alt="Fabric" className="w-20 h-20 object-cover rounded-lg border border-gray-200 mt-1" />
                  )}
                  {data.baseFabric.vendorName && (
                    <p className="text-xs text-gray-500">Supplier: {data.baseFabric.vendorName}</p>
                  )}
                  {data.baseFabric.vendorContact && (
                    <p className="text-xs text-gray-500">Contact: {data.baseFabric.vendorContact}</p>
                  )}
                </div>
              )}
              {data.lining && (
                <div>
                  <p><span className="font-medium text-gray-500">Lining:</span> {data.lining.description}</p>
                  {data.lining.vendorName && (
                    <p className="text-xs text-gray-500">Supplier: {data.lining.vendorName}</p>
                  )}
                </div>
              )}
              {data.trims.length > 0 && (
                <div>
                  <span className="font-medium text-gray-500">Trims:</span>
                  <ul className="ml-4 mt-1 space-y-1">
                    {data.trims.map((t, i) => (
                      <li key={i} className="text-gray-600">
                        &bull; {t.trimType}: {t.description}
                        {t.vendorName && <span className="text-xs text-gray-400"> (Supplier: {t.vendorName})</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <Button onClick={handleContinue} size="lg" className="w-full">
              Continue to Size Chart
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
