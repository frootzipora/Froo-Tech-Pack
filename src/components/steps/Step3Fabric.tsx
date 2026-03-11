'use client';

import React, { useState } from 'react';
import { useTechPackStore } from '@/store/techpack-store';
import { Button } from '@/components/ui/Button';
import { FileUpload } from '@/components/ui/FileUpload';
import { Loader2, ArrowRight, Sparkles, Factory, CheckCircle2 } from 'lucide-react';

type FabricPhase = 'start' | 'base-fabric' | 'lining' | 'trims' | 'done';
type SourceMode = 'upload' | 'ai-source' | 'factory-source' | null;

interface FabricSuggestion {
  name: string;
  composition: string;
  weight: string;
  color: string;
  reason: string;
  vendor: string;
}

interface TrimSuggestion {
  description: string;
  material: string;
  color: string;
  size: string;
  vendor: string;
  cost: string;
}

export function Step3Fabric() {
  const store = useTechPackStore();
  const { data } = store;

  const [phase, setPhase] = useState<FabricPhase>('start');
  const [sourceMode, setSourceMode] = useState<SourceMode>(null);
  const [factoryNote, setFactoryNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fabricSuggestions, setFabricSuggestions] = useState<FabricSuggestion[]>([]);
  const [trimSuggestions, setTrimSuggestions] = useState<TrimSuggestion[]>([]);
  const [currentTrimIdx, setCurrentTrimIdx] = useState(0);
  const [detectedTrims] = useState<string[]>(() => {
    if (data.designNotes?.trims) {
      return data.designNotes.trims
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    }
    return [];
  });

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

  // --- Base Fabric ---
  const handleFabricUpload = (_file: File, dataUrl: string) => {
    store.setBaseFabric({
      type: 'uploaded',
      cardImage: dataUrl,
      description: 'Uploaded fabric card',
    });
    setPhase('lining');
  };

  const handleFabricAISource = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/suggest-fabric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'fabric',
          garmentType: data.designNotes?.overall || 'garment',
          designNotes: data.designNotes
            ? `${data.designNotes.silhouette}. ${data.designNotes.construction}`
            : data.sampleDescription,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const result = await res.json();
      setFabricSuggestions(result.suggestions || []);
      setSourceMode('ai-source');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFabricSuggestion = (s: FabricSuggestion) => {
    store.setBaseFabric({
      type: 'ai-sourced',
      description: `${s.name} — ${s.composition}`,
      color: s.color,
      composition: s.composition,
      vendorName: s.vendor,
    });
    setFabricSuggestions([]);
    setSourceMode(null);
    setPhase('lining');
  };

  const handleFabricFactorySource = () => {
    store.setBaseFabric({
      type: 'factory-source',
      description: 'Factory to source',
      factoryNote: factoryNote,
    });
    setFactoryNote('');
    setSourceMode(null);
    setPhase('lining');
  };

  // --- Lining ---
  const handleLiningUpload = (_file: File, dataUrl: string) => {
    store.setLining({
      type: 'uploaded',
      cardImage: dataUrl,
      description: 'Uploaded lining card',
    });
    setPhase(detectedTrims.length > 0 ? 'trims' : 'done');
  };

  const handleLiningAISource = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/suggest-fabric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'lining',
          garmentType: data.designNotes?.overall || 'garment',
          designNotes: data.designNotes?.construction || '',
          baseFabricDescription: data.baseFabric?.description,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const result = await res.json();
      setFabricSuggestions(result.suggestions || []);
      setSourceMode('ai-source');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectLiningSuggestion = (s: FabricSuggestion) => {
    store.setLining({
      type: 'ai-sourced',
      description: `${s.name} — ${s.composition}`,
      color: s.color,
      composition: s.composition,
      vendorName: s.vendor,
    });
    setFabricSuggestions([]);
    setSourceMode(null);
    setPhase(detectedTrims.length > 0 ? 'trims' : 'done');
  };

  const handleLiningFactorySource = () => {
    store.setLining({
      type: 'factory-source',
      description: 'Factory to source',
      factoryNote: factoryNote,
    });
    setFactoryNote('');
    setSourceMode(null);
    setPhase(detectedTrims.length > 0 ? 'trims' : 'done');
  };

  const handleSkipLining = () => {
    store.setLining({
      type: 'factory-source',
      description: 'No lining needed',
      factoryNote: 'No lining',
    });
    setPhase(detectedTrims.length > 0 ? 'trims' : 'done');
  };

  // --- Trims ---
  const currentTrim = detectedTrims[currentTrimIdx];

  const handleTrimUpload = (_file: File, dataUrl: string) => {
    store.addTrim({
      trimType: currentTrim,
      type: 'uploaded',
      cardImage: dataUrl,
      description: `Uploaded card for ${currentTrim}`,
    });
    advanceTrim();
  };

  const handleTrimAISource = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/suggest-fabric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'trim',
          garmentType: currentTrim,
          designNotes: data.designNotes?.trims || '',
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const result = await res.json();
      setTrimSuggestions(result.suggestions || []);
      setSourceMode('ai-source');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTrimSuggestion = (s: TrimSuggestion) => {
    store.addTrim({
      trimType: currentTrim,
      type: 'ai-sourced',
      description: s.description,
      color: s.color,
      vendorName: s.vendor,
    });
    setTrimSuggestions([]);
    setSourceMode(null);
    advanceTrim();
  };

  const handleTrimFactorySource = () => {
    store.addTrim({
      trimType: currentTrim,
      type: 'factory-source',
      description: `Factory to source — ${currentTrim}`,
      factoryNote: factoryNote,
    });
    setFactoryNote('');
    setSourceMode(null);
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

  // Render helper for 3-option source choice
  const renderSourceOptions = (
    onUpload: (file: File, dataUrl: string) => void,
    onAISource: () => void,
    onFactorySource: () => void,
    onSkip?: () => void,
    label?: string
  ) => {
    if (sourceMode === 'ai-source') {
      return (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Finding options...
            </div>
          ) : fabricSuggestions.length > 0 ? (
            <div className="space-y-2">
              {fabricSuggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (phase === 'base-fabric') handleSelectFabricSuggestion(s);
                    else handleSelectLiningSuggestion(s);
                  }}
                  className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all"
                >
                  <p className="text-sm font-medium text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.composition} — {s.weight} — {s.color}</p>
                  <p className="text-xs text-gray-400 mt-1">{s.reason}</p>
                  <p className="text-xs text-gray-400">Vendor: {s.vendor}</p>
                </button>
              ))}
            </div>
          ) : trimSuggestions.length > 0 ? (
            <div className="space-y-2">
              {trimSuggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectTrimSuggestion(s)}
                  className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all"
                >
                  <p className="text-sm font-medium text-gray-900">{s.description}</p>
                  <p className="text-xs text-gray-500">{s.material} — {s.color} — {s.size}</p>
                  <p className="text-xs text-gray-400">Vendor: {s.vendor} — ~{s.cost}</p>
                </button>
              ))}
            </div>
          ) : null}
          <Button variant="ghost" size="sm" onClick={() => { setSourceMode(null); setFabricSuggestions([]); setTrimSuggestions([]); }}>
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
          <div className="flex gap-2">
            <Button onClick={onFactorySource} disabled={!factoryNote.trim()}>Confirm</Button>
            <Button variant="ghost" onClick={() => setSourceMode(null)}>Back</Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {label && <p className="text-sm text-gray-600 mb-2">{label}</p>}
        <FileUpload onUpload={onUpload} label="Upload fabric/trim card" />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { onAISource(); setSourceMode('ai-source'); }} className="flex-1">
            <Sparkles className="w-4 h-4 mr-2" /> Source options for me
          </Button>
          <Button variant="outline" onClick={() => setSourceMode('factory-source')} className="flex-1">
            <Factory className="w-4 h-4 mr-2" /> Factory to source
          </Button>
        </div>
        {onSkip && (
          <Button variant="ghost" size="sm" onClick={onSkip} className="w-full mt-1">
            Skip — no lining needed
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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
              <div className="flex items-center gap-2 text-sm text-green-600 mb-3">
                <CheckCircle2 className="w-4 h-4" /> Base fabric confirmed
              </div>
            ) : (
              renderSourceOptions(
                handleFabricUpload,
                handleFabricAISource,
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
              handleLiningAISource,
              handleLiningFactorySource,
              handleSkipLining,
              'Does this garment need a lining?'
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
              handleTrimAISource,
              handleTrimFactorySource
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
                <p><span className="font-medium text-gray-500">Base Fabric:</span> {data.baseFabric.description}</p>
              )}
              {data.lining && (
                <p><span className="font-medium text-gray-500">Lining:</span> {data.lining.description}</p>
              )}
              {data.trims.length > 0 && (
                <div>
                  <span className="font-medium text-gray-500">Trims:</span>
                  <ul className="ml-4 mt-1 space-y-1">
                    {data.trims.map((t, i) => (
                      <li key={i} className="text-gray-600">• {t.trimType}: {t.description}</li>
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
