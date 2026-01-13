// Hexagon grid utilities
export const HEX_SIZE = 40; // Size of hexagon (radius)
export const HEX_WIDTH = HEX_SIZE * 2;
export const HEX_HEIGHT = Math.sqrt(3) * HEX_SIZE;

// Convert hex coordinates to pixel coordinates
export function hexToPixel(q, r) {
  const x = HEX_SIZE * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const y = HEX_SIZE * ((3 / 2) * r);
  return { x, y };
}

// Get all neighbors of a hexagon (6 directions)
export function getNeighbors(q, r) {
  return [
    { q: q + 1, r: r },     // East
    { q: q + 1, r: r - 1 }, // Northeast
    { q: q, r: r - 1 },     // Northwest
    { q: q - 1, r: r },     // West
    { q: q - 1, r: r + 1 }, // Southwest
    { q: q, r: r + 1 },     // Southeast
  ];
}

// Get hexagons in orbit (ring) around a center hex
export function getOrbit(centerQ, centerR, radius) {
  if (radius === 0) return [{ q: centerQ, r: centerR }];
  
  const hexes = [];
  
  // For radius 1, just return the 6 neighbors
  if (radius === 1) {
    return getNeighbors(centerQ, centerR);
  }
  
  // For larger radii, walk around the ring
  // Start at the rightmost hexagon of the ring
  let q = centerQ + radius;
  let r = centerR;
  
  // Directions for walking around a hexagon ring (clockwise from right)
  const directions = [
    { dq: -1, dr: 0 },   // Left
    { dq: -1, dr: 1 },   // Down-left  
    { dq: 0, dr: 1 },    // Down-right
    { dq: 1, dr: 0 },    // Right
    { dq: 1, dr: -1 },   // Up-right
    { dq: 0, dr: -1 },   // Up-left
  ];
  
  // Walk around the ring
  for (let side = 0; side < 6; side++) {
    for (let step = 0; step < radius; step++) {
      hexes.push({ q, r });
      if (step < radius - 1) {
        q += directions[side].dq;
        r += directions[side].dr;
      }
    }
    // Move to the next corner
    if (side < 5) {
      q += directions[side].dq;
      r += directions[side].dr;
    }
  }
  
  return hexes;
}

// Calculate distance between two hexagons
export function hexDistance(q1, r1, q2, r2) {
  return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
}
