/**
 * Shared UI tokens — typography, surfaces, elevation, and radius.
 *
 * ## Typography (Geist Sans)
 *
 * Root layout sets `font-sans` on `html`/`body`. Pick a `type*` token by role (see exports below).
 *
 * ## Colors
 *
 * See `lib/theme.ts` for access rules. Use `brandColor()` in config/inline styles;
 * use Tailwind brand utilities (`bg-red`, `text-warmth`) in static classNames.
 *
 * ## Elevation
 *
 * | Token | Use for |
 * |-------|---------|
 * | `shadowClay` | Clay panels, buttons, search bar (`shadow-clay` + `--clay-color`) |
 * | `shadowFloatSm` | Compact floating pills (filter chips) |
 * | `shadowFloat` | Map markers, popover rows |
 * | `shadowFloatMd` | Marker chips; chip hover |
 * | `shadowFloatLg` | Nav island, FAB chrome |
 * | `shadowFloatSoft` | Map canvas frame |
 * | `shadowPopover` | Cluster popover |
 * | `shadowSheetUp` | Bottom sheet |
 * | `shadowBrandRed` | Red FAB glow |
 *
 * Use **clay** for interactive app chrome and person / huddle / image map markers;
 * use **float** for other map overlays and floating UI.
 *
 * ## Radius
 *
 * | Token | Use for |
 * |-------|---------|
 * | `radiusControl` | Buttons, inputs, list rows |
 * | `radiusSurface` | Panels, cards, search bar |
 * | `radiusShell` | Map canvas, dialogs |
 * | `radiusSheet` | Bottom sheet / mobile dialog top |
 * | `radiusIsland` | Floating bottom nav pill |
 * | `radiusThumb` | Map content thumbnails |
 *
 * ## Surfaces
 *
 * | Token | Use for |
 * |-------|---------|
 * | `claySurfaceVar` | Default clay `--clay-color` on borders |
 * | `huddlePanel` | Side panel cards |
 * | `huddleSheet` | Bottom sheet container |
 * | `huddlePopoverFloat` | Map cluster popover |
 * | `huddleMapCanvas` | Desktop map frame |
 * | `huddleSearchBar` | Clay search shell |
 * | `huddleSelectableRow` | Clickable list row hover/focus |
 */

export const typePanelTitle = "text-2xl font-bold text-foreground"
export const typeEntityName = "text-xl font-bold text-foreground"
export const typeSectionLabel = "text-sm font-semibold uppercase tracking-wide text-foreground"
export const typeSectionLabelLg = "text-base font-semibold uppercase tracking-wide text-foreground"
export const typeSectionLabelMuted = "text-xs font-semibold uppercase tracking-wide text-muted-foreground"

export const typeListTitle = "text-sm font-bold text-foreground"
export const typeListSubtitle = "truncate text-sm text-foreground"
export const typeListMeta = "mt-0.5 text-xs text-muted-foreground"
export const typeMetaStrong = "text-xs font-semibold text-muted-foreground"

export const typeBodyStrong = "text-sm font-semibold text-foreground"
export const typeBody = "text-sm text-foreground"
export const typeBodyMuted = "text-sm text-muted-foreground"
export const typePanelMeta = "text-sm font-semibold text-muted-foreground"
export const typeEmptyState = "text-sm font-bold text-foreground"

export const typeTabLabel = "text-xs font-bold"
export const typeNavLabel = "text-xs font-bold"

export const typeMarkerEyebrow = "text-[10px] font-semibold uppercase tracking-wide"
export const typeMarkerTitle = "text-sm font-bold leading-tight"
export const typeMarkerMeta = "text-xs font-semibold"
export const typeMarkerChip = "text-xs font-bold"
export const typeMarkerBadge = "text-[10px] font-bold text-foreground"

export const typeActionPill = "text-sm font-bold"
export const typeChipLabel = "text-sm font-bold"
export const typeLinkAction = "text-sm font-bold text-muted-foreground"
export const typeButton = "text-sm font-semibold"
export const typeButtonBold = "font-bold"
export const typePopoverSection = "text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
export const typeAvatarOverflow = "text-xs font-bold text-foreground"

export const shadowClay = "shadow-clay"
export const shadowFloatSm = "shadow-float-sm"
export const shadowFloat = "shadow-float"
export const shadowFloatMd = "shadow-float-md"
export const shadowFloatLg = "shadow-float-lg"
export const shadowFloatSoft = "shadow-float-soft"
export const shadowPopover = "shadow-popover"
export const shadowSheetUp = "shadow-sheet-up"
export const shadowBrandRed = "shadow-brand-red"

export const radiusControl = "rounded-xl"
export const radiusSurface = "rounded-2xl"
export const radiusShell = "rounded-3xl"
export const radiusSheet = "rounded-t-[var(--radius-sheet)]"
export const radiusIsland = "rounded-[var(--radius-island)]"
export const radiusThumb = "rounded-[14px]"

export const claySurfaceVar = "[--clay-color:var(--color-border)]"

export const huddleOverlay =
  "bg-black/30 supports-backdrop-filter:backdrop-blur-sm"

export const huddlePopover =
  `${radiusSurface} border-0 bg-popover p-1.5 ${shadowClay} ring-0 ${claySurfaceVar}`

export const huddleDialog =
  `max-w-md ${radiusShell} border border-border bg-card p-6 shadow-2xl ring-0 sm:max-w-md`

export const huddleInput =
  `h-12 ${radiusSurface} border-border bg-card px-4 text-sm shadow-sm focus-visible:ring-ring/30`

export const huddleMenuItem = `${radiusControl} px-2.5 py-2 ${typeBodyStrong}`

export const huddlePanel =
  `flex h-full min-h-0 flex-col ${radiusSurface} border-0 bg-card p-4 ${shadowClay} ${claySurfaceVar}`

export const huddleSheet =
  `pointer-events-auto absolute inset-x-0 bottom-0 flex flex-col ${radiusSheet} border border-border bg-card ${shadowSheetUp}`

export const huddlePopoverFloat =
  `absolute bottom-full left-1/2 z-30 mb-2 w-52 -translate-x-1/2 ${radiusSurface} border border-border bg-card p-2 ${shadowPopover}`

export const huddleMapCanvas =
  `${radiusShell} border border-border ${shadowFloatSoft}`

export const huddleSearchBar =
  `relative flex items-center bg-card border-0 ${radiusSurface} h-12 pl-4 pr-2.5 ${shadowClay} ${claySurfaceVar} transition-all duration-300 huddle-search-container`

export const huddleSelectableRow =
  `${radiusControl} outline-none transition hover:bg-secondary focus-visible:bg-secondary`
