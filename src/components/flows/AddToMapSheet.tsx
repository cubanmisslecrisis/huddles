import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { brandColor } from '@/lib/theme';
import { FlowSheet } from '@/components/flows/FlowSheet';
import { useSpacetimeDB } from 'spacetimedb/react';
import { DbConnection } from '@/module_bindings';

export function AddToMapSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [placeName, setPlaceName] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getConnection } = useSpacetimeDB();

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setPlaceName('');
      setNote('');
      setError(null);
    }
    onOpenChange(isOpen);
  };

  const handleSavePlace = async () => {
    if (!placeName.trim()) {
      setError('Place name cannot be empty');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const conn = getConnection() as DbConnection | null;
      if (!conn) throw new Error('Not connected to database');

      await conn.reducers.savePlace({
        placeName: placeName.trim(),
        note: note.trim() || undefined
      });
      handleOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save place';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const color = brandColor('blue');

  return (
    <FlowSheet open={open} onOpenChange={handleOpenChange} title="Add to map">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ background: `color-mix(in oklab, ${color} 18%, transparent)` }}
          >
            <MapPin className="h-5 w-5" style={{ color }} />
          </span>
          <div className="min-w-0 flex-1">
            <span className="block text-sm font-bold">Save a place</span>
            <span className="block text-xs font-medium text-muted-foreground">Mark a location on the map</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground">Place name *</label>
          <input
            type="text"
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
            placeholder="e.g., Coffee House, Pizza Palace, Park"
            className="w-full rounded-2xl border border-border bg-card px-3 py-2 font-normal text-sm focus:outline-none focus:ring-2 focus:ring-blue"
            disabled={isSubmitting}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground">Note (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Why are you saving this place?"
            className="w-full rounded-2xl border border-border bg-card p-3 font-normal text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue"
            rows={3}
            disabled={isSubmitting}
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          onClick={handleSavePlace}
          disabled={isSubmitting || !placeName.trim()}
          className="w-full rounded-2xl bg-blue px-4 py-3 font-bold text-white transition hover:brightness-105 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Save Place'}
        </button>
      </div>
    </FlowSheet>
  );
}
