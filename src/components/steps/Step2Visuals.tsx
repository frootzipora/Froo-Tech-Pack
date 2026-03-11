'use client';

import React, { useState, useEffect } from 'react';
import { useTechPackStore } from '@/store/techpack-store';
import { Button } from '@/components/ui/Button';
import { Loader2, CheckCircle2, XCircle, ArrowRight, Image as ImageIcon } from 'lucide-react';

interface VisualAsset {
  id: string;
  label: string;
  type: string;
  status: 'pending' | 'generating' | 'done' | 'error';
  description?: string;
}

export function Step2Visuals() {
  const store = useTechPackStore();
  const { data } = store;
  const [assets, setAssets] = useState<VisualAsset[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [allDone, setAllDone] = useState(false);

  const initAssets = () => {
    const base: VisualAsset[] = [
      { id: 'flat-front', label: 'Technical Flat — Front', type: 'flat-front', status: 'pending' },
      { id: 'flat-back', label: 'Technical Flat — Back', type: 'flat-back', status: 'pending' },
      { id: 'mockup-front', label: '3D Mockup — Front', type: 'mockup-front', status: 'pending' },
      { id: 'mockup-back', label: '3D Mockup — Back', type: 'mockup-back', status: 'pending' },
      { id: 'remove-bg', label: 'Background Removal', type: 'remove-bg', status: 'pending' },
    ];

    // Add detail callouts based on detected trims
    if (data.designNotes?.trims) {
      const trimList = data.designNotes.trims.split(',').map((t) => t.trim()).filter(Boolean);
      trimList.forEach((trim, i) => {
        base.push({
          id: `detail-${i}`,
          label: `Detail: ${trim}`,
          type: 'detail-callout',
          status: 'pending',
        });
      });
    }

    return base;
  };

  useEffect(() => {
    if (assets.length === 0) {
      setAssets(initAssets());
    }
  }, []);

  const generateAll = async () => {
    setIsGenerating(true);
    const currentAssets = assets.length > 0 ? assets : initAssets();
    if (assets.length === 0) setAssets(currentAssets);

    const description = data.designNotes?.overall || data.sampleDescription;
    const designNotes = data.designNotes
      ? `${data.designNotes.silhouette}. ${data.designNotes.construction}. ${data.designNotes.closures}. ${data.designNotes.neckline}. ${data.designNotes.hemFinish}. ${data.designNotes.trims}`
      : '';

    let imageBase64 = '';
    if (data.inspirationImages.length > 0) {
      const parts = data.inspirationImages[0].split(',');
      imageBase64 = parts[1] || '';
    }

    for (let i = 0; i < currentAssets.length; i++) {
      const asset = currentAssets[i];

      setAssets((prev) =>
        prev.map((a) => (a.id === asset.id ? { ...a, status: 'generating' } : a))
      );

      try {
        const res = await fetch('/api/generate-visuals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: asset.type,
            description,
            designNotes,
            imageBase64,
          }),
        });

        if (!res.ok) throw new Error('Generation failed');

        const result = await res.json();

        setAssets((prev) =>
          prev.map((a) =>
            a.id === asset.id
              ? { ...a, status: 'done', description: result.description }
              : a
          )
        );

        // Update store with visual references
        if (asset.type === 'flat-front') store.setVisuals({ technicalFlatFront: 'generated' });
        else if (asset.type === 'flat-back') store.setVisuals({ technicalFlatBack: 'generated' });
        else if (asset.type === 'mockup-front') store.setVisuals({ mockup3dFront: 'generated' });
        else if (asset.type === 'mockup-back') store.setVisuals({ mockup3dBack: 'generated' });
        else if (asset.type === 'remove-bg') store.setVisuals({ inspirationNoBg: 'generated' });
        else if (asset.type === 'detail-callout') {
          store.addDetailCallout({ label: asset.label.replace('Detail: ', ''), image: 'generated' });
        }
      } catch (err) {
        console.error(`Failed to generate ${asset.label}:`, err);
        setAssets((prev) =>
          prev.map((a) => (a.id === asset.id ? { ...a, status: 'error' } : a))
        );
      }
    }

    setIsGenerating(false);
    setAllDone(true);
  };

  const handleContinue = () => {
    store.setStepStatus(2, 'completed');
    store.setStepStatus(3, 'active');
    store.setStep(3);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold">2</div>
          <h2 className="text-lg font-semibold text-gray-900">Visual Generation</h2>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Generate technical flats, 3D mockups, and detail callouts for your tech pack.
        </p>

        {!isGenerating && !allDone && (
          <Button onClick={generateAll} size="lg" className="w-full mb-6">
            <ImageIcon className="w-4 h-4 mr-2" />
            Generate All Visuals
          </Button>
        )}

        {/* Asset List */}
        <div className="space-y-3">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                asset.status === 'generating'
                  ? 'border-blue-200 bg-blue-50'
                  : asset.status === 'done'
                  ? 'border-green-200 bg-green-50'
                  : asset.status === 'error'
                  ? 'border-red-200 bg-red-50'
                  : 'border-gray-100 bg-gray-50'
              }`}
            >
              {asset.status === 'generating' ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              ) : asset.status === 'done' ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : asset.status === 'error' ? (
                <XCircle className="w-4 h-4 text-red-500" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
              )}
              <span className="text-sm text-gray-700 flex-1">{asset.label}</span>
              {asset.status === 'generating' && (
                <span className="text-xs text-blue-500">Generating...</span>
              )}
              {asset.status === 'done' && (
                <span className="text-xs text-green-600">Done</span>
              )}
              {asset.status === 'error' && (
                <span className="text-xs text-red-500">Failed — skipped</span>
              )}
            </div>
          ))}
        </div>

        {/* Completion */}
        {allDone && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600 mb-4">
              Sketches and mockups generated! Moving to fabric details...
            </p>
            <Button onClick={handleContinue} size="lg" className="w-full">
              Continue to Fabric & Trims
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
