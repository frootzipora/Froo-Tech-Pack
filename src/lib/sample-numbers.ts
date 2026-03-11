// Simple sequential sample number assignment
// In production, this would be backed by a database

const STORAGE_KEY = 'techpack_sample_counter';

export function getNextSampleNumber(): string {
  if (typeof window === 'undefined') return 'B200';

  const current = parseInt(localStorage.getItem(STORAGE_KEY) || '199', 10);
  const next = current + 1;
  localStorage.setItem(STORAGE_KEY, next.toString());
  return `B${next}`;
}

export function getCurrentCounter(): number {
  if (typeof window === 'undefined') return 199;
  return parseInt(localStorage.getItem(STORAGE_KEY) || '199', 10);
}
