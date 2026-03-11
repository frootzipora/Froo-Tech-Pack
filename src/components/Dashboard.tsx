'use client';

import React, { useState, useEffect } from 'react';
import { useTechPackStore } from '@/store/techpack-store';
import { SavedTechPack } from '@/lib/types';
import { Plus, Search, FileText, Edit3, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DashboardProps {
  onNewTechPack: () => void;
  onOpenTechPack: (id: string) => void;
  onEditTechPack: (id: string) => void;
}

export function Dashboard({ onNewTechPack, onOpenTechPack, onEditTechPack }: DashboardProps) {
  const store = useTechPackStore();
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState<string | null>(null);
  const [seasonFilter, setSeasonFilter] = useState<string | null>(null);

  useEffect(() => {
    store.loadSavedPacks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredPacks = store.savedPacks.filter((pack: SavedTechPack) => {
    const matchesSearch =
      !search ||
      pack.name.toLowerCase().includes(search.toLowerCase()) ||
      (pack.data.sampleNumber || '').toLowerCase().includes(search.toLowerCase());
    const matchesBrand = !brandFilter || pack.data.brand === brandFilter;
    const matchesSeason = !seasonFilter || pack.data.season === seasonFilter;
    return matchesSearch && matchesBrand && matchesSeason;
  });

  const brands = Array.from(new Set(store.savedPacks.map((p: SavedTechPack) => p.data.brand).filter(Boolean)));
  const seasons = Array.from(new Set(store.savedPacks.map((p: SavedTechPack) => p.data.season).filter(Boolean)));

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this tech pack?')) {
      store.deleteTechPack(id);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFF9F9' }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: '#F4C2C2', backgroundColor: '#FFFFFF' }}>
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F4C2C2' }}>
                <FileText className="w-5 h-5" style={{ color: '#8B4B62' }} />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: '#3A3A3A' }}>Tech Pack Dashboard</h1>
                <p className="text-xs" style={{ color: '#B8889A' }}>{store.savedPacks.length} tech pack{store.savedPacks.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <Button
              onClick={onNewTechPack}
              className="rounded-xl"
              style={{ backgroundColor: '#F4C2C2', color: '#5A2D3E', borderColor: '#F4C2C2' }}
            >
              <Plus className="w-4 h-4 mr-2" /> New Tech Pack
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#B8889A' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or sample number..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2"
              style={{
                border: '1px solid #F4C2C2',
                backgroundColor: '#FFFFFF',
                color: '#3A3A3A',
              }}
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {brands.length > 0 && (
              <>
                <span className="text-xs py-1.5" style={{ color: '#B8889A' }}>Brand:</span>
                {brands.map((b) => (
                  <button
                    key={b as string}
                    onClick={() => setBrandFilter(brandFilter === b ? null : (b as string))}
                    className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                    style={{
                      backgroundColor: brandFilter === b ? '#F4C2C2' : '#FFFFFF',
                      color: brandFilter === b ? '#5A2D3E' : '#8B4B62',
                      border: `1px solid ${brandFilter === b ? '#E8A0A0' : '#F4C2C2'}`,
                    }}
                  >
                    {b as string}
                  </button>
                ))}
              </>
            )}
            {seasons.length > 0 && (
              <>
                <span className="text-xs py-1.5 ml-2" style={{ color: '#B8889A' }}>Season:</span>
                {seasons.map((s) => (
                  <button
                    key={s as string}
                    onClick={() => setSeasonFilter(seasonFilter === s ? null : (s as string))}
                    className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                    style={{
                      backgroundColor: seasonFilter === s ? '#F4C2C2' : '#FFFFFF',
                      color: seasonFilter === s ? '#5A2D3E' : '#8B4B62',
                      border: `1px solid ${seasonFilter === s ? '#E8A0A0' : '#F4C2C2'}`,
                    }}
                  >
                    {s as string}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Card Grid */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {filteredPacks.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: '#F4C2C2' }} />
            <p className="text-sm" style={{ color: '#8B4B62' }}>
              {store.savedPacks.length === 0
                ? 'No tech packs yet. Create your first one!'
                : 'No tech packs match your search.'}
            </p>
            {store.savedPacks.length === 0 && (
              <Button
                onClick={onNewTechPack}
                className="mt-4 rounded-xl"
                style={{ backgroundColor: '#F4C2C2', color: '#5A2D3E' }}
              >
                <Plus className="w-4 h-4 mr-2" /> Create Tech Pack
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPacks.map((pack: SavedTechPack) => {
              const isComplete = pack.data.stepStatuses.every((s) => s === 'completed');
              return (
                <div
                  key={pack.id}
                  onClick={() => onOpenTechPack(pack.id)}
                  className="rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #F4C2C2',
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: '#3A3A3A' }}>
                        {pack.data.sampleNumber || 'No sample #'}
                      </p>
                      <p className="text-xs truncate mt-0.5" style={{ color: '#8B4B62' }}>
                        {pack.name}
                      </p>
                    </div>
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full ml-2 shrink-0"
                      style={{
                        backgroundColor: isComplete ? '#E8F5E9' : '#FFF8E1',
                        color: isComplete ? '#2E7D32' : '#F57F17',
                      }}
                    >
                      {isComplete ? 'Complete' : 'Draft'}
                    </span>
                  </div>

                  <div className="flex gap-2 flex-wrap mb-3">
                    {pack.data.brand && pack.data.brand !== 'TBD' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FFF0F0', color: '#8B4B62' }}>
                        {pack.data.brand}
                      </span>
                    )}
                    {pack.data.category && pack.data.category !== 'TBD' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FFF0F0', color: '#8B4B62' }}>
                        {pack.data.category}
                      </span>
                    )}
                    {pack.data.season && pack.data.season !== 'TBD' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FFF0F0', color: '#8B4B62' }}>
                        {pack.data.season}
                      </span>
                    )}
                    {pack.data.garmentType && pack.data.garmentType !== 'TBD' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FFF0F0', color: '#8B4B62' }}>
                        {pack.data.garmentType}
                      </span>
                    )}
                  </div>

                  {/* Preview image */}
                  {pack.data.inspirationImages.length > 0 && (
                    <img
                      src={pack.data.inspirationImages[0]}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-xl mb-3"
                      style={{ border: '1px solid #F4C2C2' }}
                    />
                  )}

                  <div className="flex items-center justify-between">
                    <p className="text-[10px]" style={{ color: '#B8889A' }}>
                      {new Date(pack.updatedAt).toLocaleDateString()}
                    </p>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditTechPack(pack.id);
                        }}
                        className="p-1.5 rounded-lg transition-colors hover:bg-pink-50"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" style={{ color: '#8B4B62' }} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, pack.id)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" style={{ color: '#CC6666' }} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
