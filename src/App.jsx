import { useState, useEffect } from 'react';
import HexagonGrid from './components/HexagonGrid';
import { useGame } from './hooks/useGame';
import './App.css';

// Sample game configuration - centers with target numbers
// Positioned so orbits overlap and share hexagons
// Centers are at least distance 2 apart (at least 1 hexagon between them)
// Distance 2 means orbits (radius 1) will share hexagons
const INITIAL_CENTERS = [
  { q: 0, r: 0, target: 15 },
  { q: 2, r: 0, target: 20 },  // Distance 2 from (0,0) - orbits will share
  { q: 1, r: 2, target: 18 },   // Distance 3 from (0,0), distance 2 from (2,0)
];

// Black hexagon positions (unfillable hexagons that don't count toward sums)
// Format: array of {q, r} coordinates
const BLACK_HEXAGONS = [
  { q: 1, r: 0 },  // Black hexagon shared between center 1 and center 2 orbits
];

function App() {
  const {
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
    rotatingOrbit,
    isOrbitIncorrect,
    isOrbitCorrect,
    navigateHex,
  } = useGame(INITIAL_CENTERS, BLACK_HEXAGONS);

  const [hoveredHex, setHoveredHex] = useState(null);

  const [gameWon, setGameWon] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    initializeGrid();
  }, [initializeGrid]);

  useEffect(() => {
    // Check if all orbits are correct (all green)
    if (checkWin()) {
      setGameWon(true);
    } else {
      setGameWon(false);
    }
  }, [checkWin, grid]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't handle if user is typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Handle arrow keys for spatial navigation
      const arrowMap = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
      };
      if (arrowMap[e.key]) {
        navigateHex(arrowMap[e.key]);
        e.preventDefault();
        return;
      }

      // Handle number keys (0-9)
      if (e.key >= '0' && e.key <= '9') {
        const number = parseInt(e.key, 10);
        if (selectedHex) {
          const availableNumbers = getAvailableNumbers();
          if (availableNumbers.includes(number)) {
            handleNumberInput(number);
          }
        }
        e.preventDefault();
      }
      
      // Handle backspace/delete to clear
      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedHex) {
        handleNumberInput(null);
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedHex, handleNumberInput, getAvailableNumbers, navigateHex]);

  return (
    <div className="app">
      <header className="header">
        <h1>Orbitals</h1>
        <p className="subtitle">Fill the orbits to match the center numbers</p>
      </header>

      <div className="game-container">
        <div className="game-board-wrapper">
          <div
            className="game-board"
            onClick={(e) => {
              // If clicking on the game board container (not on SVG), deselect
              if (e.target === e.currentTarget || e.target.className === 'game-board') {
                handleHexClick(null, null);
              }
            }}
          >
            <HexagonGrid
              grid={grid}
              centers={centers}
              selectedHex={selectedHex}
              onHexClick={handleHexClick}
              onHexRotate={handleRotate}
              hasDuplicates={hasDuplicates}
              rotationAngles={rotationAngles}
              rotatingOrbit={rotatingOrbit}
              isOrbitIncorrect={isOrbitIncorrect}
              isOrbitCorrect={isOrbitCorrect}
              hoveredHex={hoveredHex}
              onHexHover={setHoveredHex}
            />
          </div>
        </div>

        <div className="game-controls">
          {selectedHex && (() => {
            const availableNumbers = getAvailableNumbers();
            return (
              <div className="number-input">
                <h3>Enter Number (0-9)</h3>
                <p className="hint-text">Type 0-9 or click buttons. Numbers already in this orbit are disabled.</p>
                <div className="number-buttons">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
                    const isAvailable = availableNumbers.includes(num);
                    return (
                      <button
                        key={num}
                        onClick={() => isAvailable && handleNumberInput(num)}
                        className={`num-btn ${isAvailable ? 'available' : 'unavailable'}`}
                        disabled={!isAvailable}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => handleNumberInput(null)}
                  className="clear-btn"
                >
                  Clear
                </button>
              </div>
            );
          })()}

          {!selectedHex && (
            <div className="status">
              <p>Click a hexagon to start</p>
            </div>
          )}

          {gameWon && (
            <div className="win-message">
              <h2>✅ Solved!</h2>
              <p>All orbits are correctly filled!</p>
            </div>
          )}
        </div>
      </div>

      <div className="instructions">
        <h3>How to Play</h3>
        <ul>
          <li>Click a hexagon or use arrow keys to select it</li>
          <li>Type a number (0-9)</li>
          <li>Press Backspace/Delete to clear a hexagon</li>
          <li>Arrow keys (↑↓←→) to navigate between hexagons</li>
          <li>Each number can only appear once per orbit</li>
          <li>Click the center hexagon to rotate its orbit</li>
          <li>Sum of numbers in each orbit must equal the center number</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
