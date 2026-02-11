export default function ModeSelector({
  mode,
  difficulty,
  onModeChange,
  onDifficultyChange,
  onNewPuzzle,
}) {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="mode-selector">
      <div className="mode-tabs">
        <button
          className={`mode-tab ${mode === 'daily' ? 'active' : ''}`}
          onClick={() => onModeChange('daily')}
        >
          Daily Challenge
        </button>
        <button
          className={`mode-tab ${mode === 'freeplay' ? 'active' : ''}`}
          onClick={() => onModeChange('freeplay')}
        >
          Free Play
        </button>
      </div>

      {mode === 'daily' && (
        <p className="daily-date">{today}</p>
      )}

      {mode === 'freeplay' && (
        <div className="freeplay-controls">
          <div className="difficulty-selector">
            {['easy', 'medium', 'hard', 'extreme'].map(d => (
              <button
                key={d}
                className={`difficulty-btn ${d} ${difficulty === d ? 'active' : ''}`}
                onClick={() => onDifficultyChange(d)}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
          <button className="new-puzzle-btn" onClick={onNewPuzzle}>
            New Puzzle
          </button>
        </div>
      )}
    </div>
  );
}
