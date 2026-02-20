export default function ModeSelector({
  mode,
  difficulty,
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
      {mode === 'daily' && (
        <p className="daily-date">{today}</p>
      )}

      {mode === 'freeplay' && (
        <div className="freeplay-controls">
          <div className="difficulty-selector">
            {['beginner', 'easy', 'medium', 'hard', 'extreme', 'insane'].map(d => (
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
