/** Shared surface styles — keeps Huddles' rounded, soft (claymorphic) UI consistent across
 * the hand-rolled flow sheets, inputs, and overlays. Plain class strings; no shadcn/base-ui. */

export const huddleOverlay = 'bg-black/30 supports-backdrop-filter:backdrop-blur-sm';

export const huddlePopover = 'rounded-2xl border-0 bg-popover p-1.5 shadow-clay ring-0';

export const huddleDialog = 'max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl ring-0 sm:max-w-md';

export const huddleInput = 'h-12 rounded-2xl border-border bg-card px-4 text-sm shadow-sm focus-visible:ring-ring/30';

export const huddleMenuItem = 'rounded-xl px-2.5 py-2 font-semibold';
