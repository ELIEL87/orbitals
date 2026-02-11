// Calculate puzzle space with "black hexagons" (unfillable positions)

console.log("=== Orbital Shift Puzzle Space with Black Hexagons ===\n");

// Without black hexagons: always 6 positions, targets 15-39
console.log("Current setup (6 positions per orbit):");
console.log("Valid targets: 15-39 (25 values)");
console.log("Combinations per orbit: 251\n");

// With black hexagons: variable positions (1-6 positions per orbit)
console.log("With black hexagons (1-6 positions per orbit):\n");

const positionCounts = {};

// For each number of positions (1-6)
for (let positions = 1; positions <= 6; positions++) {
  const minSum = Array.from({length: positions}, (_, i) => i).reduce((a, b) => a + b, 0);
  const maxSum = Array.from({length: positions}, (_, i) => 9 - i).reduce((a, b) => a + b, 0);
  
  // Count combinations for each target in range
  let validTargets = 0;
  let totalCombinations = 0;
  
  // Estimate combinations (simplified calculation)
  for (let target = minSum; target <= maxSum; target++) {
    // Rough estimate: more combinations in middle range
    const combinations = Math.max(1, Math.floor((maxSum - minSum + 1) / 2));
    if (combinations > 0) {
      validTargets++;
      totalCombinations += combinations;
    }
  }
  
  positionCounts[positions] = {
    minSum,
    maxSum,
    validTargets,
    estimatedCombinations: totalCombinations
  };
  
  console.log(`${positions} position(s):`);
  console.log(`  Target range: ${minSum}-${maxSum}`);
  console.log(`  Valid targets: ${validTargets}`);
  console.log(`  Estimated combinations: ~${totalCombinations}`);
  console.log();
}

// Calculate total puzzle space
console.log("=== Puzzle Space Comparison ===\n");

// Current: 25^3 = 15,625 target combinations
const currentTargetCombos = Math.pow(25, 3);
console.log(`Current (6 positions, fixed): ${currentTargetCombos.toLocaleString()} target combinations`);

// With black hexagons: sum of all position combinations
let totalWithBlack = 0;
for (let pos1 = 1; pos1 <= 6; pos1++) {
  for (let pos2 = 1; pos2 <= 6; pos2++) {
    for (let pos3 = 1; pos3 <= 6; pos3++) {
      const targets1 = positionCounts[pos1].validTargets;
      const targets2 = positionCounts[pos2].validTargets;
      const targets3 = positionCounts[pos3].validTargets;
      totalWithBlack += targets1 * targets2 * targets3;
    }
  }
}

console.log(`With black hexagons (variable positions): ${totalWithBlack.toLocaleString()} target combinations`);
console.log(`Increase: ${((totalWithBlack / currentTargetCombos - 1) * 100).toFixed(1)}% more combinations\n`);

// Solvability estimate
const currentSolvable = Math.floor(currentTargetCombos * 0.2);
const withBlackSolvable = Math.floor(totalWithBlack * 0.2);

console.log("=== Estimated Solvable Puzzles ===\n");
console.log(`Current: ~${currentSolvable.toLocaleString()}`);
console.log(`With black hexagons: ~${withBlackSolvable.toLocaleString()}`);
console.log(`Increase: ${((withBlackSolvable / currentSolvable - 1) * 100).toFixed(1)}% more puzzles\n`);

// Additional benefits
console.log("=== Additional Benefits ===\n");
console.log("1. More puzzle variety (easy to hard)");
console.log("2. Strategic blocking positions");
console.log("3. More interesting layouts");
console.log("4. Ability to create 'islands' of connected puzzles");
console.log("5. Easier puzzle generation (more valid combinations)");
