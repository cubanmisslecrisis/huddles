import type mapboxgl from "mapbox-gl"

export function attachRotateGesture(
  map: mapboxgl.Map,
  gestureActiveRef: { current: boolean },
  onGestureEnd: () => void
) {
  const canvas = map.getCanvas()
  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

  const ROTATE_SENSITIVITY = 0.4
  const PITCH_SENSITIVITY = 0.45
  const MAX_PITCH = 75

  let rotating = false
  let lastX = 0
  let lastY = 0
  let lastT = 0
  let bearingVelocity = 0

  const onPointerDown = (e: PointerEvent) => {
    if (!e.shiftKey || e.button !== 0) return
    rotating = true
    gestureActiveRef.current = true
    lastX = e.clientX
    lastY = e.clientY
    lastT = e.timeStamp
    bearingVelocity = 0
    map.stop()
    map.dragPan.disable()
    canvas.style.cursor = "grabbing"
    canvas.setPointerCapture(e.pointerId)
    e.preventDefault()
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!rotating) return
    const dx = e.clientX - lastX
    const dy = e.clientY - lastY
    const dt = Math.max(1, e.timeStamp - lastT)

    const dBearing = -dx * ROTATE_SENSITIVITY
    bearingVelocity = dBearing / dt

    map.setBearing(map.getBearing() + dBearing)
    map.setPitch(clamp(map.getPitch() - dy * PITCH_SENSITIVITY, 0, MAX_PITCH))

    lastX = e.clientX
    lastY = e.clientY
    lastT = e.timeStamp
    e.preventDefault()
  }

  const finishGesture = () => {
    gestureActiveRef.current = false
    onGestureEnd()
  }

  const endRotate = (e: PointerEvent) => {
    if (!rotating) return
    rotating = false
    canvas.style.cursor = ""
    try {
      canvas.releasePointerCapture(e.pointerId)
    } catch {
      // pointer may already be released
    }
    map.dragPan.enable()

    const idleMs = e.timeStamp - lastT
    if (idleMs < 60 && Math.abs(bearingVelocity) > 0.02) {
      const projected = clamp(bearingVelocity * 220, -140, 140)
      map.easeTo({
        bearing: map.getBearing() + projected,
        duration: 700,
        easing: (t) => 1 - Math.pow(1 - t, 3),
      })
      map.once("moveend", finishGesture)
    } else {
      finishGesture()
    }
    bearingVelocity = 0
  }

  canvas.addEventListener("pointerdown", onPointerDown)
  canvas.addEventListener("pointermove", onPointerMove)
  canvas.addEventListener("pointerup", endRotate)
  canvas.addEventListener("pointercancel", endRotate)

  return () => {
    canvas.removeEventListener("pointerdown", onPointerDown)
    canvas.removeEventListener("pointermove", onPointerMove)
    canvas.removeEventListener("pointerup", endRotate)
    canvas.removeEventListener("pointercancel", endRotate)
    map.dragPan.enable()
  }
}
