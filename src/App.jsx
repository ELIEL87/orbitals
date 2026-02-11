import { useState, useEffect, useCallback } from 'react';
import HexagonGrid from './components/HexagonGrid';
import ModeSelector from './components/ModeSelector';
import { useGame } from './hooks/useGame';
import { generateDailyPuzzle, generateFreePlayPuzzle } from './utils/puzzleGenerator';
import orbitsLogo from './assets/orbits_white.svg';
import './App.css';

function Game({ centers, blackHexagons }) {
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
    setGameWon(checkWin());
  }, [checkWin, grid]);

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
    </>
  );
}

function getTodayString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function App() {
  const [mode, setMode] = useState('daily');
  const [difficulty, setDifficulty] = useState('medium');
  const [puzzleConfig, setPuzzleConfig] = useState(null);
  const [puzzleKey, setPuzzleKey] = useState(0);
  const [page, setPage] = useState('landing');

  const generatePuzzle = useCallback((currentMode, currentDifficulty) => {
    if (currentMode === 'daily') {
      return generateDailyPuzzle(getTodayString());
    }
    return generateFreePlayPuzzle(currentDifficulty);
  }, []);

  useEffect(() => {
    setPuzzleConfig(generatePuzzle(mode, difficulty));
  }, [mode, difficulty, puzzleKey, generatePuzzle]);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setPuzzleKey(k => k + 1);
  };

  const handleDifficultyChange = (newDifficulty) => {
    setDifficulty(newDifficulty);
    setPuzzleKey(k => k + 1);
  };

  const handleNewPuzzle = () => {
    setPuzzleKey(k => k + 1);
  };

  const handlePlayFreePlay = () => {
    setMode('freeplay');
    setPuzzleKey(k => k + 1);
    setPage('game');
  };

  const handlePlayDaily = () => {
    setMode('daily');
    setPuzzleKey(k => k + 1);
    setPage('game');
  };

  if (!puzzleConfig && page === 'game') return null;

  if (page === 'landing') {
    return (
      <div className="landing-page">
        <img src={orbitsLogo} alt="Orbital Shift" className="landing-logo" />
        <h1 className="landing-title">Orbital Shift</h1>
        <p className="landing-description">
          Fill the orbits so each ring sums to its center number. No repeats allowed.
        </p>
        <div className="landing-buttons">
          <button className="landing-btn-primary" onClick={handlePlayDaily}>
            Daily Challenge
          </button>
          <button className="landing-btn-secondary" onClick={handlePlayFreePlay}>
            Free Play
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Orbital Shift</h1>
        <p className="subtitle">Fill the orbits to match the center numbers</p>
      </header>

      <ModeSelector
        mode={mode}
        difficulty={difficulty}
        onModeChange={handleModeChange}
        onDifficultyChange={handleDifficultyChange}
        onNewPuzzle={handleNewPuzzle}
      />

      <Game
        key={puzzleKey}
        centers={puzzleConfig.centers}
        blackHexagons={puzzleConfig.blackHexagons}
      />
    </div>
  );
}

export default App;
