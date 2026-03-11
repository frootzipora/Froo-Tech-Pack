'use client';

import React, { useState } from 'react';
import { useTechPackStore } from '@/store/techpack-store';
import { Button } from '@/components/ui/Button';
import { FileUpload } from '@/components/ui/FileUpload';
import { CheckCircle2, Table, FileSpreadsheet, Upload, ArrowLeft } from 'lucide-react';

type SizeChartMode = 'choose' | 'repeat' | 'new' | 'upload' | 'done';

const SIZE_CHART_TEMPLATES: Record<string, { name: string; headers: string[]; rows: string[][] }> = {
  'baby-dress': {
    name: 'Baby Dress',
    headers: ['Measurement', '0-3M', '3-6M', '6-12M', '12-18M', '18-24M'],
    rows: [
      ['Chest', '17"', '18"', '19"', '20"', '21"'],
      ['Length (HPS)', '14"', '15"', '16.5"', '18"', '19.5"'],
      ['Sleeve Length', '3"', '3.5"', '4"', '4.5"', '5"'],
      ['Hem Width', '20"', '21"', '22"', '23"', '24"'],
    ],
  },
  'girls-dress': {
    name: 'Girls Dress',
    headers: ['Measurement', '2', '4', '6', '8', '10', '12'],
    rows: [
      ['Chest', '21"', '22"', '23"', '25"', '27"', '29"'],
      ['Waist', '20"', '21"', '22"', '23"', '24"', '25"'],
      ['Length (HPS)', '20"', '22"', '24"', '27"', '30"', '33"'],
      ['Sleeve Length', '4"', '5"', '6"', '7"', '8"', '9"'],
      ['Hem Width', '26"', '28"', '30"', '32"', '34"', '36"'],
    ],
  },
  'girls-top': {
    name: 'Girls Top',
    headers: ['Measurement', '2', '4', '6', '8', '10', '12'],
    rows: [
      ['Chest', '21"', '22"', '23"', '25"', '27"', '29"'],
      ['Length (HPS)', '13"', '14"', '15.5"', '17"', '18.5"', '20"'],
      ['Sleeve Length', '4"', '5"', '6"', '7"', '8"', '9"'],
      ['Hem Width', '22"', '23"', '24"', '26"', '28"', '30"'],
    ],
  },
  'girls-skirt': {
    name: 'Girls Skirt',
    headers: ['Measurement', '2', '4', '6', '8', '10', '12'],
    rows: [
      ['Waist (relaxed)', '19"', '20"', '21"', '22"', '23"', '24"'],
      ['Waist (stretched)', '22"', '23"', '24"', '25"', '26"', '27"'],
      ['Length', '9"', '10"', '11.5"', '13"', '14.5"', '16"'],
      ['Hem Width', '24"', '26"', '28"', '30"', '32"', '34"'],
    ],
  },
  'teen-dress': {
    name: 'Teen / Preteen Dress',
    headers: ['Measurement', '12', '14', '16', '18'],
    rows: [
      ['Chest', '29"', '31"', '33"', '35"'],
      ['Waist', '25"', '26"', '27"', '28"'],
      ['Hip', '31"', '33"', '35"', '37"'],
      ['Length (HPS)', '33"', '35"', '37"', '39"'],
      ['Sleeve Length', '9"', '10"', '11"', '12"'],
    ],
  },
  'boys-shirt': {
    name: 'Boys Shirt',
    headers: ['Measurement', '2', '4', '6', '8', '10', '12'],
    rows: [
      ['Chest', '22"', '23"', '24"', '26"', '28"', '30"'],
      ['Length (HPS)', '14"', '15"', '16.5"', '18"', '19.5"', '21"'],
      ['Sleeve Length', '5"', '6"', '7"', '8"', '9"', '10"'],
      ['Neck Width', '4.5"', '5"', '5.5"', '6"', '6.5"', '7"'],
    ],
  },
};

