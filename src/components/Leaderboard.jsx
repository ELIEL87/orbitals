import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function Leaderboard({ date, refreshKey }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from('daily_leaderboard')
      .select('name, time_seconds')
      .eq('date', date)
      .order('time_seconds', { ascending: true })
      .limit(10)
      .then(({ data }) => {
        setEntries(data || []);
        setLoading(false);
      });
  }, [date, refreshKey]);

  if (!supabase || (!loading && entries.length === 0)) return null;

  return (
    <div className="leaderboard">
      <h2 className="leaderboard-title">Today's Best Times</h2>
      {loading ? (
        <div className="leaderboard-loading">Loading...</div>
      ) : (
        <ol className="leaderboard-list">
          {entries.map((entry, i) => (
            <li key={i} className={`leaderboard-row${i === 0 ? ' leaderboard-row--first' : ''}`}>
              <span className="lb-rank">{i + 1}</span>
              <span className="lb-name">{entry.name}</span>
              <span className="lb-time">{formatTime(entry.time_seconds)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
