import { useState, useCallback } from 'react';
import Game from './Game';
import { generateTutorialPuzzle } from '../utils/puzzleGenerator';

const STEPS = [
  {
    title: 'Single Orbit',
    description:
      'Click a hexagon to select it, then type a number (0-9). Each number can only appear once in the orbit. The numbers in the orbit must add up to the center number.',
  },
  {
    title: 'Overlapping Orbits',
    description:
      'When orbits overlap, shared hexagons count toward both orbit sums. Click a center hexagon to rotate its orbit and see which cells belong to it.',
  },
  {
    title: 'Black Hexagons',
    description:
      'Black hexagons are blocked — you can\'t place numbers on them. The orbit sum must still match the center, using only the available positions.',
  },
];

function Tutorial({ onBack, onFinish }) {
  const [step, setStep] = useState(0);
  const [puzzleKey, setPuzzleKey] = useState(0);
  const [stepWon, setStepWon] = useState(false);

  const puzzle = generateTutorialPuzzle(step);

  const handleWin = useCallback(() => {
    setStepWon(true);
  }, []);

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
      setStepWon(false);
      setPuzzleKey(k => k + 1);
    } else {
      onFinish();
    }
  };

  return (
    <div className="tutorial-page">
      <div className="tutorial-header">
        <button className="tutorial-back" onClick={onBack}>
          &larr; Back
        </button>
        <span className="tutorial-step-indicator">
          Step {step + 1} of 3
        </span>
      </div>

      <div className="tutorial-card">
        <h2>{STEPS[step].title}</h2>
        <p>{STEPS[step].description}</p>
      </div>

      <Game
        key={puzzleKey}
        centers={puzzle.centers}
        blackHexagons={puzzle.blackHexagons}
        onWin={handleWin}
        hideInstructions
      />

      {stepWon && (
        <div className="tutorial-nav">
          <button className="tutorial-nav-btn" onClick={handleNext}>
            {step < 2 ? 'Next Level' : 'Start Playing'}
          </button>
        </div>
      )}
    </div>
  );
}

export default Tutorial;
