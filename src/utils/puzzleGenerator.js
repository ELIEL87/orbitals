import { getOrbit, hexDistance } from './hexagon';
import { createRng, dateToSeed } from './rng';

// Pre-computed center layout templates (relative positions)
// Each template is an array of {q, r} offsets from origin
const TEMPLATES = {
  easy: [
    // 2 centers, distance >= 3 (no orbit overlap)
    [{ q: 0, r: 0 }, { q: 3, r: 0 }],
    [{ q: 0, r: 0 }, { q: 0, r: 3 }],
    [{ q: 0, r: 0 }, { q: 3, r: -3 }],
    [{ q: 0, r: 0 }, { q: -3, r: 3 }],
  ],
  medium: [
    // 3 centers, mix of distance 2 and 3
    [{ q: 0, r: 0 }, { q: 2, r: 0 }, { q: 4, r: 0 }],
    [{ q: 0, r: 0 }, { q: 0, r: 2 }, { q: 0, r: 4 }],
    [{ q: 0, r: 0 }, { q: 2, r: 0 }, { q: -1, r: 3 }],
    [{ q: 0, r: 0 }, { q: 2, r: -2 }, { q: 0, r: 3 }],
  ],
  hard: [
    // 3 centers, all pairs distance 2 (maximum overlap)
    [{ q: 0, r: 0 }, { q: 2, r: 0 }, { q: 1, r: 2 }],
    [{ q: 0, r: 0 }, { q: 0, r: 2 }, { q: 2, r: 0 }],
    [{ q: 0, r: 0 }, { q: 2, r: -2 }, { q: 2, r: 0 }],
    [{ q: 0, r: 0 }, { q: -2, r: 2 }, { q: 0, r: 2 }],
  ],
};

function placeCenters(rng, difficulty) {
  const templates = TEMPLATES[difficulty];
  const template = templates[rng.nextInt(0, templates.length - 1)];

  // Apply a random offset to shift the cluster
  const offsetQ = rng.nextInt(-1, 1);
  const offsetR = rng.nextInt(-1, 1);

  return template.map(c => ({
    q: c.q + offsetQ,
    r: c.r + offsetR,
  }));
}

function placeBlackHexagons(rng, centers, difficulty) {
  if (difficulty === 'easy') return [];

  // Collect all orbit positions (excluding center positions)
  const centerSet = new Set(centers.map(c => `${c.q},${c.r}`));
  const orbitPositions = [];
  const posSet = new Set();

  centers.forEach(center => {
    const orbit = getOrbit(center.q, center.r, 1);
    orbit.forEach(h => {
      const key = `${h.q},${h.r}`;
      if (!centerSet.has(key) && !posSet.has(key)) {
        posSet.add(key);
        orbitPositions.push(h);
      }
    });
  });

  const count = difficulty === 'hard' ? rng.nextInt(1, 2) : rng.nextInt(0, 1);
  if (count === 0) return [];

  const shuffled = rng.shuffle(orbitPositions);
  const blackHexagons = [];

  for (const pos of shuffled) {
    if (blackHexagons.length >= count) break;

    // Ensure we don't block too many positions in any single orbit
    // (need at least 3 fillable positions per orbit for a meaningful puzzle)
    let valid = true;
    for (const center of centers) {
      const orbit = getOrbit(center.q, center.r, 1);
      const orbitBlackCount = orbit.filter(h =>
        blackHexagons.some(bh => bh.q === h.q && bh.r === h.r) ||
        (h.q === pos.q && h.r === pos.r) ||
        centerSet.has(`${h.q},${h.r}`)
      ).length;
      // At most 2 non-fillable positions per orbit (center counts as non-fillable in orbit)
      // Actually centers aren't in their own orbit ring, so just check black count
      const blackInOrbit = orbit.filter(h =>
        blackHexagons.some(bh => bh.q === h.q && bh.r === h.r) ||
        (h.q === pos.q && h.r === pos.r)
      ).length;
      if (blackInOrbit > 2) {
        valid = false;
        break;
      }
    }

    if (valid) {
      blackHexagons.push(pos);
    }
  }

  return blackHexagons;
}

