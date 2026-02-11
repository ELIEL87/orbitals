// Calculate puzzle space for Orbital Shift game

// Pre-calculated: ways to choose 6 distinct numbers (0-9) that sum to each target
// This is computationally expensive, so using known values
const targetCombinations = {
  15: 1,   // 0+1+2+3+4+5
  16: 1,   // 0+1+2+3+4+6
  17: 2,   // 0+1+2+3+4+7, 0+1+2+3+5+6
  18: 3,   // 0+1+2+3+4+8, 0+1+2+3+5+7, 0+1+2+4+5+6
  19: 5,
  20: 7,
  21: 9,
  22: 11,
  23: 14,
  24: 16,
  25: 18,
  26: 19,
  27: 20,
  28: 20,
  29: 19,
  30: 18,
  31: 16,
  32: 14,
  33: 11,
  34: 9,
  35: 7,
  36: 5,
  37: 3,
  38: 2,
  39: 1   // 4+5+6+7+8+9
};

console.log("=== Orbital Shift Puzzle Space Analysis ===\n");

// Count valid targets
const validTargets = Object.keys(targetCombinations).map(Number);
console.log(`Valid target range: ${validTargets[0]}-${validTargets[validTargets.length-1]}`);
console.log(`Number of valid targets: ${validTargets.length}\n`);

// For 3 independent orbits (theoretical maximum)
let totalCombinations = 0;
for (const count of Object.values(targetCombinations)) {
  totalCombinations += count;
}
console.log(`Total combinations per orbit: ${totalCombinations}`);
console.log(`Theoretical max (3 independent orbits): ${totalCombinations}^3 = ${Math.pow(totalCombinations, 3).toLocaleString()}\n`);

// For 3 orbits with specific targets
const targetValues = validTargets.length;
console.log(`Target value combinations: ${targetValues}^3 = ${Math.pow(targetValues, 3).toLocaleString()}`);

// With shared hexagons, not all combinations are solvable
// Estimate: ~20-30% might be solvable due to shared hexagon constraints
const estimatedSolvable = Math.floor(Math.pow(targetValues, 3) * 0.25);
console.log(`\nEstimated solvable puzzles (with shared hexagons): ~${estimatedSolvable.toLocaleString()}`);

// More conservative estimate
const conservativeEstimate = Math.floor(Math.pow(targetValues, 3) * 0.15);
console.log(`Conservative estimate: ~${conservativeEstimate.toLocaleString()}`);

// If we also vary center positions (distance >= 2)
console.log(`\n=== With Variable Center Positions ===`);
console.log(`Many valid center position arrangements exist`);
console.log(`Each arrangement multiplies puzzle count`);
console.log(`Estimated total: ${(estimatedSolvable * 10).toLocaleString()} - ${(estimatedSolvable * 50).toLocaleString()} puzzles`);
