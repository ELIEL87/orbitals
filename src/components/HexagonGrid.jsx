import { useMemo } from 'react';
import Hexagon from './Hexagon';
import { hexToPixel, getOrbit, hexDistance } from '../utils/hexagon';

export default function HexagonGrid({ 
  grid, 
  centers, 
  selectedHex, 
  onHexClick, 
  onHexRotate,
  hasDuplicates,
  rotationAngles = {},
  isOrbitIncorrect,
  isOrbitCorrect,
  hoveredHex = null,
  onHexHover
}) {
  const allHexes = useMemo(() => {
    const hexes = new Set();
    const hexArray = [];
    
    // Add all center hexes
    centers.forEach(center => {
      const centerKey = `${center.q},${center.r}`;
      if (!hexes.has(centerKey)) {
        hexes.add(centerKey);
        hexArray.push({ q: center.q, r: center.r });
      }
    });
    
    // Add all hexagons from the grid (including moved black hexagons)
    Object.keys(grid).forEach(key => {
      const hexData = grid[key];
      if (hexData && !hexData.isCenter) {
        const [q, r] = key.split(',').map(Number);
        const hexKey = `${q},${r}`;
        if (!hexes.has(hexKey)) {
          hexes.add(hexKey);
          hexArray.push({ q, r });
        }
      }
    });
    
    // Also ensure all orbit positions are included (for initial render)
    centers.forEach(center => {
      const orbit1 = getOrbit(center.q, center.r, 1);
      orbit1.forEach(hex => {
        const key = `${hex.q},${hex.r}`;
        if (!hexes.has(key)) {
          hexes.add(key);
          hexArray.push(hex);
        }
      });
    });
    
    return hexArray;
  }, [centers, grid]);

  const bounds = useMemo(() => {
    if (allHexes.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    
    let minQ = Infinity, maxQ = -Infinity;
    let minR = Infinity, maxR = -Infinity;
    
    allHexes.forEach(hex => {
      minQ = Math.min(minQ, hex.q);
      maxQ = Math.max(maxQ, hex.q);
      minR = Math.min(minR, hex.r);
      maxR = Math.max(maxR, hex.r);
    });
    
    const topLeft = hexToPixel(minQ, minR);
    const bottomRight = hexToPixel(maxQ, maxR);
    
    return {
      minX: topLeft.x - 50,
      minY: topLeft.y - 50,
      maxX: bottomRight.x + 50,
      maxY: bottomRight.y + 50,
      width: bottomRight.x - topLeft.x + 100,
      height: bottomRight.y - topLeft.y + 100,
    };
  }, [allHexes]);

  // Calculate which orbits to highlight based on selected/hovered hex
  const highlightedOrbits = useMemo(() => {
    const orbits = new Set();
    const hexToCheck = hoveredHex || selectedHex;
    
    if (hexToCheck) {
      const key = `${hexToCheck.q},${hexToCheck.r}`;
      const hexData = grid[key];
      
      // Don't highlight when hovering over centers or black hexagons
      if (hexData?.orbitCenters && !hexData.isCenter && !hexData.isBlack) {
        hexData.orbitCenters.forEach(oc => {
          orbits.add(`${oc.q},${oc.r}`);
        });
      } else if (hexData?.isCenter && selectedHex && selectedHex.q === hexToCheck.q && selectedHex.r === hexToCheck.r) {
        // Only highlight if center is selected (not just hovered)
        orbits.add(`${hexToCheck.q},${hexToCheck.r}`);
      }
    }
    
    return orbits;
  }, [selectedHex, hoveredHex, grid]);

  const handleSvgClick = (e) => {
    // If clicking directly on the SVG background (not on a hexagon), deselect
    // Hexagon clicks stop propagation, so they won't trigger this
    if (e.target === e.currentTarget || e.target.tagName === 'svg') {
      onHexClick(null, null);
    }
  };

  return (
    <svg 
      width={bounds.width || 800} 
      height={bounds.height || 600}
      viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
      style={{ border: '1px solid #4D5359', borderRadius: '8px', background: '#fff' }}
      onClick={handleSvgClick}
    >
      {allHexes.map(hex => {
        const { x, y } = hexToPixel(hex.q, hex.r);
        const key = `${hex.q},${hex.r}`;
        const value = grid[key]?.value ?? null;
        const rotation = grid[key]?.rotation ?? 0;
        const isRotating = grid[key]?.isRotating ?? false;
        const isCenter = centers.some(c => c.q === hex.q && c.r === hex.r);
        const isSelected = selectedHex?.q === hex.q && selectedHex?.r === hex.r;
        const hexData = grid[key];
        const isBlack = hexData?.isBlack ?? false;
        
        // Check for duplicates in any orbit this hex belongs to
        const hasDuplicate = hexData && !isCenter && hexData.orbitCenters && hexData.orbitCenters.length > 0
          ? hexData.orbitCenters.some(oc => hasDuplicates(oc))
          : false;
        
        // Check if this hex is in a highlighted orbit
        let isHighlighted = false;
        let isInIncorrectOrbit = false;
        let isInCorrectOrbit = false;
        
        // Black hexagons don't get colored by orbit status
        if (!isBlack && hexData?.orbitCenters) {
          isHighlighted = hexData.orbitCenters.some(oc => 
            highlightedOrbits.has(`${oc.q},${oc.r}`)
          );
          // Don't color center hexagons red or green
          isInIncorrectOrbit = !isCenter && hexData.orbitCenters.some(oc => 
            isOrbitIncorrect(oc)
          );
          isInCorrectOrbit = !isCenter && hexData.orbitCenters.some(oc => 
            isOrbitCorrect(oc)
          );
        } else if (isCenter) {
          // Center is highlighted if its orbit is highlighted
          isHighlighted = highlightedOrbits.has(key);
          // Center should not be colored red or green
          isInIncorrectOrbit = false;
          isInCorrectOrbit = false;
        }
        
        // Get orbit center position for rotation animation (use first orbit)
        let orbitCenterPos = null;
        if (hexData?.orbitCenters && hexData.orbitCenters.length > 0 && !isCenter) {
          const firstOrbit = hexData.orbitCenters[0];
          const centerPos = hexToPixel(firstOrbit.q, firstOrbit.r);
          orbitCenterPos = centerPos;
        }
        
        return (
          <Hexagon
            key={key}
            q={hex.q}
            r={hex.r}
            x={x}
            y={y}
            value={value}
            isCenter={isCenter}
            isBlack={isBlack}
            isSelected={isSelected}
            hasDuplicate={hasDuplicate}
            isHighlighted={isHighlighted}
            isInIncorrectOrbit={isInIncorrectOrbit}
            isInCorrectOrbit={isInCorrectOrbit}
            isRotating={isRotating}
            orbitCenterPos={orbitCenterPos}
            rotationAngle={rotationAngles[key] || 0}
            rotation={rotation}
            onClick={onHexClick}
            onRotate={onHexRotate}
            onHover={onHexHover}
          />
        );
      })}
    </svg>
  );
}
