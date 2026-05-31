/** Degrees per slice for a wheel with `count` segments. */
export function sliceDegrees(count: number): number {
  return 360 / count;
}

/** Normalize any angle to [0, 360). */
export function normalizeDegrees(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

/**
 * Which slice index sits under the top pointer at `angle` degrees.
 * Matches Draw.tsx canvas geometry: slices start at top after -90° offset.
 */
export function indexAtPointer(angle: number, count: number): number {
  const slice = sliceDegrees(count);
  const normalized = normalizeDegrees(angle);
  const iFloat = (-normalized - slice / 2) / slice;
  const idx = Math.round(iFloat);
  return ((idx % count) + count) % count;
}

/**
 * Cumulative rotation (degrees) so slice `index` center aligns with the top pointer.
 * Includes extra full spins for animation flair.
 */
export function targetAngleForIndex(
  index: number,
  count: number,
  currentAngle: number,
  extraSpins = 8,
): number {
  const slice = sliceDegrees(count);
  const centerAngle = index * slice + slice / 2;
  const targetMod = normalizeDegrees(360 - centerAngle);
  const currentMod = normalizeDegrees(currentAngle);
  let delta = targetMod - currentMod;
  if (delta <= 0) delta += 360;
  return currentAngle + 360 * extraSpins + delta;
}
