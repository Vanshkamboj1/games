import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Key, DoorOpen, User, RefreshCw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

const generateLevel = (size, difficulty) => {
  const start = { x: Math.floor(size / 2), y: Math.floor(size / 2) };
  
  let numKeys = 1;
  let wallDensity = 0.2;
  if (difficulty === 'medium') { numKeys = Math.max(1, Math.floor(size / 2)); wallDensity = 0.35; }
  if (difficulty === 'hard') { numKeys = Math.max(2, Math.floor(size / 1.5)); wallDensity = 0.5; }

  const allWalls = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (x < size - 1) allWalls.push({ x1: x, y1: y, x2: x + 1, y2: y }); 
      if (y < size - 1) allWalls.push({ x1: x, y1: y, x2: x, y2: y + 1 });
    }
  }

  allWalls.sort(() => Math.random() - 0.5);

  const finalWalls = [];

  const checkConnectivity = (testWalls) => {
    const visited = new Set();
    const queue = [{ x: 0, y: 0 }];
    visited.add('0,0');
    
    let count = 0;
    while (queue.length > 0) {
      const { x, y } = queue.shift();
      count++;

      const neighbors = [
        { x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 }
      ];

      for (const n of neighbors) {
        if (n.x >= 0 && n.x < size && n.y >= 0 && n.y < size) {
          const hasWall = testWalls.some(w => 
            (w.x1 === x && w.y1 === y && w.x2 === n.x && w.y2 === n.y) ||
            (w.x2 === x && w.y2 === y && w.x1 === n.x && w.y1 === n.y)
          );
          if (!hasWall && !visited.has(`${n.x},${n.y}`)) {
            visited.add(`${n.x},${n.y}`);
            queue.push(n);
          }
        }
      }
    }
    return count === size * size;
  };

  const targetWalls = Math.floor(allWalls.length * wallDensity);
  for (const w of allWalls) {
    if (finalWalls.length / 2 >= targetWalls) break; // divided by 2 because we push two-way
    
    const testWalls = [...finalWalls, w, { x1: w.x2, y1: w.y2, x2: w.x1, y2: w.y1 }];
    if (checkConnectivity(testWalls)) {
      finalWalls.push(w);
      finalWalls.push({ x1: w.x2, y1: w.y2, x2: w.x1, y2: w.y1 }); 
    }
  }

  const availableSpots = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (x !== start.x || y !== start.y) availableSpots.push({ x, y });
    }
  }
  availableSpots.sort(() => Math.random() - 0.5);

  const door = availableSpots.pop();
  const keys = [];
  for (let i = 0; i < numKeys; i++) {
    keys.push(availableSpots.pop());
  }

  return {
    size,
    start,
    keys,
    door,
    walls: finalWalls
  };
};

export default function MemoryPath() {
  const [gameState, setGameState] = useState('setup'); // setup, playing
  const [gridSize, setGridSize] = useState(3);
  const [difficulty, setDifficulty] = useState('easy');

  const [level, setLevel] = useState(null);
  const [player, setPlayer] = useState({ x: 0, y: 0 });
  const [collectedKeys, setCollectedKeys] = useState([]);
  const [status, setStatus] = useState('playing'); // playing, won
  const [bounceMsg, setBounceMsg] = useState('');

  const startGame = () => {
    const newLevel = generateLevel(gridSize, difficulty);
    setLevel(newLevel);
    setPlayer(newLevel.start);
    setCollectedKeys([]);
    setStatus('playing');
    setBounceMsg('');
    setGameState('playing');
  };

  const nextLevel = () => {
    startGame();
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
    if (keyIndex !== -1 && !collectedKeys.includes(keyIndex)) {
      setCollectedKeys(prev => [...prev, keyIndex]);
    }

    if (newX === level.door.x && newY === level.door.y) {
      if (collectedKeys.length >= level.keys.length || (keyIndex !== -1 && collectedKeys.length + 1 >= level.keys.length)) {
        setStatus('won');
      } else {
        setPlayer(level.start);
        setCollectedKeys([]); // Optional: reset keys if they hit the door without them
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
          
          <div className="mb-6 text-left">
            <label className="block text-gray-700 font-bold mb-2">Grid Size</label>
            <div className="flex flex-wrap gap-2">
              {[3, 4, 5, 6, 7].map(size => (
                <button
                  key={size}
                  onClick={() => setGridSize(size)}
                  className={`px-4 py-2 rounded-lg font-bold transition-colors ${gridSize === size ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  {size}x{size}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8 text-left">
            <label className="block text-gray-700 font-bold mb-2">Difficulty</label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={difficulty === 'easy'} onChange={() => setDifficulty('easy')} />
                <span className="font-semibold text-green-700">Easy (Few walls, 1 Key)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={difficulty === 'medium'} onChange={() => setDifficulty('medium')} />
                <span className="font-semibold text-yellow-600">Medium (More walls, Multiple Keys)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={difficulty === 'hard'} onChange={() => setDifficulty('hard')} />
                <span className="font-semibold text-red-600">Hard (Many walls, Many Keys)</span>
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-8">
      <div className="w-full max-w-4xl flex justify-between items-center mb-8">
        <button onClick={() => setGameState('setup')} className="bg-white px-4 py-2 rounded-md shadow text-gray-700 hover:bg-gray-50">Quit to Setup</button>
        <h1 className="text-3xl font-bold text-gray-800">Memory Path Game</h1>
        <div className="w-24"></div>
      </div>

      <div className="mb-4 text-center">
        <h2 className="text-xl font-bold text-gray-700">{level.size}x{level.size} Grid - {difficulty.toUpperCase()}</h2>
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
          <button onClick={nextLevel} className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-md font-bold shadow-lg">
            Generate Next Level
          </button>
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
          <li>Start at the center square.</li>
          <li>Some paths between squares are invisibly locked!</li>
          <li>Hitting a locked path bounces you back to the start!</li>
          <li>Collect all the keys first, then head to the exit door.</li>
          <li>Use <strong>Arrow Keys</strong> or on-screen buttons to move.</li>
        </ul>
      </div>
    </div>
  );
}
