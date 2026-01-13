import { useMemo } from 'react';
import { HEX_SIZE } from '../utils/hexagon';

export default function Hexagon({ 
  q, 
  r, 
  x, 
  y, 
  value, 
  isCenter, 
  isSelected,
  hasDuplicate = false,
  isHighlighted = false,
  isInIncorrectOrbit = false,
  isInCorrectOrbit = false,
  isRotating = false,
  orbitCenterPos = null,
  rotationAngle = 0,
  onClick,
  onRotate,
  onHover,
  rotation = 0 
}) {
  const points = useMemo(() => {
    const points = [];
    // Start at 30 degrees for flat-top hexagons (pointing right)
    // Points are relative to center (0,0) since we use transform
    const startAngle = Math.PI / 6;
    for (let i = 0; i < 6; i++) {
      const angle = startAngle + (Math.PI / 3) * i;
      const px = HEX_SIZE * Math.cos(angle);
      const py = HEX_SIZE * Math.sin(angle);
      points.push(`${px},${py}`);
    }
    return points.join(' ');
  }, []);

  const handleClick = (e) => {
    e.stopPropagation(); // Prevent event from bubbling to SVG
    if (isCenter) {
      // Clicking center rotates the orbit
      onRotate?.(q, r);
    } else if (e.shiftKey) {
      // Shift+click on orbit hexagon also rotates
      onRotate?.(q, r);
    } else {
      onClick?.(q, r);
    }
  };

  const handleMouseEnter = () => {
    onHover?.({ q, r });
  };

  const handleMouseLeave = () => {
    onHover?.(null);
  };

  // Calculate offset from orbit center for rotation
  const rotationOffset = useMemo(() => {
    if (orbitCenterPos) {
      return {
        dx: x - orbitCenterPos.x,
        dy: y - orbitCenterPos.y,
      };
    }
    return null;
  }, [x, y, orbitCenterPos]);

  // Render hexagon content
  const renderContent = () => (
    <>
      <polygon
        points={points}
        fill={
          isInCorrectOrbit
            ? '#97DB4F'
            : isInIncorrectOrbit
            ? '#f5e6e6'
            : isCenter 
            ? '#508484' 
            : hasDuplicate 
            ? '#f5e6e6' 
            : isHighlighted
            ? '#6BA3D1'
            : isSelected 
            ? '#79C99E' 
            : '#f0f0f0'
        }
        stroke={
          isSelected
            ? '#4A4238'
            : isInCorrectOrbit
            ? '#79C99E'
            : isInIncorrectOrbit
            ? '#4A4238'
            : hasDuplicate 
            ? '#4A4238' 
            : isHighlighted
            ? '#508484'
            : '#4D5359'
        }
        strokeWidth={
          isSelected
            ? 4
            : isCenter 
            ? 2 
            : (hasDuplicate || isInIncorrectOrbit || isInCorrectOrbit || isHighlighted) 
            ? 2 
            : 1
        }
        className={isRotating ? 'rotating-polygon' : ''}
      />
      {value !== null && (
        <text
          x="0"
          y="0"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={isCenter ? 24 : 18}
          fontWeight={isCenter ? 'bold' : 'normal'}
          fill={isCenter ? '#fff' : '#4A4238'}
          className={isRotating ? 'rotating-text' : ''}
        >
          {value}
        </text>
      )}
      {isCenter && (
        <text
          x="0"
          y={HEX_SIZE * 0.6}
          textAnchor="middle"
          fontSize={12}
          fill="#fff"
          opacity={0.8}
        >
          ↻
        </text>
      )}
      {!isCenter && rotation !== 0 && (
        <text
          x="0"
          y={HEX_SIZE * 0.7}
          textAnchor="middle"
          fontSize={10}
          fill="#4D5359"
        >
          ↻{rotation}
        </text>
      )}
    </>
  );

  return (
    <g 
      className={`hexagon ${isCenter ? 'center' : ''} ${isSelected ? 'selected' : ''} ${hasDuplicate ? 'duplicate' : ''} ${isHighlighted ? 'highlighted' : ''} ${isInIncorrectOrbit ? 'incorrect-orbit' : ''} ${isInCorrectOrbit ? 'correct-orbit' : ''} ${isRotating ? 'rotating' : ''}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: 'pointer' }}
    >
      {isRotating && rotationOffset ? (
        // Animated rotation: translate to orbit center, rotate, translate by offset
        <g transform={`translate(${orbitCenterPos.x}, ${orbitCenterPos.y}) rotate(${rotationAngle}) translate(${rotationOffset.dx}, ${rotationOffset.dy})`}>
          {renderContent()}
        </g>
      ) : (
        // Normal static position
        <g transform={`translate(${x}, ${y})`}>
          {renderContent()}
        </g>
      )}
    </g>
  );
}
