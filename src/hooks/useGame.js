import { useState, useCallback, useMemo } from 'react';
import { getOrbit, hexDistance } from '../utils/hexagon';

export function useGame(initialCenters = []) {
  const [grid, setGrid] = useState({});
  const [selectedHex, setSelectedHex] = useState(null);
  const [centers] = useState(initialCenters);
  const [rotatingOrbit, setRotatingOrbit] = useState(null);
  const [rotationAngles, setRotationAngles] = useState({});

  // Initialize grid with orbits
  const initializeGrid = useCallback(() => {
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
        if (!newGrid[key]) {
          newGrid[key] = {
            value: null,
            isCenter: false,
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
        }
      });
    });
    
    setGrid(newGrid);
  }, [centers]);

  const handleHexClick = useCallback((q, r) => {
    // If q and r are null, deselect
    if (q === null || r === null) {
      setSelectedHex(null);
      return;
    }
    
    const key = `${q},${r}`;
    const hex = grid[key];
    
    if (!hex || hex.isCenter) {
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
    
    // Initialize rotation angles for animation
    const newAngles = {};
    orbit1.forEach(h => {
      const k = `${h.q},${h.r}`;
      newAngles[k] = 0;
    });
    setRotationAngles(prev => ({ ...prev, ...newAngles }));
    
    // Animate rotation
    const startTime = Date.now();
    const duration = 1200; // Slower rotation (1.2 seconds)
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const angle = progress * 60; // Rotate 60 degrees (one hexagon position)
      
      const currentAngles = {};
      orbit1.forEach(h => {
        const k = `${h.q},${h.r}`;
        currentAngles[k] = angle;
      });
      setRotationAngles(prev => ({ ...prev, ...currentAngles }));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation complete - update values
        setGrid(prev => {
          const newGrid = { ...prev };
          const orbitValues = orbit1.map(h => {
            const k = `${h.q},${h.r}`;
            return prev[k]?.value ?? null;
          });
          
          // Rotate array counter-clockwise (shift left - first element moves to last)
          // This matches counter-clockwise visual rotation
          const rotated = [...orbitValues.slice(1), orbitValues[0]];
          
          orbit1.forEach((h, index) => {
            const k = `${h.q},${h.r}`;
            if (newGrid[k]) {
              newGrid[k] = {
                ...newGrid[k],
                value: rotated[index],
                rotation: (newGrid[k].rotation + 1) % 6,
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
    
    // Mark as rotating
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

  // Check if orbit has duplicate numbers
  const hasDuplicates = useCallback((orbitCenter) => {
    const orbit1 = getOrbit(orbitCenter.q, orbitCenter.r, 1);
    const values = orbit1
      .map(hex => {
        const key = `${hex.q},${hex.r}`;
        return grid[key]?.value;
      })
      .filter(v => v !== null);
    return new Set(values).size !== values.length;
  }, [grid]);

  // Check if orbit sum matches target
  const getOrbitSum = useCallback((orbitCenter) => {
    const orbit1 = getOrbit(orbitCenter.q, orbitCenter.r, 1);
    return orbit1.reduce((acc, hex) => {
      const key = `${hex.q},${hex.r}`;
      const value = grid[key]?.value;
      return acc + (value !== null ? value : 0);
    }, 0);
  }, [grid]);

  // Check if orbit is complete (all hexagons filled)
  const isOrbitComplete = useCallback((orbitCenter) => {
    const orbit1 = getOrbit(orbitCenter.q, orbitCenter.r, 1);
    return orbit1.every(hex => {
      const key = `${hex.q},${hex.r}`;
      const value = grid[key]?.value;
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
        const value = grid[key]?.value;
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
    
    // Collect all used numbers from all orbits this hex belongs to
    const usedNumbers = new Set();
    hex.orbitCenters.forEach(orbitCenter => {
      const orbit1 = getOrbit(orbitCenter.q, orbitCenter.r, 1);
      orbit1.forEach(h => {
        const k = `${h.q},${h.r}`;
        if (k !== key) {
          const value = grid[k]?.value;
          if (value !== null) {
            usedNumbers.add(value);
          }
        }
      });
    });
    
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(n => !usedNumbers.has(n));
  }, [selectedHex, grid]);

  // Get all playable hexagons (non-center hexagons) for navigation
  const getPlayableHexagons = useCallback(() => {
    const playableHexes = [];
    const hexSet = new Set();
    
    centers.forEach(center => {
      const orbit1 = getOrbit(center.q, center.r, 1);
      orbit1.forEach(hex => {
        const key = `${hex.q},${hex.r}`;
        if (!hexSet.has(key)) {
          hexSet.add(key);
          playableHexes.push(hex);
        }
      });
    });
    
    return playableHexes;
  }, [centers]);

  // Navigate to next/previous hexagon
  const navigateHex = useCallback((direction) => {
    const playableHexes = getPlayableHexagons();
    if (playableHexes.length === 0) return;
    
    if (!selectedHex) {
      // If nothing selected, select first hexagon
      setSelectedHex(playableHexes[0]);
      return;
    }
    
    // Find current index
    const currentIndex = playableHexes.findIndex(
      h => h.q === selectedHex.q && h.r === selectedHex.r
    );
    
    if (currentIndex === -1) {
      // Current selection not in playable hexes, select first
      setSelectedHex(playableHexes[0]);
      return;
    }
    
    // Navigate based on direction
    let newIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % playableHexes.length;
    } else if (direction === 'prev') {
      newIndex = (currentIndex - 1 + playableHexes.length) % playableHexes.length;
    } else {
      return;
    }
    
    setSelectedHex(playableHexes[newIndex]);
  }, [selectedHex, getPlayableHexagons]);

  return {
    grid,
    selectedHex,
    centers,
    initializeGrid,
    handleHexClick,
    handleNumberInput,
    handleRotate,
    checkWin,
    isComplete,
    getAvailableNumbers,
    hasDuplicates,
    rotationAngles,
    isOrbitIncorrect,
    isOrbitCorrect,
    getOrbitSum,
    navigateHex,
  };
}
