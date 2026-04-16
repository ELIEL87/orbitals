import { useState, useEffect, useCallback, useRef } from 'react';
import HexagonGrid from './HexagonGrid';
import { useGame } from '../hooks/useGame';
import { supabase } from '../lib/supabase';

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function Game({ centers, blackHexagons, onWin, mode, onContinueFreePlay, onNewPuzzle, initialGrid, onNextLevel, nextLevelLabel }) {
  const dailyTimerKey = mode === 'daily' ? `orbital-daily-timer-${getTodayString()}` : null;

  const {
    grid,
    selectedHex,
    focusedCenter,
    centers: gameCenters,
    initializeGrid,
    handleHexClick,
    handleNumberInput,
    handleRotate,
    clearAll,
    checkWin,
    getAvailableNumbers,
    swapHexValues,
    getHintHexKeys,
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
  const [submitName, setSubmitName] = useState('');
  const [submitStatus, setSubmitStatus] = useState('idle'); // 'idle' | 'submitting' | 'success' | 'error'
  const [submitOpen, setSubmitOpen] = useState(false);
  const alreadySubmitted = mode === 'daily'
    ? localStorage.getItem(`orbital-daily-submitted-${getTodayString()}`) === 'true'
    : false;
  const [flipMode, setFlipMode] = useState(false);
  const [flipSource, setFlipSource] = useState(null);
  const [hintKeys, setHintKeys] = useState(new Set());
  const hintTimerRef = useRef(null);
  const timerRef = useRef(null);
  const [elapsed, setElapsed] = useState(() => {
    if (mode === 'daily' && dailyTimerKey) {
      const saved = localStorage.getItem(dailyTimerKey);
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  const resetHintTimer = useCallback(() => {
    setHintKeys(new Set());
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => {
      const keys = getHintHexKeys();
      if (keys) setHintKeys(keys);
    }, 8000);
  }, [getHintHexKeys]);
  const handleNativeShare = useCallback(() => {
    const text = gameWon && mode === 'daily'
      ? `I solved today's Orbital Shift in ${formatTime(elapsed)} ⏱ Can you beat it? → orbitalshiftgame.com`
      : 'Numbers and orbits — can you crack it? Try Orbital Shift → orbitalshiftgame.com';
    navigator.share({ title: 'OrbitalShift', text });
  }, [gameWon, mode, elapsed]);

  useEffect(() => {
    initializeGrid();
  }, [initializeGrid]);

  useEffect(() => {
    const won = checkWin();
    setGameWon(won);
    if (won && onWin) {
      onWin();
    }
    if (won) {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      setHintKeys(new Set());
      if (mode === 'daily' && supabase && !alreadySubmitted) {
        setSubmitOpen(true);
      }
    }
  }, [checkWin, grid, onWin]);

  // Start hint timer when grid is ready
  useEffect(() => {
    if (Object.keys(grid).length > 0 && !gameWon) {
      resetHintTimer();
    }
    return () => { if (hintTimerRef.current) clearTimeout(hintTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Daily challenge timer
  useEffect(() => {
    if (mode !== 'daily' || gameWon) {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        if (dailyTimerKey) localStorage.setItem(dailyTimerKey, String(next));
        return next;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, gameWon]);

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
        if (focusedCenter) {
          handleRotate(focusedCenter.q, focusedCenter.r);
        } else if (selectedHex) {
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
        setHoveredHex(null);
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

    const handleKeyDownWithReset = (e) => {
      resetHintTimer();
      handleKeyDown(e);
    };

    window.addEventListener('keydown', handleKeyDownWithReset);
    return () => window.removeEventListener('keydown', handleKeyDownWithReset);
  }, [selectedHex, focusedCenter, handleNumberInput, navigateHex, handleRotate, grid, resetHintTimer]);

  const handleSubmitScore = useCallback(async () => {
    if (!supabase || !submitName.trim()) return;
    setSubmitStatus('submitting');
    const { error } = await supabase.from('daily_leaderboard').insert({
      date: getTodayString(),
      name: submitName.trim().slice(0, 20),
      time_seconds: elapsed,
    });
    if (error) {
      setSubmitStatus('error');
    } else {
      localStorage.setItem(`orbital-daily-submitted-${getTodayString()}`, 'true');
      setSubmitStatus('success');
      setTimeout(() => setSubmitOpen(false), 1200);
    }
  }, [submitName, elapsed]);

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
                resetHintTimer();
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
              onHexRotate={(q, r) => { resetHintTimer(); handleRotate(q, r); }}
              hasDuplicates={hasDuplicates}
              rotationAngles={rotationAngles}
              rotatingOrbit={rotatingOrbit}
              isOrbitIncorrect={isOrbitIncorrect}
              isOrbitCorrect={isOrbitCorrect}
              hoveredHex={hoveredHex}
              onHexHover={setHoveredHex}
              getOrbitSum={getOrbitSum}
              hintKeys={hintKeys}
              focusedCenter={focusedCenter}
            />
          </div>
        </div>

        <div className="game-controls">
          {mode === 'daily' && !gameWon && (
            <div className="daily-timer">{formatTime(elapsed)}</div>
          )}
          {gameWon ? (
            <div className="solved-panel">
              <div className="solved-title">Solved!</div>
              {mode === 'daily' && (
                <div className="solved-time">{formatTime(elapsed)}</div>
              )}
              <p className="solved-subtitle">All orbits complete</p>

              {mode === 'daily' && supabase && (
                submitStatus === 'success' || alreadySubmitted ? (
                  <p className="score-submit-success">
                    {submitStatus === 'success' ? 'Score submitted!' : 'Score already on leaderboard'}
                  </p>
                ) : (
                  <button className="solved-btn score-submit-btn" onClick={() => setSubmitOpen(true)}>
                    Add to Leaderboard
                  </button>
                )
              )}

              {onNextLevel ? (
                <button className="solved-btn" onClick={onNextLevel}>
                  {nextLevelLabel || 'Next Level'}
                </button>
              ) : (
                typeof navigator.share === 'function' && (
                  <button className="solved-btn" onClick={handleNativeShare}>
                    Share
                  </button>
                )
              )}

              {mode === 'daily' && onContinueFreePlay && (
                <button className="solved-btn" onClick={onContinueFreePlay}>
                  Continue in Free Play
                </button>
              )}
              {mode !== 'daily' && onNewPuzzle && (
                <button className="solved-btn" onClick={onNewPuzzle}>
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

      {submitOpen && (
        <div className="submit-modal-overlay" onClick={() => setSubmitOpen(false)}>
          <div className="submit-modal" onClick={e => e.stopPropagation()}>
            <div className="submit-modal-header">
              <h2>Add to Leaderboard</h2>
              <button className="help-modal-close" onClick={() => setSubmitOpen(false)}>×</button>
            </div>
            <p className="submit-modal-time">{formatTime(elapsed)}</p>
            {submitStatus === 'success' ? (
              <p className="submit-modal-success">Score submitted!</p>
            ) : (
              <>
                <input
                  className="submit-modal-input"
                  type="text"
                  placeholder="Your name"
                  value={submitName}
                  onChange={e => setSubmitName(e.target.value.slice(0, 20))}
                  maxLength={20}
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleSubmitScore(); }}
                />
                {submitStatus === 'error' && (
                  <p className="submit-modal-error">Failed to submit. Try again.</p>
                )}
                <button
                  className="submit-modal-btn"
                  onClick={handleSubmitScore}
                  disabled={!submitName.trim() || submitStatus === 'submitting'}
                >
                  {submitStatus === 'submitting' ? 'Submitting…' : 'Submit'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

    </>
  );
}

export default Game;
