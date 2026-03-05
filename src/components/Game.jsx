import { useState, useEffect, useCallback } from 'react';
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
    getOrbitSum,
    navigateHex,
  } = useGame(centers, blackHexagons, initialGrid);

  const [hoveredHex, setHoveredHex] = useState(null);
  const [gameWon, setGameWon] = useState(false);
  const [flipMode, setFlipMode] = useState(false);
  const [flipSource, setFlipSource] = useState(null);
  const [copied, setCopied] = useState(false);

  const shareText = mode === 'daily'
    ? `I solved today's Orbitals puzzle! 🎯`
    : `I solved an Orbitals puzzle! 🎯`;
  const shareUrl = window.location.href;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(`${shareText}\n${shareUrl}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [shareText, shareUrl]);

  const handleTwitterShare = useCallback(() => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [shareText, shareUrl]);

  const handleNativeShare = useCallback(() => {
    navigator.share({ title: 'Orbitals', text: shareText, url: shareUrl });
  }, [shareText, shareUrl]);

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

      if (e.key === ' ' || e.key === 'Enter') {
        if (selectedHex) {
          const hex = grid[`${selectedHex.q},${selectedHex.r}`];
          if (hex?.isCenter) {
            handleRotate(selectedHex.q, selectedHex.r);
          }
        }
        e.preventDefault();
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
  }, [selectedHex, handleNumberInput, navigateHex, handleRotate, grid]);

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
              getOrbitSum={getOrbitSum}
            />
          </div>
        </div>

        <div className="game-controls">
          {gameWon ? (
            <div className="solved-panel">
              <div className="solved-title">Solved!</div>
              <p className="solved-subtitle">All orbits complete</p>

              <div className="share-buttons">
                <button className="share-btn share-btn-copy" onClick={handleCopy}>
                  {copied ? '✓ Copied!' : '⎘ Copy'}
                </button>
                <button className="share-btn share-btn-twitter" onClick={handleTwitterShare}>
                  𝕏 Share
                </button>
                {typeof navigator.share === 'function' && (
                  <button className="share-btn share-btn-native" onClick={handleNativeShare}>
                    ↑ Share
                  </button>
                )}
              </div>

              {mode === 'daily' && onContinueFreePlay && (
                <button className="win-modal-btn" onClick={onContinueFreePlay}>
                  Continue in Free Play
                </button>
              )}
              {mode !== 'daily' && onNewPuzzle && (
                <button className="win-modal-btn" onClick={onNewPuzzle}>
                  New Puzzle
                </button>
              )}
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

    </>
  );
}

export default Game;
