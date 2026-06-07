import { useState } from 'react';
import { StickyNote } from 'lucide-react';
import { brandColor } from '@/lib/theme';
import { FlowSheet } from '@/components/flows/FlowSheet';
import { useSpacetimeDB } from 'spacetimedb/react';
import { DbConnection } from '@/module_bindings';

export function AddToMapSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [noteText, setNoteText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getConnection } = useSpacetimeDB();

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setNoteText('');
      setError(null);
    }
    onOpenChange(isOpen);
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) {
      setError('Note cannot be empty');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const conn = getConnection() as DbConnection | null;
      if (!conn) throw new Error('Not connected to database');

      await conn.reducers.addNote({ text: noteText });
      handleOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add note';
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
            <StickyNote className="h-5 w-5" style={{ color }} />
          </span>
          <div className="min-w-0 flex-1">
            <span className="block text-sm font-bold">Add a note</span>
            <span className="block text-xs font-medium text-muted-foreground">Drop a note on the map</span>
          </div>
        </div>

        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full rounded-2xl border border-border bg-card p-3 font-normal text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue"
          rows={4}
          disabled={isSubmitting}
        />

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          onClick={handleAddNote}
          disabled={isSubmitting || !noteText.trim()}
          className="w-full rounded-2xl bg-blue px-4 py-3 font-bold text-white transition hover:brightness-105 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Save Note'}
        </button>
      </div>
    </FlowSheet>
  );
}
