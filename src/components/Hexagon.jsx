import { useMemo } from 'react';
import { HEX_SIZE } from '../utils/hexagon';

export default function Hexagon({
  q,
  r,
  x,
  y,
  value,
  currentSum = null,
  isCenter,
  isSelected,
  isBlack = false,
  hasDuplicate = false,
  isHighlighted = false,
  isInIncorrectOrbit = false,
  isInCorrectOrbit = false,
  isRotating = false,
  orbitCenterPos = null,
  rotationAngle = 0,
  isHinted = false,
  isCenterFocused = false,
  onClick,
  onRotate,
  onHover,
  rotation = 0,
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
    // Black hexagons are not interactive
    if (isBlack) return;
    
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
          isBlack
            ? '#4A4238'
            : isInCorrectOrbit
            ? '#97DB4F'
            : isInIncorrectOrbit
            ? '#f5e6e6'
            : isCenterFocused
            ? '#3a7a7a'
            : isCenter
            ? '#508484'
            : hasDuplicate
            ? '#f5e6e6'
            : isSelected
            ? '#79C99E'
            : isHighlighted
            ? '#6BA3D1'
            : '#f0f0f0'
        }
        stroke={
          isBlack
            ? '#2A2218'
            : isCenterFocused
            ? '#ffffff'
            : isSelected
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
          isCenterFocused
            ? 5
            : isSelected
            ? 4
            : isCenter
            ? 2
            : (hasDuplicate || isInIncorrectOrbit || isInCorrectOrbit || isHighlighted)
            ? 2
            : 1
        }
        className={isRotating ? 'rotating-polygon' : ''}
      />
      {value !== null && !isBlack && !isCenter && (
        <text
          x="0"
          y="0"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={18}
          fill="#4A4238"
          className={isRotating ? 'rotating-text' : ''}
        >
          {value}
        </text>
      )}
      {isCenter && value !== null && (() => {
        const showCurrent = currentSum !== null && currentSum !== value;
        return showCurrent ? (
          <>
            <text
              x="0"
              y={-HEX_SIZE * 0.15}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={20}
              fontWeight="bold"
              fill="#fff"
              className={isRotating ? 'rotating-text' : ''}
            >
              {value}
            </text>
            <text
              x="0"
              y={HEX_SIZE * 0.25}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={11}
              fill="#fff"
              opacity={0.7}
            >
              {currentSum}
            </text>
          </>
        ) : (
          <text
            x="0"
            y="0"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={24}
            fontWeight="bold"
            fill="#fff"
            className={isRotating ? 'rotating-text' : ''}
          >
            {value}
          </text>
        );
      })()}
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
    </>
  );

  return (
    <g 
      className={`hexagon ${isCenter ? 'center' : ''} ${isBlack ? 'black' : ''} ${isSelected ? 'selected' : ''} ${hasDuplicate ? 'duplicate' : ''} ${isHighlighted ? 'highlighted' : ''} ${isInIncorrectOrbit ? 'incorrect-orbit' : ''} ${isInCorrectOrbit ? 'correct-orbit' : ''} ${isRotating ? 'rotating' : ''}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: isBlack ? 'not-allowed' : 'pointer' }}
    >
      {isRotating && rotationOffset ? (
        // Animated rotation: orbit around center, counter-rotate content to stay upright
        <g transform={`translate(${orbitCenterPos.x}, ${orbitCenterPos.y}) rotate(${rotationAngle}) translate(${rotationOffset.dx}, ${rotationOffset.dy}) rotate(${-rotationAngle})`}>
          <g className={isHinted ? 'hex-rumble' : ''}>{renderContent()}</g>
        </g>
      ) : (
        // Normal static position
        <g transform={`translate(${x}, ${y})`}>
          <g className={isHinted ? 'hex-rumble' : ''}>{renderContent()}</g>
        </g>
      )}
    </g>
  );
}
