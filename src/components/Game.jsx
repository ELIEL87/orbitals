import { useState, useEffect } from 'react';
import HexagonGrid from './HexagonGrid';
import { useGame } from '../hooks/useGame';

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function Game({ centers, blackHexagons, onWin, mode, onContinueFreePlay, onNewPuzzle, initialGrid }) {
  const {
    grid,
    selectedHex,
    centers: gameCenters,
    initializeGrid,
    handleHexClick,
    handleNumberInput,
    handleRotate,
    clearAll,
    checkWin,
    getAvailableNumbers,
    swapHexValues,
    hasDuplicates,
    rotationAngles,
    rotatingOrbit,
    isOrbitIncorrect,
    isOrbitCorrect,
    navigateHex,
  } = useGame(centers, blackHexagons, initialGrid);

  const [hoveredHex, setHoveredHex] = useState(null);
  const [gameWon, setGameWon] = useState(false);
  const [flipMode, setFlipMode] = useState(false);
  const [flipSource, setFlipSource] = useState(null);

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

  // Persist daily grid to localStorage on every change
  useEffect(() => {
    if (mode !== 'daily' || Object.keys(grid).length === 0) return;
    const gridToSave = Object.fromEntries(
      Object.entries(grid).map(([k, v]) => [k, { ...v, isRotating: false }])
    );
    localStorage.setItem(`orbital-daily-grid-${getTodayString()}`, JSON.stringify(gridToSave));
  }, [grid, mode]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'Escape') {
        setFlipMode(false);
        setFlipSource(null);
        e.preventDefault();
        return;
      }

      if (e.key === 'f' || e.key === 'F') {
        if (selectedHex) {
          setFlipMode(prev => {
            if (!prev) {
              setFlipSource(selectedHex);
              return true;
            } else {
              setFlipSource(null);
              return false;
            }
          });
        }
        e.preventDefault();
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
          handleNumberInput(number);
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
  }, [selectedHex, handleNumberInput, navigateHex]);

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
              onHexClick={(q, r) => {
                if (flipMode && flipSource) {
                  const srcKey = `${flipSource.q},${flipSource.r}`;
                  const dstKey = `${q},${r}`;
                  if (srcKey !== dstKey) {
                    swapHexValues(srcKey, dstKey);
                  }
                  setFlipMode(false);
                  setFlipSource(null);
                } else {
                  handleHexClick(q, r);
                }
              }}
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
          {selectedHex && (
            <div className="number-input">
              {flipMode ? (
                <p className="hint-text">Click another hex to swap values. Press F or Esc to cancel.</p>
              ) : (
                <h3>Enter Number (0-9)</h3>
              )}
              {!flipMode && (
                <div className="number-buttons">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button
                      key={num}
                      onClick={() => handleNumberInput(num)}
                      className="num-btn available"
                    >
                      {num}
                    </button>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', width: '100%' }}>
                {!flipMode && (
                  <button onClick={() => handleNumberInput(null)} className="clear-btn" style={{ flex: 1 }}>
                    Clear
                  </button>
                )}
                <button
                  onClick={() => {
                    if (flipMode) {
                      setFlipMode(false);
                      setFlipSource(null);
                    } else {
                      setFlipSource(selectedHex);
                      setFlipMode(true);
                    }
                  }}
                  className={`clear-btn${flipMode ? ' flip-active' : ''}`}
                  style={{ flex: 1 }}
                >
                  {flipMode ? 'Cancel Flip' : 'Flip (F)'}
                </button>
              </div>
            </div>
          )}

          {!selectedHex && (
            <div className="status">
              <p>Tap or click a hexagon to enter a number</p>
            </div>
          )}

          <button className="clear-all-btn" onClick={clearAll}>
            Clear All
          </button>
        </div>
      </div>

      {gameWon && (onContinueFreePlay || onNewPuzzle) && (
        <div className="win-modal-overlay">
          <div className="win-modal">
            <h2>Solved!</h2>
            <p>All orbits are correctly filled!</p>
            {mode === 'daily' ? (
              <button className="win-modal-btn" onClick={onContinueFreePlay}>
                Continue in Free Play
              </button>
            ) : (
              <button className="win-modal-btn" onClick={onNewPuzzle}>
                New Puzzle
              </button>
            )}
          </div>
        </div>
      )}

    </>
  );
}

export default Game;