export function Step4SizeChart({ onBack }: { onBack?: () => void }) {
  const store = useTechPackStore();
  const { data } = store;
  const [mode, setMode] = useState<SizeChartMode>('choose');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleUpload = (_file: File, dataUrl: string) => {
    store.setSizeChart({ type: 'uploaded', image: dataUrl });
    setMode('done');
  };

  const handleSelectTemplate = (key: string) => {
    setSelectedTemplate(key);
    const template = SIZE_CHART_TEMPLATES[key];
    store.setSizeChart({
      type: 'repeat',
      data: [template.headers, ...template.rows],
      name: template.name,
    });
    setMode('done');
  };

  const handleFinish = () => {
    store.setStepStatus(4, 'completed');
    store.setDraft(false);
    store.saveCurrent();
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      store.setStep(3);
      store.setStepStatus(3, 'active');
    }
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
          <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold">4</div>
          <h2 className="text-lg font-semibold text-gray-900">Size Chart</h2>
        </div>

        {/* Choose Mode */}
        {mode === 'choose' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-4">How would you like to handle the size chart?</p>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => setMode('repeat')}
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all text-left"
              >
                <Table className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Repeat Body</p>
                  <p className="text-xs text-gray-500">Use an existing size chart template</p>
                </div>
              </button>
              <button
                onClick={() => setMode('new')}
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all text-left"
              >
                <FileSpreadsheet className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">New Body</p>
                  <p className="text-xs text-gray-500">Find the closest matching block based on design specs</p>
                </div>
              </button>
              <button
                onClick={() => setMode('upload')}
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all text-left"
              >
                <Upload className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Upload Size Chart</p>
                  <p className="text-xs text-gray-500">Upload your own size chart file</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Template Selection */}
        {(mode === 'repeat' || mode === 'new') && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              {mode === 'repeat' ? 'Select existing size chart' : 'Select closest matching block'}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(SIZE_CHART_TEMPLATES).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => handleSelectTemplate(key)}
                  className={`p-3 rounded-xl border text-left transition-all text-sm ${
                    selectedTemplate === key
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <p className="font-medium text-gray-900">{template.name}</p>
                  <p className="text-xs text-gray-400">
                    {template.headers.slice(1).join(', ')}
                  </p>
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setMode('choose')} className="mt-3">
              Back
            </Button>
          </div>
        )}

        {/* Upload */}
        {mode === 'upload' && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Upload Size Chart</h3>
            <FileUpload
              onUpload={handleUpload}
              accept={{
                'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
                'application/pdf': ['.pdf'],
                'text/csv': ['.csv'],
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
              }}
              label="Drop your size chart here (image, PDF, CSV, or Excel)"
            />
            <Button variant="ghost" size="sm" onClick={() => setMode('choose')} className="mt-3">
              Back
            </Button>
          </div>
        )}

        {/* Done */}
        {mode === 'done' && data.sizeChart && (
          <div>
            <div className="flex items-center gap-2 text-green-600 mb-4">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-medium">Size chart attached</span>
            </div>

            {data.sizeChart.data && (
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr>
                      {data.sizeChart.data[0].map((h, i) => (
                        <th key={i} className="border border-gray-200 px-3 py-2 bg-gray-50 text-left font-medium text-gray-700">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.sizeChart.data.slice(1).map((row, ri) => (
                      <tr key={ri}>
                        {row.map((cell, ci) => (
                          <td
                            key={ci}
                            className={`border border-gray-200 px-3 py-2 ${
                              ci === 0 ? 'font-medium text-gray-700' : 'text-gray-600'
                            } ${
                              data.sampleSize && data.sampleSize !== 'TBD' && data.sizeChart?.data?.[0][ci] === data.sampleSize
                                ? 'bg-yellow-50 font-bold'
                                : ''
                            }`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.sampleSize && data.sampleSize !== 'TBD' && (
                  <p className="text-xs text-gray-400 mt-2">Sample size {data.sampleSize} highlighted</p>
                )}
              </div>
            )}

            {data.sizeChart.image && (
              <img src={data.sizeChart.image} alt="Size chart" className="w-full rounded-xl border border-gray-200 mb-4" />
            )}

            <Button onClick={handleFinish} size="lg" className="w-full">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Complete Tech Pack
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
