'use client';

import React, { useRef } from 'react';
import { useTechPackStore } from '@/store/techpack-store';
import { getBrandColors } from '@/lib/brand-themes';
import { Button } from '@/components/ui/Button';
import { Download, FileText, Printer } from 'lucide-react';

export function TechPackPreview() {
  const { data } = useTechPackStore();
  const printRef = useRef<HTMLDivElement>(null);

  const brand = data.brand || 'Froo';
  const colors = getBrandColors(brand);

  const handlePrint = () => {
    window.print();
  };

  const isComplete = data.stepStatuses.every((s) => s === 'completed');
  const showPreview = data.stepStatuses[0] === 'completed';

  if (!showPreview) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Complete the steps to preview your tech pack</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Action Bar */}
      <div className="flex items-center justify-between mb-6 no-print">
        <h2 className="text-lg font-semibold text-gray-900">Tech Pack Preview</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
          <Button onClick={handlePrint}>
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Tech Pack Document */}
      <div ref={printRef} className="space-y-8 print-area">
        {/* PAGE 1 — Design Overview */}
        <div
          className="bg-white rounded-2xl border overflow-hidden shadow-sm"
          style={{ borderColor: colors.border }}
        >
          {/* Header */}
          <div
            className="px-8 py-5 flex items-center justify-between"
            style={{ backgroundColor: colors.headerBg }}
          >
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: colors.primaryText }}
            >
              {brand}
            </h1>
            <div className="text-right" style={{ color: colors.primaryText }}>
              <p className="text-sm opacity-80">TECH PACK</p>
              <p className="text-xs opacity-60">
                {data.sampleNumber} — {data.category} — Size {data.sampleSize}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8" style={{ backgroundColor: colors.bodyBg }}>
            {/* Meta Row */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl p-3 border border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase">Sample #</p>
                <p className="text-sm font-bold text-gray-900">{data.sampleNumber || '—'}</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase">Brand</p>
                <p className="text-sm font-bold text-gray-900">{data.brand || '—'}</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase">Category</p>
                <p className="text-sm font-bold text-gray-900">{data.category || '—'}</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase">Sample Size</p>
                <p className="text-sm font-bold text-gray-900">{data.sampleSize || '—'}</p>
              </div>
            </div>

            {/* Inspiration Image */}
            {data.inspirationImages.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3" style={{ color: colors.accent }}>
                  Inspiration Image
                </h3>
                <div className="flex gap-4">
                  {data.inspirationImages.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`Inspiration ${i + 1}`}
                      className="w-48 h-48 object-cover rounded-xl border border-gray-200"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Technical Flats Placeholder */}
            <div className="mb-8">
              <h3 className="text-xs font-semibold uppercase mb-3" style={{ color: colors.accent }}>
                Technical Flat Sketches
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-8 text-center min-h-[200px] flex items-center justify-center">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Front View</p>
                    {data.visuals.technicalFlatFront ? (
                      <p className="text-xs text-green-500 mt-1">Generated</p>
                    ) : (
                      <p className="text-xs text-gray-300 mt-1">Pending generation</p>
                    )}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-8 text-center min-h-[200px] flex items-center justify-center">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Back View</p>
                    {data.visuals.technicalFlatBack ? (
                      <p className="text-xs text-green-500 mt-1">Generated</p>
                    ) : (
                      <p className="text-xs text-gray-300 mt-1">Pending generation</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 3D Mockups Placeholder */}
            <div className="mb-8">
              <h3 className="text-xs font-semibold uppercase mb-3" style={{ color: colors.accent }}>
                3D Mockups
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-8 text-center min-h-[200px] flex items-center justify-center">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Front View</p>
                    {data.visuals.mockup3dFront ? (
                      <p className="text-xs text-green-500 mt-1">Generated</p>
                    ) : (
                      <p className="text-xs text-gray-300 mt-1">Pending generation</p>
                    )}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-8 text-center min-h-[200px] flex items-center justify-center">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Back View</p>
                    {data.visuals.mockup3dBack ? (
                      <p className="text-xs text-green-500 mt-1">Generated</p>
                    ) : (
                      <p className="text-xs text-gray-300 mt-1">Pending generation</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Detail Callouts */}
            {data.visuals.detailCallouts.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-semibold uppercase mb-3" style={{ color: colors.accent }}>
                  Detail Callouts
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {data.visuals.detailCallouts.map((callout, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                      <p className="text-xs font-medium text-gray-600">{callout.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Factory Notes */}
            {data.designNotes && (
              <div>
                <h3 className="text-xs font-semibold uppercase mb-3" style={{ color: colors.accent }}>
                  Factory Notes
                </h3>
                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2 text-sm">
                  <div className="grid grid-cols-[120px,1fr] gap-2">
                    <span className="text-gray-400 font-medium">Silhouette</span>
                    <span className="text-gray-700">{data.designNotes.silhouette}</span>
                  </div>
                  <div className="grid grid-cols-[120px,1fr] gap-2">
                    <span className="text-gray-400 font-medium">Construction</span>
                    <span className="text-gray-700">{data.designNotes.construction}</span>
                  </div>
                  <div className="grid grid-cols-[120px,1fr] gap-2">
                    <span className="text-gray-400 font-medium">Closures</span>
                    <span className="text-gray-700">{data.designNotes.closures}</span>
                  </div>
                  <div className="grid grid-cols-[120px,1fr] gap-2">
                    <span className="text-gray-400 font-medium">Neckline</span>
                    <span className="text-gray-700">{data.designNotes.neckline}</span>
                  </div>
                  <div className="grid grid-cols-[120px,1fr] gap-2">
                    <span className="text-gray-400 font-medium">Hem Finish</span>
                    <span className="text-gray-700">{data.designNotes.hemFinish}</span>
                  </div>
                  <div className="grid grid-cols-[120px,1fr] gap-2">
                    <span className="text-gray-400 font-medium">Trims</span>
                    <span className="text-gray-700">{data.designNotes.trims}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Clarifications */}
            {Object.keys(data.clarifications).length > 0 && (
              <div className="mt-4">
                <h3 className="text-xs font-semibold uppercase mb-3" style={{ color: colors.accent }}>
                  Additional Notes
                </h3>
                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2 text-sm">
                  {Object.entries(data.clarifications).map(([q, a]) => (
                    <div key={q}>
                      <p className="text-xs text-gray-400">{q}</p>
                      <p className="text-gray-700">{a}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PAGE 2 — Fabric & Trims */}
        <div
          className="bg-white rounded-2xl border overflow-hidden shadow-sm"
          style={{ borderColor: colors.border }}
        >
          <div
            className="px-8 py-4 flex items-center justify-between"
            style={{ backgroundColor: colors.headerBg }}
          >
            <h2 className="text-lg font-bold" style={{ color: colors.primaryText }}>
              Fabric & Trims
            </h2>
            <p className="text-xs opacity-60" style={{ color: colors.primaryText }}>
              {data.sampleNumber} — Page 2
            </p>
          </div>

          <div className="p-8" style={{ backgroundColor: colors.bodyBg }}>
            {data.fabricStepSkipped ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                <p className="text-sm font-medium text-yellow-800">TBD — Pending Fabric Selection</p>
                <p className="text-xs text-yellow-600 mt-1">
                  This section will be completed when fabric details are available.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Base Fabric */}
                <div>
                  <h3 className="text-xs font-semibold uppercase mb-3" style={{ color: colors.accent }}>
                    Base Fabric
                  </h3>
                  {data.baseFabric ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex gap-4">
                        {data.baseFabric.cardImage && (
                          <img
                            src={data.baseFabric.cardImage}
                            alt="Fabric card"
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        )}
                        <div className="text-sm space-y-1">
                          <p className="font-medium text-gray-900">{data.baseFabric.description}</p>
                          {data.baseFabric.composition && (
                            <p className="text-gray-500">Composition: {data.baseFabric.composition}</p>
                          )}
                          {data.baseFabric.color && (
                            <p className="text-gray-500">Color: {data.baseFabric.color}</p>
                          )}
                          {data.baseFabric.vendorName && (
                            <p className="text-gray-500">Vendor: {data.baseFabric.vendorName}</p>
                          )}
                          {data.baseFabric.factoryNote && (
                            <p className="text-gray-500 italic">Note: {data.baseFabric.factoryNote}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center text-sm text-yellow-700">
                      TBD — Pending
                    </div>
                  )}
                </div>

                {/* Lining */}
                <div>
                  <h3 className="text-xs font-semibold uppercase mb-3" style={{ color: colors.accent }}>
                    Lining
                  </h3>
                  {data.lining ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex gap-4">
                        {data.lining.cardImage && (
                          <img
                            src={data.lining.cardImage}
                            alt="Lining card"
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        )}
                        <div className="text-sm space-y-1">
                          <p className="font-medium text-gray-900">{data.lining.description}</p>
                          {data.lining.vendorName && (
                            <p className="text-gray-500">Vendor: {data.lining.vendorName}</p>
                          )}
                          {data.lining.factoryNote && (
                            <p className="text-gray-500 italic">Note: {data.lining.factoryNote}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center text-sm text-yellow-700">
                      TBD — Pending
                    </div>
                  )}
                </div>

                {/* Trims & Notions */}
                <div>
                  <h3 className="text-xs font-semibold uppercase mb-3" style={{ color: colors.accent }}>
                    Trims & Notions
                  </h3>
                  {data.trims.length > 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Type</th>
                            <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Description</th>
                            <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Color</th>
                            <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Vendor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.trims.map((trim, i) => (
                            <tr key={i} className="border-t border-gray-100">
                              <td className="px-4 py-2 font-medium text-gray-900">{trim.trimType}</td>
                              <td className="px-4 py-2 text-gray-600">
                                {trim.description}
                                {trim.factoryNote && <span className="italic text-gray-400"> — {trim.factoryNote}</span>}
                              </td>
                              <td className="px-4 py-2 text-gray-600">{trim.color || '—'}</td>
                              <td className="px-4 py-2 text-gray-600">{trim.vendorName || 'Factory'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-sm text-gray-400">
                      No trims specified
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PAGE 3 — Size & Measurement */}
        <div
          className="bg-white rounded-2xl border overflow-hidden shadow-sm"
          style={{ borderColor: colors.border }}
        >
          <div
            className="px-8 py-4 flex items-center justify-between"
            style={{ backgroundColor: colors.headerBg }}
          >
            <h2 className="text-lg font-bold" style={{ color: colors.primaryText }}>
              Size & Measurement
            </h2>
            <p className="text-xs opacity-60" style={{ color: colors.primaryText }}>
              {data.sampleNumber} — Page 3
            </p>
          </div>

          <div className="p-8" style={{ backgroundColor: colors.bodyBg }}>
            {data.sizeChart ? (
              <div>
                {data.sizeChart.name && (
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Chart: {data.sizeChart.name}
                    {data.sampleSize && ` — Sample size: ${data.sampleSize}`}
                  </p>
                )}

                {data.sizeChart.data && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr>
                          {data.sizeChart.data[0].map((h, i) => (
                            <th
                              key={i}
                              className="border px-4 py-2 text-left font-semibold"
                              style={{
                                backgroundColor: i === 0 ? colors.headerBg : 'white',
                                color: i === 0 ? colors.primaryText : colors.accent,
                                borderColor: colors.border,
                              }}
                            >
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
                                className="border px-4 py-2"
                                style={{
                                  borderColor: colors.border,
                                  backgroundColor:
                                    data.sampleSize && data.sizeChart?.data?.[0][ci] === data.sampleSize
                                      ? colors.secondary
                                      : ci === 0
                                      ? '#f9fafb'
                                      : 'white',
                                  fontWeight: ci === 0 ? 600 : 400,
                                  color: ci === 0 ? '#374151' : '#6b7280',
                                }}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {data.sizeChart.image && (
                  <img
                    src={data.sizeChart.image}
                    alt="Size chart"
                    className="w-full rounded-xl border border-gray-200 mt-4"
                  />
                )}
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                <p className="text-sm font-medium text-yellow-800">TBD — Pending Size Chart</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Banner */}
      {!isComplete && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-center no-print">
          <p className="text-sm font-medium text-amber-800">
            Draft — Some sections are pending completion
          </p>
        </div>
      )}

      {isComplete && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4 text-center no-print">
          <p className="text-sm font-medium text-green-800">
            Tech pack complete and ready for factory submission
          </p>
        </div>
      )}
    </div>
  );
}
