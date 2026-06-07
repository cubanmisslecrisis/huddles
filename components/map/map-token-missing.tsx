import { typeBodyStrong } from "@/lib/ui-styles"

export function MapTokenMissing() {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-secondary p-6 text-center">
      <p className={`max-w-sm ${typeBodyStrong}`}>
        Add your Mapbox token as{" "}
        <code className="rounded bg-card px-1.5 py-0.5 text-xs">NEXT_PUBLIC_MAPBOX_TOKEN</code> to load the 3D map.
      </p>
    </div>
  )
}
