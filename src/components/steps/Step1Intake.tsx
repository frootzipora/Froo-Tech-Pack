'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTechPackStore } from '@/store/techpack-store';
import { Brand, Category, SampleSize, DesignNotes } from '@/lib/types';
import { getNextSampleNumber } from '@/lib/sample-numbers';
import { OptionButtons } from '@/components/ui/OptionButtons';
import { FileUpload } from '@/components/ui/FileUpload';
import { Button } from '@/components/ui/Button';
import { Loader2, ImageIcon, CheckCircle2, Edit3 } from 'lucide-react';

type Phase = 'upload' | 'info-gathering' | 'analyzing' | 'clarifying' | 'review' | 'done';

const BRANDS: { label: string; value: Brand }[] = [
  { label: 'Froo', value: 'Froo' },
  { label: 'Sweet Threads', value: 'Sweet Threads' },
  { label: 'Prairie', value: 'Prairie' },
  { label: 'Soirée', value: 'Soirée' },
];

const CATEGORIES: { label: string; value: Category }[] = [
  { label: 'Baby', value: 'Baby' },
  { label: 'Girls', value: 'Girls' },
  { label: 'Boys', value: 'Boys' },
  { label: 'Preteen', value: 'Preteen' },
  { label: 'Teen', value: 'Teen' },
];

const SAMPLE_SIZES: { label: string; value: SampleSize }[] = [
  { label: '2', value: '2' },
  { label: '6', value: '6' },
  { label: '8', value: '8' },
  { label: '16', value: '16' },
  { label: '18', value: '18' },
  { label: 'M', value: 'M' },
];

