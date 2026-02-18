import { useState, useCallback } from 'react';
import Game from './components/Game';
import Tutorial from './components/Tutorial';
import ModeSelector from './components/ModeSelector';
import { generateDailyPuzzle, generateFreePlayPuzzle } from './utils/puzzleGenerator';
import orbitsLogo from './assets/orbits_white.svg';
import './App.css';

const DAILY_STORAGE_KEY = 'orbital-daily-completed';

function getTodayString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function isDailyCompleted() {
  return localStorage.getItem(DAILY_STORAGE_KEY) === getTodayString();
}

function markDailyCompleted() {
  localStorage.setItem(DAILY_STORAGE_KEY, getTodayString());
}

function loadDailyGrid() {
  try {
    const saved = localStorage.getItem(`orbital-daily-grid-${getTodayString()}`);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function App() {
  const [mode, setMode] = useState('daily');
  const [difficulty, setDifficulty] = useState('medium');
  const [puzzleKey, setPuzzleKey] = useState(0);
  const [page, setPage] = useState('landing');
  const [helpOpen, setHelpOpen] = useState(false);

  const generatePuzzle = useCallback((currentMode, currentDifficulty) => {
    if (currentMode === 'daily') {
      return generateDailyPuzzle(getTodayString());
    }
    return generateFreePlayPuzzle(currentDifficulty);
  }, []);

  const [puzzleConfig, setPuzzleConfig] = useState(() => generatePuzzle(mode, difficulty));

  const handleDifficultyChange = (newDifficulty) => {
    const config = generatePuzzle(mode, newDifficulty);
    setDifficulty(newDifficulty);
    setPuzzleConfig(config);
    setPuzzleKey(k => k + 1);
  };

  const handleNewPuzzle = () => {
    setPuzzleConfig(generatePuzzle(mode, difficulty));
    setPuzzleKey(k => k + 1);
  };

  const handlePlayFreePlay = () => {
    setMode('freeplay');
    setPuzzleConfig(generatePuzzle('freeplay', difficulty));
    setPuzzleKey(k => k + 1);
    setPage('game');
  };

  const handlePlayDaily = () => {
    setMode('daily');
    setPuzzleConfig(generatePuzzle('daily', difficulty));
    setPuzzleKey(k => k + 1);
    setPage('game');
  };

  if (!puzzleConfig && page === 'game') return null;

  if (page === 'landing') {
    const dailyDone = isDailyCompleted();
    return (
      <div className="landing-page">
        <img src={orbitsLogo} alt="Orbital Shift" className="landing-logo" />
        <h1 className="landing-title">Orbital Shift</h1>
        <p className="landing-description">
          Fill the orbits so each ring sums to its center number. No repeats allowed.
        </p>
        <div className="landing-buttons">
          <button
            className={`landing-btn-primary${dailyDone ? ' completed' : ''}`}
            onClick={handlePlayDaily}
          >
            {dailyDone ? 'Daily Challenge ✓' : 'Daily Challenge'}
          </button>
          <button className="landing-btn-secondary" onClick={handlePlayFreePlay}>
            Free Play
          </button>
        </div>
        <button
          className="landing-how-to-play"
          onClick={() => setPage('tutorial')}
        >
          How to Play
        </button>
      </div>
    );
  }

  if (page === 'tutorial') {
    return (
      <Tutorial
        onBack={() => setPage('landing')}
        onFinish={() => {
          setMode('freeplay');
          setPuzzleConfig(generatePuzzle('freeplay', difficulty));
          setPuzzleKey(k => k + 1);
          setPage('game');
        }}
      />
    );
  }

  return (
    <div className="app">
      <header className="header">
        <button className="header-back" onClick={() => setPage('landing')}>← Back</button>
        <h1 className="header-title">Orbital Shift</h1>
        <button className="header-help" onClick={() => setHelpOpen(true)}>?</button>
      </header>

      <ModeSelector
        mode={mode}
        difficulty={difficulty}
        onDifficultyChange={handleDifficultyChange}
        onNewPuzzle={handleNewPuzzle}
      />

      <Game
        key={puzzleKey}
        centers={puzzleConfig.centers}
        blackHexagons={puzzleConfig.blackHexagons}
        mode={mode}
        initialGrid={mode === 'daily' ? loadDailyGrid() : null}
        onWin={() => { if (mode === 'daily') markDailyCompleted(); }}
        onContinueFreePlay={handlePlayFreePlay}
      />

      {helpOpen && (
        <div className="help-modal-overlay" onClick={() => setHelpOpen(false)}>
          <div className="help-modal" onClick={e => e.stopPropagation()}>
            <div className="help-modal-header">
              <h2>How to Play</h2>
              <button className="help-modal-close" onClick={() => setHelpOpen(false)}>×</button>
            </div>
            <ul className="help-modal-list">
              <li>Tap or click a hexagon to select it</li>
              <li>Enter a number (0–9) using the buttons or keyboard</li>
              <li>Press Backspace/Delete or Clear to erase a cell</li>
              <li>Each number can only appear once per orbit</li>
              <li>Tap a center hexagon to rotate its orbit</li>
              <li>The sum of numbers in each orbit must equal the center number</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
