import { useState, useEffect } from 'react';
import HexagonGrid from './HexagonGrid';
import { useGame } from '../hooks/useGame';

function Game({ centers, blackHexagons, onWin, hideInstructions }) {
  const {
    grid,
    selectedHex,
    centers: gameCenters,
    initializeGrid,
    handleHexClick,
    handleNumberInput,
    handleRotate,
    checkWin,
    getAvailableNumbers,
    hasDuplicates,
    rotationAngles,
    rotatingOrbit,
    isOrbitIncorrect,
    isOrbitCorrect,
    navigateHex,
  } = useGame(centers, blackHexagons);

  const [hoveredHex, setHoveredHex] = useState(null);
  const [gameWon, setGameWon] = useState(false);

  useEffect(() => {
    initializeGrid();
  }, [initializeGrid]);

  useEffect(() => {
    const won = checkWin();
    setGameWon(won);
    if (won && onWin) {
      onWin();
    }
  }, [checkWin, grid, onWin]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

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

      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedHex) {
        handleNumberInput(null);
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedHex, handleNumberInput, getAvailableNumbers, navigateHex]);

  return (
    <>
      <div className="game-container">
        <div className="game-board-wrapper">
          <div
            className="game-board"
            onClick={(e) => {
              if (e.target === e.currentTarget || e.target.className === 'game-board') {
                handleHexClick(null, null);
              }
            }}
          >
            <HexagonGrid
              grid={grid}
              centers={gameCenters}
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
              <h2>Solved!</h2>
              <p>All orbits are correctly filled!</p>
            </div>
          )}
        </div>
      </div>

      {!hideInstructions && (
        <div className="instructions-wrapper">
          <div className="instructions">
            <h3>How to Play</h3>
            <ul>
              <li>Click a hexagon or use arrow keys to select it</li>
              <li>Type a number (0-9)</li>
              <li>Press Backspace/Delete to clear a hexagon</li>
              <li>Arrow keys to navigate between hexagons</li>
              <li>Each number can only appear once per orbit</li>
              <li>Click the center hexagon to rotate its orbit</li>
              <li>Sum of numbers in each orbit must equal the center number</li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

export default Game;