export function Step1Intake() {
  const store = useTechPackStore();
  const { data } = store;
  const [phase, setPhase] = useState<Phase>('upload');
  const [description, setDescription] = useState(data.sampleDescription || '');
  const [uploadedImages, setUploadedImages] = useState<string[]>(data.inspirationImages || []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [analysis, setAnalysis] = useState<any>(null);
  const [clarifyingQuestions, setClarifyingQuestions] = useState<string[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [clarificationInput, setClarificationInput] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [phase, currentQuestionIdx]);

  const handleImageUpload = (_file: File, dataUrl: string) => {
    setUploadedImages((prev) => [...prev, dataUrl]);
    store.addInspirationImage(dataUrl);
  };

  const handleStartAnalysis = async () => {
    // Auto-assign sample number
    const sampleNum = getNextSampleNumber();
    store.setSampleNumber(sampleNum);
    store.setSampleDescription(description);

    setPhase('analyzing');
    setIsAnalyzing(true);

    try {
      // Extract base64 from data URL
      let imageBase64 = '';
      let imageMediaType = 'image/jpeg';
      if (uploadedImages.length > 0) {
        const parts = uploadedImages[0].split(',');
        imageBase64 = parts[1] || '';
        const mimeMatch = parts[0].match(/data:(.*?);/);
        if (mimeMatch) imageMediaType = mimeMatch[1];
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          imageMediaType,
          description,
        }),
      });

      if (!res.ok) throw new Error('Analysis failed');

      const result = await res.json();
      setAnalysis(result);

      // Auto-detect category if suggested
      if (result.suggestedCategory && !data.category) {
        store.setCategory(result.suggestedCategory);
        store.addDetectedField('category');
      }

      // Set design notes
      const notes: DesignNotes = {
        silhouette: result.silhouette || '',
        construction: result.construction || '',
        closures: result.closures || '',
        neckline: result.neckline || '',
        hemFinish: result.hemFinish || '',
        trims: result.trims || '',
        overall: result.overall || '',
      };
      store.setDesignNotes(notes);

      // Set clarifying questions
      if (result.clarifyingQuestions?.length > 0) {
        setClarifyingQuestions(result.clarifyingQuestions);
        setPhase('clarifying');
      } else {
        setPhase('review');
      }
    } catch (err) {
      console.error(err);
      // Proceed even if analysis fails
      setPhase('info-gathering');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClarificationAnswer = () => {
    if (!clarificationInput.trim()) return;

    store.setClarification(clarifyingQuestions[currentQuestionIdx], clarificationInput);
    setClarificationInput('');

    if (currentQuestionIdx < clarifyingQuestions.length - 1) {
      setCurrentQuestionIdx((i) => i + 1);
    } else {
      setPhase('review');
    }
  };

  const handleApproveNotes = () => {
    store.setStepStatus(1, 'completed');
    store.setStepStatus(2, 'active');
    store.setStep(2);
  };

  const handleEditNotes = () => {
    const notes = data.designNotes;
    if (notes) {
      setEditedNotes(
        `Silhouette: ${notes.silhouette}\nConstruction: ${notes.construction}\nClosures: ${notes.closures}\nNeckline: ${notes.neckline}\nHem: ${notes.hemFinish}\nTrims: ${notes.trims}\nOverall: ${notes.overall}`
      );
    }
    setEditingNotes(true);
  };

  const handleSaveEditedNotes = () => {
    // Parse edited notes back into structure
    const lines = editedNotes.split('\n');
    const notes: DesignNotes = {
      silhouette: '',
      construction: '',
      closures: '',
      neckline: '',
      hemFinish: '',
      trims: '',
      overall: '',
    };

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.startsWith('silhouette:')) notes.silhouette = line.split(':').slice(1).join(':').trim();
      else if (lower.startsWith('construction:')) notes.construction = line.split(':').slice(1).join(':').trim();
      else if (lower.startsWith('closures:') || lower.startsWith('closure:')) notes.closures = line.split(':').slice(1).join(':').trim();
      else if (lower.startsWith('neckline:')) notes.neckline = line.split(':').slice(1).join(':').trim();
      else if (lower.startsWith('hem:')) notes.hemFinish = line.split(':').slice(1).join(':').trim();
      else if (lower.startsWith('trims:') || lower.startsWith('trim:')) notes.trims = line.split(':').slice(1).join(':').trim();
      else if (lower.startsWith('overall:')) notes.overall = line.split(':').slice(1).join(':').trim();
    }

    store.setDesignNotes(notes);
    setEditingNotes(false);
  };

  const canProceedToAnalysis = uploadedImages.length > 0 && data.brand && data.category && data.sampleSize;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Upload Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold">1</div>
          <h2 className="text-lg font-semibold text-gray-900">Intake & Clarification</h2>
        </div>

        {/* Image Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Inspiration Images</label>
          {uploadedImages.length > 0 && (
            <div className="flex gap-3 mb-3 flex-wrap">
              {uploadedImages.map((img, i) => (
                <div key={i} className="relative group">
                  <img src={img} alt={`Inspiration ${i + 1}`} className="w-28 h-28 object-cover rounded-xl border border-gray-200" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center transition-opacity">
                    <ImageIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
              ))}
            </div>
          )}
          <FileUpload onUpload={handleImageUpload} multiple label="Drop inspiration images here" />
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Sample Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the garment — fabric, details, construction notes, anything relevant..."
            className="w-full h-28 px-4 py-3 rounded-xl border border-gray-300 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
          />
        </div>

        {/* Brand */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
          <OptionButtons
            options={BRANDS}
            selected={data.brand}
            onSelect={(v) => store.setBrand(v as Brand)}
          />
        </div>

        {/* Category */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <OptionButtons
            options={CATEGORIES}
            selected={data.category}
            onSelect={(v) => store.setCategory(v as Category)}
          />
        </div>

        {/* Sample Size */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Sample Size</label>
          <OptionButtons
            options={SAMPLE_SIZES}
            selected={data.sampleSize}
            onSelect={(v) => store.setSampleSize(v as SampleSize)}
          />
        </div>

        {/* Sample Number Display */}
        {data.sampleNumber && (
          <div className="mb-4 px-4 py-2 bg-gray-50 rounded-lg text-sm text-gray-600">
            Sample Number: <span className="font-mono font-bold text-gray-900">{data.sampleNumber}</span>
          </div>
        )}

        {/* Analyze Button */}
        {phase === 'upload' && (
          <Button
            onClick={handleStartAnalysis}
            disabled={!canProceedToAnalysis}
            size="lg"
            className="w-full"
          >
            Analyze & Continue
          </Button>
        )}
      </div>

      {/* Analyzing Phase */}
      {(phase === 'analyzing' || isAnalyzing) && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600">Analyzing your inspiration image for design details...</p>
        </div>
      )}

      {/* Clarifying Questions */}
      {phase === 'clarifying' && clarifyingQuestions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Clarifying Question {currentQuestionIdx + 1}/{clarifyingQuestions.length}</h3>
          <p className="text-gray-800 mb-4">{clarifyingQuestions[currentQuestionIdx]}</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={clarificationInput}
              onChange={(e) => setClarificationInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleClarificationAnswer()}
              placeholder="Type your answer..."
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <Button onClick={handleClarificationAnswer}>Next</Button>
          </div>
        </div>
      )}

      {/* Notes Review */}
      {phase === 'review' && data.designNotes && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Design Notes Review</h3>
            <button
              onClick={handleEditNotes}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          </div>

          {editingNotes ? (
            <div>
              <textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                className="w-full h-64 px-4 py-3 rounded-xl border border-gray-300 text-sm text-gray-800 font-mono focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              />
              <div className="flex gap-2 mt-3">
                <Button onClick={handleSaveEditedNotes}>Save Changes</Button>
                <Button variant="ghost" onClick={() => setEditingNotes(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm text-gray-700">
              {Object.entries(data.designNotes).map(([key, value]) => (
                <div key={key} className="flex gap-3">
                  <span className="font-medium text-gray-500 capitalize min-w-[100px]">{key === 'hemFinish' ? 'Hem Finish' : key}:</span>
                  <span>{value}</span>
                </div>
              ))}

              {Object.keys(data.clarifications).length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 mb-2">CLARIFICATIONS</p>
                  {Object.entries(data.clarifications).map(([q, a]) => (
                    <div key={q} className="mb-2">
                      <p className="text-xs text-gray-400">{q}</p>
                      <p className="text-sm text-gray-700">{a}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <Button onClick={handleApproveNotes} size="lg" className="flex-1">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve & Continue
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analysis Details (if available) */}
      {analysis?.detectedTrims && phase !== 'analyzing' && (
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 mb-2">DETECTED TRIMS & DETAILS</p>
          <div className="flex flex-wrap gap-2">
            {(analysis.detectedTrims as string[]).map((trim: string) => (
              <span key={trim} className="px-2 py-1 bg-white rounded-full text-xs text-gray-600 border border-gray-200">
                {trim}
              </span>
            ))}
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