function solvePuzzle(centers, blackHexagons, rng) {
  const centerSet = new Set(centers.map(c => `${c.q},${c.r}`));
  const blackSet = new Set(blackHexagons.map(h => `${h.q},${h.r}`));

  // Collect all unique fillable positions
  const posMap = new Map(); // key -> { q, r, orbits: [centerIndex, ...] }
  centers.forEach((center, ci) => {
    const orbit = getOrbit(center.q, center.r, 1);
    orbit.forEach(h => {
      const key = `${h.q},${h.r}`;
      if (centerSet.has(key) || blackSet.has(key)) return;
      if (!posMap.has(key)) {
        posMap.set(key, { q: h.q, r: h.r, orbits: [] });
      }
      posMap.get(key).orbits.push(ci);
    });
  });

  const positions = [...posMap.values()];
  // Sort by most constrained first (positions in more orbits first) for faster backtracking
  positions.sort((a, b) => b.orbits.length - a.orbits.length);

  const numCenters = centers.length;
  // Track which digits are used in each orbit
  const orbitUsed = Array.from({ length: numCenters }, () => new Set());
  const assignment = new Array(positions.length).fill(null);

  // Shuffled digits for each position (randomizes the solution)
  const digitOrders = positions.map(() => rng.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));

  function backtrack(idx) {
    if (idx === positions.length) return true;

    const pos = positions[idx];
    const digits = digitOrders[idx];

    for (const d of digits) {
      // Check if digit is available in all orbits this position belongs to
      let ok = true;
      for (const oi of pos.orbits) {
        if (orbitUsed[oi].has(d)) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;

      // Place digit
      assignment[idx] = d;
      for (const oi of pos.orbits) orbitUsed[oi].add(d);

      if (backtrack(idx + 1)) return true;

      // Undo
      assignment[idx] = null;
      for (const oi of pos.orbits) orbitUsed[oi].delete(d);
    }

    return false;
  }

  if (!backtrack(0)) return null;

  // Build value map
  const values = {};
  positions.forEach((pos, i) => {
    values[`${pos.q},${pos.r}`] = assignment[i];
  });

  // Compute targets
  const centersWithTargets = centers.map((center, ci) => {
    const orbit = getOrbit(center.q, center.r, 1);
    let sum = 0;
    orbit.forEach(h => {
      const key = `${h.q},${h.r}`;
      if (values[key] !== undefined) {
        sum += values[key];
      }
    });
    return { q: center.q, r: center.r, target: sum };
  });

  return centersWithTargets;
}

function generatePuzzle(rng, difficulty) {
  const maxRetries = 20;
  for (let i = 0; i < maxRetries; i++) {
    const centerPositions = placeCenters(rng, difficulty);
    const blackHexagons = placeBlackHexagons(rng, centerPositions, difficulty);
    const centers = solvePuzzle(centerPositions, blackHexagons, rng);

    if (centers) {
      return { centers, blackHexagons };
    }
  }

  // Fallback: return a known-good puzzle
  return {
    centers: [
      { q: 0, r: 0, target: 15 },
      { q: 2, r: 0, target: 20 },
      { q: 1, r: 2, target: 18 },
    ],
    blackHexagons: [{ q: 1, r: 0 }],
  };
}

export function generateDailyPuzzle(dateString) {
  const seed = dateToSeed(dateString);
  const rng = createRng(seed);
  return generatePuzzle(rng, 'medium');
}

export function generateFreePlayPuzzle(difficulty) {
  const seed = (Math.random() * 4294967296) | 0;
  const rng = createRng(seed);
  return generatePuzzle(rng, difficulty);
}
