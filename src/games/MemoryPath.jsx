import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Key, DoorOpen, User, RefreshCw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react';

// ---------------------------------------------------------------------------
// 20 hardcoded levels, grouped by difficulty. Each level was generated once
// offline with a maze-connectivity check (every cell reachable from every
// other cell despite the hidden "walls"), so every level is guaranteed
// solvable: the door and every key are always reachable from the start.
// walls: [x1, y1, x2, y2] = a hidden locked passage between two adjacent cells.
// ---------------------------------------------------------------------------
const LEVELS = [
  { id: 1, size: 3, difficulty: 'easy', start: [1, 1], keys: [[2, 0]], door: [1, 2], walls: [[1, 2, 2, 2]] },
  { id: 2, size: 3, difficulty: 'easy', start: [1, 1], keys: [[2, 1]], door: [0, 2], walls: [[1, 0, 1, 1]] },
  { id: 3, size: 4, difficulty: 'easy', start: [2, 2], keys: [[3, 0]], door: [3, 3], walls: [[3, 2, 3, 3], [2, 1, 3, 1], [2, 0, 3, 0]] },
  { id: 4, size: 3, difficulty: 'easy', start: [1, 1], keys: [[0, 2]], door: [0, 0], walls: [[1, 0, 2, 0]] },
  { id: 5, size: 4, difficulty: 'easy', start: [2, 2], keys: [[3, 1]], door: [1, 1], walls: [[0, 1, 0, 2], [1, 0, 1, 1], [3, 1, 3, 2]] },
  { id: 6, size: 3, difficulty: 'easy', start: [1, 1], keys: [[1, 0]], door: [2, 2], walls: [[2, 0, 2, 1]] },
  { id: 7, size: 4, difficulty: 'easy', start: [2, 2], keys: [[2, 3]], door: [3, 0], walls: [[2, 1, 3, 1], [0, 2, 1, 2], [3, 1, 3, 2]] },

  { id: 8, size: 4, difficulty: 'medium', start: [2, 2], keys: [[2, 1], [1, 0]], door: [0, 0], walls: [[3, 2, 3, 3], [2, 1, 3, 1], [3, 1, 3, 2], [0, 2, 0, 3], [1, 3, 2, 3], [0, 0, 0, 1]] },
  { id: 9, size: 5, difficulty: 'medium', start: [2, 2], keys: [[0, 0], [2, 4]], door: [0, 3], walls: [[2, 1, 2, 2], [3, 2, 4, 2], [2, 4, 3, 4], [0, 1, 0, 2], [0, 1, 1, 1], [3, 0, 3, 1], [0, 4, 1, 4], [2, 2, 3, 2], [3, 2, 3, 3], [1, 2, 2, 2], [2, 1, 3, 1]] },
  { id: 10, size: 4, difficulty: 'medium', start: [2, 2], keys: [[3, 0], [2, 0]], door: [1, 2], walls: [[0, 2, 0, 3], [1, 0, 1, 1], [0, 2, 1, 2], [3, 2, 3, 3], [1, 2, 2, 2], [1, 1, 1, 2]] },
  { id: 11, size: 5, difficulty: 'medium', start: [2, 2], keys: [[4, 0], [0, 2]], door: [3, 1], walls: [[0, 0, 1, 0], [3, 2, 4, 2], [1, 4, 2, 4], [2, 0, 3, 0], [1, 1, 2, 1], [2, 1, 2, 2], [0, 2, 0, 3], [1, 2, 1, 3], [3, 3, 3, 4], [3, 0, 3, 1], [2, 3, 3, 3]] },
  { id: 12, size: 4, difficulty: 'medium', start: [2, 2], keys: [[1, 1], [2, 3]], door: [3, 3], walls: [[1, 2, 2, 2], [2, 1, 3, 1], [0, 1, 1, 1], [0, 2, 1, 2], [2, 2, 2, 3], [3, 2, 3, 3]] },
  { id: 13, size: 5, difficulty: 'medium', start: [2, 2], keys: [[4, 3], [0, 0]], door: [0, 2], walls: [[0, 4, 1, 4], [3, 2, 4, 2], [0, 0, 0, 1], [0, 2, 0, 3], [4, 0, 4, 1], [3, 4, 4, 4], [1, 1, 1, 2], [0, 2, 1, 2], [2, 3, 3, 3], [1, 0, 2, 0], [1, 4, 2, 4]] },
  { id: 14, size: 5, difficulty: 'medium', start: [2, 2], keys: [[4, 1], [1, 4]], door: [0, 2], walls: [[0, 4, 1, 4], [4, 1, 4, 2], [4, 3, 4, 4], [3, 3, 3, 4], [1, 4, 2, 4], [1, 3, 2, 3], [0, 1, 0, 2], [4, 2, 4, 3], [1, 1, 2, 1], [2, 0, 2, 1], [3, 1, 3, 2]] },

  { id: 15, size: 5, difficulty: 'hard', start: [2, 2], keys: [[2, 0], [4, 2], [2, 4]], door: [1, 0], walls: [[2, 3, 2, 4], [1, 0, 2, 0], [0, 4, 1, 4], [1, 1, 1, 2], [0, 2, 0, 3], [1, 0, 1, 1], [3, 0, 3, 1], [2, 3, 3, 3], [3, 3, 3, 4], [3, 4, 4, 4], [4, 1, 4, 2], [1, 2, 2, 2], [3, 3, 4, 3], [1, 3, 2, 3], [2, 1, 2, 2], [3, 1, 4, 1]] },
  { id: 16, size: 6, difficulty: 'hard', start: [3, 3], keys: [[5, 3], [0, 3], [1, 0], [2, 0]], door: [0, 2], walls: [[2, 3, 3, 3], [0, 3, 1, 3], [2, 2, 3, 2], [1, 1, 2, 1], [3, 1, 4, 1], [0, 3, 0, 4], [4, 1, 5, 1], [3, 2, 3, 3], [2, 0, 2, 1], [3, 3, 4, 3], [1, 0, 2, 0], [3, 0, 3, 1], [4, 0, 4, 1], [0, 4, 1, 4], [2, 1, 2, 2], [0, 0, 1, 0], [4, 5, 5, 5], [2, 3, 2, 4], [2, 2, 2, 3], [1, 4, 1, 5], [3, 4, 3, 5], [2, 4, 2, 5], [4, 2, 4, 3], [4, 3, 4, 4]] },
  { id: 17, size: 5, difficulty: 'hard', start: [2, 2], keys: [[3, 1], [3, 4], [1, 1]], door: [2, 4], walls: [[3, 1, 3, 2], [3, 0, 4, 0], [0, 2, 1, 2], [2, 3, 2, 4], [3, 2, 3, 3], [2, 0, 2, 1], [2, 4, 3, 4], [0, 1, 0, 2], [1, 0, 2, 0], [3, 4, 4, 4], [4, 2, 4, 3], [2, 2, 2, 3], [0, 1, 1, 1], [1, 3, 1, 4], [4, 1, 4, 2], [2, 1, 2, 2]] },
  { id: 18, size: 6, difficulty: 'hard', start: [3, 3], keys: [[0, 3], [4, 2], [2, 2], [4, 5]], door: [5, 5], walls: [[3, 5, 4, 5], [0, 1, 0, 2], [1, 2, 1, 3], [4, 3, 4, 4], [3, 2, 3, 3], [4, 4, 4, 5], [0, 4, 0, 5], [2, 0, 2, 1], [2, 1, 3, 1], [0, 3, 0, 4], [4, 2, 4, 3], [3, 2, 4, 2], [1, 4, 2, 4], [3, 4, 4, 4], [4, 2, 5, 2], [2, 0, 3, 0], [2, 2, 3, 2], [4, 0, 4, 1], [2, 2, 2, 3], [2, 4, 3, 4], [2, 3, 3, 3], [1, 3, 2, 3], [3, 1, 4, 1], [2, 1, 2, 2]] },
  { id: 19, size: 6, difficulty: 'hard', start: [3, 3], keys: [[5, 4], [5, 3], [5, 0], [4, 5]], door: [1, 2], walls: [[1, 1, 2, 1], [4, 3, 4, 4], [2, 0, 3, 0], [2, 3, 2, 4], [3, 1, 3, 2], [2, 2, 2, 3], [3, 0, 4, 0], [1, 5, 2, 5], [0, 0, 0, 1], [1, 4, 1, 5], [4, 0, 5, 0], [0, 1, 1, 1], [0, 3, 0, 4], [0, 2, 0, 3], [4, 4, 5, 4], [3, 3, 4, 3], [1, 2, 2, 2], [2, 3, 3, 3], [5, 4, 5, 5], [2, 1, 2, 2], [3, 4, 4, 4], [1, 0, 1, 1], [4, 3, 5, 3], [3, 4, 3, 5]] },
  { id: 20, size: 6, difficulty: 'hard', start: [3, 3], keys: [[2, 1], [5, 2], [0, 4], [1, 1]], door: [4, 3], walls: [[1, 4, 1, 5], [1, 3, 2, 3], [2, 4, 2, 5], [3, 1, 3, 2], [0, 3, 1, 3], [0, 5, 1, 5], [5, 0, 5, 1], [2, 2, 3, 2], [4, 3, 5, 3], [0, 2, 0, 3], [0, 1, 1, 1], [2, 4, 3, 4], [2, 1, 2, 2], [4, 2, 5, 2], [0, 1, 0, 2], [2, 0, 3, 0], [3, 2, 3, 3], [4, 1, 4, 2], [2, 3, 2, 4], [5, 4, 5, 5], [4, 1, 5, 1], [3, 4, 3, 5], [1, 1, 2, 1], [3, 0, 4, 0]] },
];

