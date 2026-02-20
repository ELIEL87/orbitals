import { getOrbit } from './hexagon';
import { createRng, dateToSeed } from './rng';

// Pre-computed center layout templates (relative positions)
// Each template is an array of {q, r} offsets from origin
const TEMPLATES = {
  beginner: [
    // 1 center (single orbit)
    [{ q: 0, r: 0 }],
    [{ q: 0, r: 0 }],
    [{ q: 0, r: 0 }],
    [{ q: 0, r: 0 }],
  ],
  easy: [
    // 3 centers
    [{ q: 0, r: 0 }, { q: 2, r: 0 }, { q: 4, r: 0 }],
    [{ q: 0, r: 0 }, { q: 0, r: 2 }, { q: 0, r: 4 }],
    [{ q: 0, r: 0 }, { q: 2, r: 0 }, { q: -1, r: 3 }],
    [{ q: 0, r: 0 }, { q: 2, r: -2 }, { q: 0, r: 3 }],
  ],
  medium: [
    // 4 centers
    [{ q: 0, r: 0 }, { q: 2, r: 0 }, { q: 4, r: 0 }, { q: 2, r: 2 }],
    [{ q: 0, r: 0 }, { q: 2, r: 0 }, { q: 4, r: 0 }, { q: 2, r: -2 }],
    [{ q: 0, r: 0 }, { q: 0, r: 2 }, { q: 0, r: 4 }, { q: 2, r: 2 }],
    [{ q: 0, r: 0 }, { q: 2, r: 0 }, { q: 4, r: 0 }, { q: 4, r: -2 }],
  ],
  hard: [
    // 5 centers
    [{ q: 0, r: 0 }, { q: 2, r: 0 }, { q: 4, r: 0 }, { q: 2, r: 2 }, { q: 2, r: -2 }],
    [{ q: 0, r: 0 }, { q: 2, r: 0 }, { q: 4, r: 0 }, { q: 6, r: 0 }, { q: 4, r: -2 }],
    [{ q: 0, r: 0 }, { q: 2, r: 0 }, { q: 1, r: 2 }, { q: 3, r: 2 }, { q: 2, r: 4 }],
    [{ q: 0, r: 0 }, { q: 2, r: 0 }, { q: 4, r: 0 }, { q: 2, r: 2 }, { q: 4, r: 2 }],
  ],
  extreme: [
    // 6 centers
    [{ q: 2, r: 0 }, { q: 1, r: 2 }, { q: -1, r: 2 }, { q: -2, r: 0 }, { q: -1, r: -2 }, { q: 1, r: -2 }],
    [{ q: 0, r: 0 }, { q: 2, r: 0 }, { q: 4, r: 0 }, { q: 1, r: 2 }, { q: 3, r: 2 }, { q: 5, r: 2 }],
    [{ q: 0, r: 0 }, { q: 2, r: 0 }, { q: 4, r: 0 }, { q: 1, r: 2 }, { q: 3, r: 2 }, { q: 2, r: 4 }],
    [{ q: 0, r: 0 }, { q: 2, r: 0 }, { q: 1, r: 2 }, { q: 3, r: 2 }, { q: 0, r: 4 }, { q: 2, r: 4 }],
  ],
  insane: [
    // 7 centers
    // Flower: center hub surrounded by 6 neighbors all at distance 2
    [{ q: 0, r: 0 }, { q: 2, r: 0 }, { q: 0, r: 2 }, { q: -2, r: 2 }, { q: -2, r: 0 }, { q: 0, r: -2 }, { q: 2, r: -2 }],
    // 4+3 rectangular grid
    [{ q: 0, r: 0 }, { q: 2, r: 0 }, { q: 4, r: 0 }, { q: 6, r: 0 }, { q: 0, r: 2 }, { q: 2, r: 2 }, { q: 4, r: 2 }],
    // 3+2+2 expanding triangle
    [{ q: 0, r: 0 }, { q: 2, r: 0 }, { q: 4, r: 0 }, { q: 1, r: 2 }, { q: 3, r: 2 }, { q: 0, r: 4 }, { q: 2, r: 4 }],
    // 3+3+1 diamond
    [{ q: 0, r: 0 }, { q: 2, r: 0 }, { q: 4, r: 0 }, { q: 0, r: 2 }, { q: 2, r: 2 }, { q: 4, r: 2 }, { q: 2, r: 4 }],
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

// Place black hexagons in their solved positions (where they must end up)
function placeSolutionBlackHexagons(rng, centers, difficulty) {
  if (difficulty === 'beginner') return [];

  let count;
  switch (difficulty) {
    case 'easy': count = 2; break;
    case 'medium': count = rng.nextInt(2, 3); break;
    case 'hard': count = rng.nextInt(3, 5); break;
    case 'extreme': count = rng.nextInt(4, 6); break;
    case 'insane': count = rng.nextInt(5, 7); break;
    default: return [];
  }

  const centerSet = new Set(centers.map(c => `${c.q},${c.r}`));
  const orbits = centers.map(center => getOrbit(center.q, center.r, 1));

  // Collect all unique orbit positions (excluding centers)
  const posSet = new Set();
  orbits.forEach(orbit => {
    orbit.forEach(h => {
      const key = `${h.q},${h.r}`;
      if (!centerSet.has(key)) posSet.add(key);
    });
  });

  const candidates = rng.shuffle([...posSet].map(key => {
    const [q, r] = key.split(',').map(Number);
    return { q, r };
  }));

  const blackHexagons = [];
  for (const pos of candidates) {
    if (blackHexagons.length >= count) break;

    // Max 2 black hexagons per orbit (at least 4 number slots)
    let valid = true;
    for (let ci = 0; ci < centers.length; ci++) {
      const orbit = orbits[ci];
      if (!orbit.some(h => h.q === pos.q && h.r === pos.r)) continue;

      const blackInOrbit = orbit.filter(h =>
        blackHexagons.some(bh => bh.q === h.q && bh.r === h.r)
      ).length;
      if (blackInOrbit >= 2) {
        valid = false;
        break;
      }
    }

    if (valid) blackHexagons.push(pos);
  }

  return blackHexagons;
}

// Original solver for beginner difficulty (no target constraints)
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

// Solver with target sum constraints for non-beginner difficulties
// Target ranges force the correct number of black hexagons per orbit:
//   4 fillable slots (2 black): target in [6, 9]   (min with 5 slots = 10)
//   5 fillable slots (1 black): target in [10, 14]  (min with 6 slots = 15)
//   6 fillable slots (0 black): target in [15, 39]
function solvePuzzleWithTargets(centers, blackHexagons, rng) {
  const centerSet = new Set(centers.map(c => `${c.q},${c.r}`));
  const blackSet = new Set(blackHexagons.map(h => `${h.q},${h.r}`));

  // Count fillable slots per orbit and determine target range
  const orbitInfo = centers.map(center => {
    const orbit = getOrbit(center.q, center.r, 1);
    const fillable = orbit.filter(h => {
      const key = `${h.q},${h.r}`;
      return !centerSet.has(key) && !blackSet.has(key);
    }).length;

    let targetRange;
    if (fillable <= 4) targetRange = [6, 9];
    else if (fillable === 5) targetRange = [10, 14];
    else targetRange = [15, 39];

    return { fillable, targetRange };
  });

  // Pick random target sums from the exclusive ranges
  const targets = orbitInfo.map(info =>
    rng.nextInt(info.targetRange[0], info.targetRange[1])
  );

  // Build position map
  const posMap = new Map();
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
  positions.sort((a, b) => b.orbits.length - a.orbits.length);

  const numCenters = centers.length;
  const orbitUsed = Array.from({ length: numCenters }, () => new Set());
  const orbitSum = new Array(numCenters).fill(0);
  const orbitRemaining = orbitInfo.map(info => info.fillable);
  const assignment = new Array(positions.length).fill(null);
  const digitOrders = positions.map(() => rng.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));

  function backtrack(idx) {
    if (idx === positions.length) {
      return targets.every((target, ci) => orbitSum[ci] === target);
    }

    const pos = positions[idx];
    const digits = digitOrders[idx];

    for (const d of digits) {
      // Check digit availability in all orbits
      let ok = true;
      for (const oi of pos.orbits) {
        if (orbitUsed[oi].has(d)) { ok = false; break; }
      }
      if (!ok) continue;

      // Pruning: check if target is still achievable
      let feasible = true;
      for (const oi of pos.orbits) {
        const newSum = orbitSum[oi] + d;
        const newRemaining = orbitRemaining[oi] - 1;

        if (newRemaining === 0) {
          if (newSum !== targets[oi]) { feasible = false; break; }
        } else {
          // Available digits for this orbit after placing d
          const available = [];
          for (let i = 0; i <= 9; i++) {
            if (!orbitUsed[oi].has(i) && i !== d) available.push(i);
          }
          if (available.length < newRemaining) { feasible = false; break; }

          // Min remaining = sum of smallest available digits
          // Max remaining = sum of largest available digits
          let minR = 0, maxR = 0;
          for (let i = 0; i < newRemaining; i++) minR += available[i];
          for (let i = 0; i < newRemaining; i++) maxR += available[available.length - 1 - i];

          if (newSum + minR > targets[oi] || newSum + maxR < targets[oi]) {
            feasible = false; break;
          }
        }
      }
      if (!feasible) continue;

      // Place digit
      assignment[idx] = d;
      for (const oi of pos.orbits) {
        orbitUsed[oi].add(d);
        orbitSum[oi] += d;
        orbitRemaining[oi]--;
      }

      if (backtrack(idx + 1)) return true;

      // Undo
      assignment[idx] = null;
      for (const oi of pos.orbits) {
        orbitUsed[oi].delete(d);
        orbitSum[oi] -= d;
        orbitRemaining[oi]++;
      }
    }

    return false;
  }

  if (!backtrack(0)) return null;

  return centers.map((center, ci) => ({
    q: center.q, r: center.r, target: targets[ci],
  }));
}

// Scramble black hexagons by applying random orbit rotations
// This guarantees solvability (player can undo the rotations)
function scrambleBlackHexagons(centers, solvedBlackHexagons, rng) {
  if (solvedBlackHexagons.length === 0) return [];

  let blackSet = new Set(solvedBlackHexagons.map(h => `${h.q},${h.r}`));
  const solvedSet = new Set(solvedBlackHexagons.map(h => `${h.q},${h.r}`));

  const numRotations = rng.nextInt(3, 8);

  for (let i = 0; i < numRotations; i++) {
    const centerIdx = rng.nextInt(0, centers.length - 1);
    const center = centers[centerIdx];
    const orbit = getOrbit(center.q, center.r, 1);

    // Read current isBlack for each position in this orbit
    const isBlackArr = orbit.map(h => blackSet.has(`${h.q},${h.r}`));
    // Rotate by 1 position (matches game's rotation direction)
    const rotated = orbit.map((_, idx) => isBlackArr[(idx + 1) % 6]);

    // Write back
    orbit.forEach((h, idx) => {
      const key = `${h.q},${h.r}`;
      if (rotated[idx]) blackSet.add(key);
      else blackSet.delete(key);
    });
  }

  // Verify scrambled positions differ from solved
  let isDifferent = blackSet.size !== solvedSet.size;
  if (!isDifferent) {
    for (const key of blackSet) {
      if (!solvedSet.has(key)) { isDifferent = true; break; }
    }
  }

  // If still the same, force one more rotation on an orbit with black hexagons
  if (!isDifferent) {
    for (const center of centers) {
      const orbit = getOrbit(center.q, center.r, 1);
      const isBlackArr = orbit.map(h => blackSet.has(`${h.q},${h.r}`));
      if (isBlackArr.some(b => b) && !isBlackArr.every(b => b)) {
        const rotated = orbit.map((_, idx) => isBlackArr[(idx + 1) % 6]);
        orbit.forEach((h, idx) => {
          const key = `${h.q},${h.r}`;
          if (rotated[idx]) blackSet.add(key);
          else blackSet.delete(key);
        });
        break;
      }
    }
  }

  return [...blackSet].map(key => {
    const [q, r] = key.split(',').map(Number);
    return { q, r };
  });
}

function generatePuzzle(rng, difficulty) {
  const maxRetries = 30;
  for (let i = 0; i < maxRetries; i++) {
    const centerPositions = placeCenters(rng, difficulty);

    if (difficulty === 'beginner') {
      const centers = solvePuzzle(centerPositions, [], rng);
      if (centers) return { centers, blackHexagons: [] };
    } else {
      const solvedBlackHexagons = placeSolutionBlackHexagons(rng, centerPositions, difficulty);
      const centers = solvePuzzleWithTargets(centerPositions, solvedBlackHexagons, rng);
      if (centers) {
        const blackHexagons = scrambleBlackHexagons(centerPositions, solvedBlackHexagons, rng);
        return { centers, blackHexagons };
      }
    }
  }

  // Fallback: simple single-orbit puzzle
  return {
    centers: [{ q: 0, r: 0, target: 15 }],
    blackHexagons: [],
  };
}

export function generateDailyPuzzle(dateString) {
  const seed = dateToSeed(dateString);
  const rng = createRng(seed);
  return generatePuzzle(rng, 'extreme');
}

export function generateFreePlayPuzzle(difficulty) {
  const seed = (Math.random() * 4294967296) | 0;
  const rng = createRng(seed);
  return generatePuzzle(rng, difficulty);
}

const TUTORIAL_SEEDS = [42, 137, 256];

export function generateTutorialPuzzle(level) {
  const rng = createRng(TUTORIAL_SEEDS[level]);
  const difficulties = ['beginner', 'easy', 'medium'];
  return generatePuzzle(rng, difficulties[level]);
}
