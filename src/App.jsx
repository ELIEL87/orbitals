import { useState, useEffect, useCallback } from 'react';
import Game from './components/Game';
import Tutorial from './components/Tutorial';
import ModeSelector from './components/ModeSelector';
import { generateDailyPuzzle, generateFreePlayPuzzle } from './utils/puzzleGenerator';
import orbitsLogo from './assets/orbits_white.svg';
import './App.css';

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
  }, [mode, generatePuzzle]);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setPuzzleKey(k => k + 1);
  };

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
          setPuzzleKey(k => k + 1);
          setPage('game');
        }}
      />
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