// Build a { start, keys, door, walls, size } object from a hardcoded level,
// converting the compact array format into the {x,y} shape the game logic uses.
const buildLevel = (raw) => ({
  size: raw.size,
  start: { x: raw.start[0], y: raw.start[1] },
  keys: raw.keys.map(([x, y]) => ({ x, y })),
  door: { x: raw.door[0], y: raw.door[1] },
  walls: raw.walls.map(([x1, y1, x2, y2]) => ({ x1, y1, x2, y2 })),
});

const DIFFICULTIES = ['easy', 'medium', 'hard'];

export default function MemoryPath() {
  const [gameState, setGameState] = useState('setup'); // setup, playing
  const [difficulty, setDifficulty] = useState('easy');

  // index into the filtered list of levels for the current difficulty
  const [levelIndex, setLevelIndex] = useState(0);

  const [level, setLevel] = useState(null);
  const [player, setPlayer] = useState({ x: 0, y: 0 });
  const [collectedKeys, setCollectedKeys] = useState([]);
  const [status, setStatus] = useState('playing'); // playing, won
  const [bounceMsg, setBounceMsg] = useState('');

  const levelsForDifficulty = useMemo(
    () => LEVELS.filter(l => l.difficulty === difficulty),
    [difficulty]
  );

  const loadLevel = (idx) => {
    const list = levelsForDifficulty;
    const safeIdx = ((idx % list.length) + list.length) % list.length;
    const raw = list[safeIdx];
    const newLevel = buildLevel(raw);
    setLevelIndex(safeIdx);
    setLevel(newLevel);
    setPlayer(newLevel.start);
    setCollectedKeys([]);
    setStatus('playing');
    setBounceMsg('');
  };

  const startGame = () => {
    setGameState('playing');
    loadLevel(0);
  };

  const nextLevel = () => {
    loadLevel(levelIndex + 1);
  };

  const resetLevel = () => {
    setPlayer(level.start);
    setCollectedKeys([]);
    setStatus('playing');
    setBounceMsg('');
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing' || status !== 'playing') return;
      if (e.key === 'ArrowUp') { e.preventDefault(); movePlayer(0, -1); }
      if (e.key === 'ArrowDown') { e.preventDefault(); movePlayer(0, 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); movePlayer(-1, 0); }
      if (e.key === 'ArrowRight') { e.preventDefault(); movePlayer(1, 0); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [player, status, collectedKeys, gameState, level]);

  const movePlayer = (dx, dy) => {
    if (!level) return;
    const newX = player.x + dx;
    const newY = player.y + dy;

    if (newX < 0 || newX >= level.size || newY < 0 || newY >= level.size) return;

    const isWall = level.walls.some(w => w.x1 === player.x && w.y1 === player.y && w.x2 === newX && w.y2 === newY);

    if (isWall) {
      setPlayer(level.start);
      setCollectedKeys([]); // Reset collected keys on bounce
      setBounceMsg('Oops! You hit a hidden locked door and bounced back.');
      setTimeout(() => setBounceMsg(''), 2000);
      return;
    }

    setPlayer({ x: newX, y: newY });

    const keyIndex = level.keys.findIndex(k => k.x === newX && k.y === newY);
    const willHaveKeys = keyIndex !== -1 && !collectedKeys.includes(keyIndex)
      ? [...collectedKeys, keyIndex]
      : collectedKeys;

    if (keyIndex !== -1 && !collectedKeys.includes(keyIndex)) {
      setCollectedKeys(willHaveKeys);
    }

    if (newX === level.door.x && newY === level.door.y) {
      if (willHaveKeys.length >= level.keys.length) {
        setStatus('won');
      } else {
        setBounceMsg('You need to collect all keys first!');
        setTimeout(() => setBounceMsg(''), 2000);
      }
    }
  };

  if (gameState === 'setup') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center p-8">
        <div className="w-full max-w-4xl flex justify-between items-center mb-8">
          <Link to="/" className="bg-white px-4 py-2 rounded-md shadow text-gray-700 hover:bg-gray-50">Back to Menu</Link>
          <h1 className="text-3xl font-bold text-gray-800">Memory Path Game</h1>
          <div className="w-24"></div>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Game Setup</h2>

          <div className="mb-8 text-left">
            <label className="block text-gray-700 font-bold mb-2">Difficulty</label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={difficulty === 'easy'} onChange={() => setDifficulty('easy')} />
                <span className="font-semibold text-green-700">Easy (7 levels, 1 key each)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={difficulty === 'medium'} onChange={() => setDifficulty('medium')} />
                <span className="font-semibold text-yellow-600">Medium (7 levels, 2 keys each)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={difficulty === 'hard'} onChange={() => setDifficulty('hard')} />
                <span className="font-semibold text-red-600">Hard (6 levels, 3-4 keys each)</span>
              </label>
            </div>
          </div>

          <button
            onClick={startGame}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md w-full"
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }

  if (!level) return null;

  const isLastLevel = levelIndex === levelsForDifficulty.length - 1;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-8">
      <div className="w-full max-w-4xl flex justify-between items-center mb-8">
        <button onClick={() => setGameState('setup')} className="bg-white px-4 py-2 rounded-md shadow text-gray-700 hover:bg-gray-50">Quit to Setup</button>
        <h1 className="text-3xl font-bold text-gray-800">Memory Path Game</h1>
        <div className="w-24"></div>
      </div>

      <div className="mb-4 text-center">
        <h2 className="text-xl font-bold text-gray-700">
          Level {levelIndex + 1} / {levelsForDifficulty.length} &middot; {level.size}x{level.size} Grid &middot; {difficulty.toUpperCase()}
        </h2>
        <p className="text-gray-600">Keys Left: {level.keys.length - collectedKeys.length}</p>
      </div>

      <div className="h-12">
        {bounceMsg && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded-md font-semibold animate-pulse inline-block shadow">
            {bounceMsg}
          </div>
        )}
      </div>

      {status === 'won' && (
        <div className="mb-6 flex flex-col items-center">
          <div className="text-green-600 text-3xl font-bold mb-4 animate-bounce">Level Complete!</div>
          {isLastLevel ? (
            <div className="flex flex-col items-center gap-3">
              <div className="text-gray-700 font-semibold">You finished all {difficulty} levels!</div>
              <button onClick={() => loadLevel(0)} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-md font-bold shadow-lg">
                <RefreshCw className="w-5 h-5" /> Replay from Level 1
              </button>
            </div>
          ) : (
            <button onClick={nextLevel} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-md font-bold shadow-lg">
              Next Level <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      <div
        className="bg-gray-300 p-2 rounded-xl shadow-2xl inline-block"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${level.size}, minmax(0, 1fr))`,
          gap: '4px'
        }}
      >
        {Array.from({ length: level.size * level.size }).map((_, i) => {
          const x = i % level.size;
          const y = Math.floor(i / level.size);
          const isStart = level.start.x === x && level.start.y === y;
          const hasPlayer = player.x === x && player.y === y;

          const keyIndex = level.keys.findIndex(k => k.x === x && k.y === y);
          const hasKey = keyIndex !== -1 && !collectedKeys.includes(keyIndex);

          const isDoor = level.door.x === x && level.door.y === y;

          // Adjust sizing dynamically based on grid size
          let cellSize = 'w-20 h-20 sm:w-24 sm:h-24'; // 3x3
          if (level.size >= 6) cellSize = 'w-10 h-10 sm:w-12 sm:h-12';
          else if (level.size >= 4) cellSize = 'w-14 h-14 sm:w-16 sm:h-16';

          let iconSize = 'w-8 h-8';
          if (level.size >= 6) iconSize = 'w-6 h-6';

          return (
            <div
              key={i}
              className={`${cellSize} flex items-center justify-center rounded ${isStart && !hasPlayer ? 'bg-gray-400' : 'bg-white'}`}
            >
              {hasPlayer && <User className={`text-purple-600 ${level.size >= 6 ? 'w-8 h-8' : 'w-10 h-10'}`} />}
              {!hasPlayer && hasKey && <Key className={`text-yellow-500 ${iconSize}`} />}
              {!hasPlayer && isDoor && <DoorOpen className={`text-orange-800 ${iconSize}`} />}
            </div>
          )
        })}
      </div>

      {status !== 'won' && (
        <div className="mt-8 flex gap-4">
          <button onClick={resetLevel} className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md font-bold">
            <RefreshCw className="w-5 h-5" /> Reset Level
          </button>
        </div>
      )}

      {/* Mobile controls */}
      <div className="mt-8 grid grid-cols-3 gap-2 sm:hidden w-48">
        <div></div>
        <button onClick={() => movePlayer(0, -1)} className="bg-gray-200 hover:bg-gray-300 p-4 rounded-lg flex justify-center"><ArrowUp /></button>
        <div></div>
        <button onClick={() => movePlayer(-1, 0)} className="bg-gray-200 hover:bg-gray-300 p-4 rounded-lg flex justify-center"><ArrowLeft /></button>
        <button onClick={() => movePlayer(0, 1)} className="bg-gray-200 hover:bg-gray-300 p-4 rounded-lg flex justify-center"><ArrowDown /></button>
        <button onClick={() => movePlayer(1, 0)} className="bg-gray-200 hover:bg-gray-300 p-4 rounded-lg flex justify-center"><ArrowRight /></button>
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg shadow max-w-md w-full">
        <h3 className="font-bold mb-2">Game Rules:</h3>
        <ul className="list-disc pl-5 text-gray-700 space-y-1">
          <li>Start at the highlighted square.</li>
          <li>Some paths between squares are invisibly locked!</li>
          <li>Hitting a locked path bounces you back to the start!</li>
          <li>Collect all the keys first, then head to the exit door.</li>
          <li>Use <strong>Arrow Keys</strong> or on-screen buttons to move.</li>
        </ul>
      </div>
    </div>
  );
}