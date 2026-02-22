import { useState, useCallback, useMemo } from 'react';
import { getOrbit, hexDistance, hexToPixel } from '../utils/hexagon';

export function useGame(initialCenters = [], blackHexagons = [], initialGrid = null) {
  const [centers] = useState(initialCenters);
  const [grid, setGrid] = useState({});
  const [selectedHex, setSelectedHex] = useState(null);
  const [blackHexSet] = useState(new Set(blackHexagons.map(bh => `${bh.q},${bh.r}`)));
  const [rotatingOrbit, setRotatingOrbit] = useState(null);
  const [rotationAngles, setRotationAngles] = useState({});

  // Initialize grid with orbits
  const initializeGrid = useCallback(() => {
    if (initialGrid) {
      // Validate that the saved grid matches the current puzzle's centers.
      // If any center is missing (e.g. puzzle structure changed), discard the saved grid.
      const isCompatible = centers.every(c => initialGrid[`${c.q},${c.r}`]?.isCenter === true);
      if (isCompatible) {
        setGrid(initialGrid);
        return;
      }
    }

    const newGrid = {};
    
    centers.forEach(center => {
      // Mark center
      const centerKey = `${center.q},${center.r}`;
      newGrid[centerKey] = {
        value: center.target,
        isCenter: true,
        rotation: 0,
      };
      
      // Initialize orbit 1 (6 hexagons)
      const orbit1 = getOrbit(center.q, center.r, 1);
      orbit1.forEach((hex, index) => {
        const key = `${hex.q},${hex.r}`;
        const isBlack = blackHexSet.has(key);
        
        if (!newGrid[key]) {
          newGrid[key] = {
            value: null,
            isCenter: false,
            isBlack: isBlack,
            rotation: 0,
            orbitCenters: [{ q: center.q, r: center.r }], // Array to support multiple orbits
            orbitIndex: index,
          };
        } else if (newGrid[key] && !newGrid[key].isCenter) {
          // Hexagon is shared - add this orbit to its list
          if (!newGrid[key].orbitCenters) {
            newGrid[key].orbitCenters = [];
          }
          if (!newGrid[key].orbitCenters.some(oc => oc.q === center.q && oc.r === center.r)) {
            newGrid[key].orbitCenters.push({ q: center.q, r: center.r });
          }
          // Update black status if this orbit marks it as black
          if (isBlack) {
            newGrid[key].isBlack = true;
          }
        }
      });
    });
    
    setGrid(newGrid);
  }, [centers, blackHexSet, initialGrid]);

  const handleHexClick = useCallback((q, r) => {
    // If q and r are null, deselect
    if (q === null || r === null) {
      setSelectedHex(null);
      return;
    }
    
    const key = `${q},${r}`;
    const hex = grid[key];
    
    // Don't allow selection of centers or black hexagons
    if (!hex || hex.isCenter || hex.isBlack) {
      setSelectedHex(null);
      return;
    }
    
    setSelectedHex({ q, r });
  }, [grid]);

  // Check if a number already exists in an orbit
  const isNumberInOrbit = useCallback((orbitCenter, number, excludeKey = null) => {
    if (number === null) return false;
    const orbit1 = getOrbit(orbitCenter.q, orbitCenter.r, 1);
    return orbit1.some(hex => {
      const key = `${hex.q},${hex.r}`;
      if (key === excludeKey) return false;
      return grid[key]?.value === number;
    });
  }, [grid]);

  const clearAll = useCallback(() => {
    setGrid(prev => {
      const newGrid = { ...prev };
      Object.keys(newGrid).forEach(key => {
        const hex = newGrid[key];
        if (hex && !hex.isCenter && !hex.isBlack) {
          newGrid[key] = { ...hex, value: null };
        }
      });
      return newGrid;
    });
  }, []);

  const handleNumberInput = useCallback((number) => {
    if (!selectedHex) return;
    
    const key = `${selectedHex.q},${selectedHex.r}`;
    const hex = grid[key];
    
    if (!hex || hex.isCenter || !hex.orbitCenters || hex.orbitCenters.length === 0) return;
    
    // Check if number already exists in any of the orbits this hex belongs to
    if (number !== null) {
      const numberExists = hex.orbitCenters.some(orbitCenter => 
        isNumberInOrbit(orbitCenter, number, key)
      );
      if (numberExists) {
        // Number already exists in one of the orbits, don't allow it
        return;
      }
    }
    
    setGrid(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        value: number,
      },
    }));
  }, [selectedHex, grid, isNumberInOrbit]);

  const handleRotate = useCallback((q, r) => {
    const key = `${q},${r}`;
    const hex = grid[key];
    
    let orbitCenter;
    
    if (hex?.isCenter) {
      // Clicking center - rotate its orbit
      orbitCenter = { q, r };
    } else if (hex?.orbitCenters && hex.orbitCenters.length > 0) {
      // Clicking orbit hexagon - rotate the first orbit it belongs to
      // (or we could rotate all orbits, but that might be confusing)
      orbitCenter = hex.orbitCenters[0];
    } else {
      return;
    }
    
    // Prevent multiple rotations at once
    const orbitKey = `${orbitCenter.q},${orbitCenter.r}`;
    if (rotatingOrbit === orbitKey) return;
    
    // Set rotating state
    setRotatingOrbit(orbitKey);
    
    // Get all hexes in the orbit
    const orbit1 = getOrbit(orbitCenter.q, orbitCenter.r, 1);
    
    // Initialize rotation angles for animation (including black hexagons)
    const newAngles = {};
    orbit1.forEach(h => {
      const k = `${h.q},${h.r}`;
      const hexData = grid[k];
      // All hexagons rotate (including black)
      if (hexData) {
        newAngles[k] = 0;
      }
    });
    setRotationAngles(prev => ({ ...prev, ...newAngles }));
    
    // Animate rotation with ease-in-out
    const startTime = Date.now();
    const duration = 700;

    // Ease-in-out cubic
    const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const angle = ease(progress) * 60; // Rotate 60 degrees (one hexagon position)
      
      const currentAngles = {};
      orbit1.forEach(h => {
        const k = `${h.q},${h.r}`;
        const hexData = grid[k];
        // All hexagons rotate (including black)
        if (hexData) {
          currentAngles[k] = angle;
        }
      });
      setRotationAngles(prev => ({ ...prev, ...currentAngles }));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation complete - move hexagons to new positions
        setGrid(prev => {
          const newGrid = { ...prev };
          
          // Get all hexagons currently in this orbit with their data
          const orbitData = orbit1.map((h, index) => {
            const k = `${h.q},${h.r}`;
            const hexData = prev[k];
            return {
              sourceKey: k,
              sourceQ: h.q,
              sourceR: h.r,
              value: hexData?.value ?? null,
              isBlack: hexData?.isBlack ?? false,
              orbitCenters: hexData?.orbitCenters ?? [],
              rotation: hexData?.rotation ?? 0,
            };
          });
          
          // Rotate array counter-clockwise (shift left) - each hexagon moves to next position
          const rotated = [...orbitData.slice(1), orbitData[0]];
          
          // Move each hexagon to its new position
          orbit1.forEach((h, index) => {
            const targetKey = `${h.q},${h.r}`;
            const sourceHex = rotated[index];
            const sourceKey = sourceHex.sourceKey;
            
            // Get the hexagon data from source position
            const sourceData = prev[sourceKey];
            
            if (sourceData) {
              // Determine which orbits this position belongs to
              const newOrbitCenters = [];
              
              // Check all centers to see if this position is in their orbit
              centers.forEach(center => {
                const centerOrbit = getOrbit(center.q, center.r, 1);
                if (centerOrbit.some(hex => hex.q === h.q && hex.r === h.r)) {
                  newOrbitCenters.push({ q: center.q, r: center.r });
                }
              });
              
              // Update or create hexagon at target position
              newGrid[targetKey] = {
                value: sourceHex.value,
                isCenter: false,
                isBlack: sourceHex.isBlack,
                rotation: (sourceHex.rotation + 1) % 6,
                orbitCenters: newOrbitCenters,
                orbitIndex: index,
                isRotating: false,
              };
            }
          });
          
          return newGrid;
        });
        
        // Clear rotation angles and state
        const clearAngles = {};
        orbit1.forEach(h => {
          const k = `${h.q},${h.r}`;
          clearAngles[k] = 0;
        });
        setRotationAngles(prev => {
          const updated = { ...prev };
          orbit1.forEach(h => {
            const k = `${h.q},${h.r}`;
            delete updated[k];
          });
          return updated;
        });
        setRotatingOrbit(null);
      }
    };
    
    // Mark as rotating (including black hexagons)
    setGrid(prev => {
      const newGrid = { ...prev };
      orbit1.forEach(h => {
        const k = `${h.q},${h.r}`;
        if (newGrid[k]) {
          newGrid[k] = {
            ...newGrid[k],
            isRotating: true,
          };
        }
      });
      return newGrid;
    });
    
    requestAnimationFrame(animate);
  }, [grid, rotatingOrbit]);

  // Check if orbit has duplicate numbers (excluding black hexagons)
  const hasDuplicates = useCallback((orbitCenter) => {
    const orbit1 = getOrbit(orbitCenter.q, orbitCenter.r, 1);
    const values = orbit1
      .map(hex => {
        const key = `${hex.q},${hex.r}`;
        const hexData = grid[key];
        // Skip black hexagons and centers
        if (hexData?.isBlack || hexData?.isCenter) {
          return null;
        }
        return hexData?.value;
      })
      .filter(v => v !== null);
    return new Set(values).size !== values.length;
  }, [grid]);

  // Check if orbit sum matches target (excluding black hexagons)
  const getOrbitSum = useCallback((orbitCenter) => {
    const orbit1 = getOrbit(orbitCenter.q, orbitCenter.r, 1);
    return orbit1.reduce((acc, hex) => {
      const key = `${hex.q},${hex.r}`;
      const hexData = grid[key];
      // Skip black hexagons and centers
      if (hexData?.isBlack || hexData?.isCenter) {
        return acc;
      }
      const value = hexData?.value;
      return acc + (value !== null ? value : 0);
    }, 0);
  }, [grid]);

  // Check if orbit is complete (all non-black hexagons filled)
  const isOrbitComplete = useCallback((orbitCenter) => {
    const orbit1 = getOrbit(orbitCenter.q, orbitCenter.r, 1);
    return orbit1.every(hex => {
      const key = `${hex.q},${hex.r}`;
      const hexData = grid[key];
      // Black hexagons and centers don't need to be filled
      if (hexData?.isBlack || hexData?.isCenter) {
        return true;
      }
      const value = hexData?.value;
      return value !== null && value >= 0 && value <= 9;
    });
  }, [grid]);

  // Check if orbit sum is incorrect (complete but sum doesn't match)
  const isOrbitIncorrect = useCallback((orbitCenter) => {
    const center = centers.find(c => c.q === orbitCenter.q && c.r === orbitCenter.r);
    if (!center) return false;
    
    // Only show error if orbit is complete
    if (!isOrbitComplete(orbitCenter)) return false;
    
    const sum = getOrbitSum(orbitCenter);
    return sum !== center.target;
  }, [centers, grid, getOrbitSum, isOrbitComplete]);

  // Check if orbit is correct (complete and sum matches)
  const isOrbitCorrect = useCallback((orbitCenter) => {
    const center = centers.find(c => c.q === orbitCenter.q && c.r === orbitCenter.r);
    if (!center) return false;
    
    // Must be complete
    if (!isOrbitComplete(orbitCenter)) return false;
    
    // Check for duplicates
    if (hasDuplicates(orbitCenter)) return false;
    
    // Check if sum matches
    const sum = getOrbitSum(orbitCenter);
    return sum === center.target;
  }, [centers, grid, getOrbitSum, isOrbitComplete, hasDuplicates]);

  const checkWin = useCallback(() => {
    // Check if all orbits are correct (complete, no duplicates, sum matches)
    return centers.every(center => {
      return isOrbitCorrect({ q: center.q, r: center.r });
    });
  }, [centers, isOrbitCorrect]);

  const isComplete = useMemo(() => {
    return centers.every(center => {
      const orbit1 = getOrbit(center.q, center.r, 1);
      const allFilled = orbit1.every(hex => {
        const key = `${hex.q},${hex.r}`;
        const hexData = grid[key];
        if (hexData?.isBlack || hexData?.isCenter) return true;
        const value = hexData?.value;
        return value !== null && value >= 0 && value <= 9;
      });
      
      // Also check for duplicates
      const noDuplicates = !hasDuplicates({ q: center.q, r: center.r });
      
      return allFilled && noDuplicates;
    });
  }, [centers, grid, hasDuplicates]);

  // Get available numbers for selected hex (numbers not in any of its orbits)
  const getAvailableNumbers = useCallback(() => {
    if (!selectedHex) return [];
    const key = `${selectedHex.q},${selectedHex.r}`;
    const hex = grid[key];
    if (!hex || !hex.orbitCenters || hex.orbitCenters.length === 0) {
      return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    }
    
    // Collect all used numbers from all orbits this hex belongs to (excluding black hexagons)
    const usedNumbers = new Set();
    hex.orbitCenters.forEach(orbitCenter => {
      const orbit1 = getOrbit(orbitCenter.q, orbitCenter.r, 1);
      orbit1.forEach(h => {
        const k = `${h.q},${h.r}`;
        if (k !== key) {
          const hexData = grid[k];
          // Skip black hexagons and centers
          if (hexData && !hexData.isBlack && !hexData.isCenter) {
            const value = hexData.value;
            if (value !== null) {
              usedNumbers.add(value);
            }
          }
        }
      });
    });
    
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(n => !usedNumbers.has(n));
  }, [selectedHex, grid]);

  // Get all playable hexagons (non-center, non-black hexagons) for navigation
  const getPlayableHexagons = useCallback(() => {
    const playableHexes = [];
    const hexSet = new Set();
    
    centers.forEach(center => {
      const orbit1 = getOrbit(center.q, center.r, 1);
      orbit1.forEach(hex => {
        const key = `${hex.q},${hex.r}`;
        const hexData = grid[key];
        // Skip centers and black hexagons
        if (!hexSet.has(key) && hexData && !hexData.isCenter && !hexData.isBlack) {
          hexSet.add(key);
          playableHexes.push(hex);
        }
      });
    });
    
    return playableHexes;
  }, [centers, grid]);

  // Navigate to the nearest playable hexagon in a spatial direction
  const navigateHex = useCallback((direction) => {
    const playableHexes = getPlayableHexagons();
    if (playableHexes.length === 0) return;

    if (!selectedHex) {
      setSelectedHex(playableHexes[0]);
      return;
    }

    // Direction vectors in pixel space
    const dirVectors = {
      up:    { x:  0, y: -1 },
      down:  { x:  0, y:  1 },
      left:  { x: -1, y:  0 },
      right: { x:  1, y:  0 },
    };
    const dir = dirVectors[direction];
    if (!dir) return;

    const current = hexToPixel(selectedHex.q, selectedHex.r);

    let best = null;
    let bestScore = Infinity;

    playableHexes.forEach(h => {
      if (h.q === selectedHex.q && h.r === selectedHex.r) return;
      const pos = hexToPixel(h.q, h.r);
      const dx = pos.x - current.x;
      const dy = pos.y - current.y;

      // Must be in the forward half-plane
      const parallel = dx * dir.x + dy * dir.y;
      if (parallel <= 0) return;

      // Prefer hexes aligned with the direction (penalises perpendicular deviation).
      // dist²/parallel = dist / cos(angle) — grows as the hex veers off-axis.
      const dist = Math.sqrt(dx * dx + dy * dy);
      const score = (dist * dist) / parallel;

      if (score < bestScore) {
        bestScore = score;
        best = h;
      }
    });

    if (best) {
      setSelectedHex(best);
    }
  }, [selectedHex, getPlayableHexagons]);

  return {
    grid,
    selectedHex,
    centers,
    initializeGrid,
    handleHexClick,
    handleNumberInput,
    handleRotate,
    clearAll,
    checkWin,
    isComplete,
    getAvailableNumbers,
    hasDuplicates,
    rotationAngles,
    rotatingOrbit,
    isOrbitIncorrect,
    isOrbitCorrect,
    getOrbitSum,
    navigateHex,
  };
}
