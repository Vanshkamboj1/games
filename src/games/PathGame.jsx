import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Rocket,
  Globe2,
  RotateCcw,
  Shuffle,
  CheckCircle2,
  RefreshCw,
  Trophy,
} from 'lucide-react';

// A clockwise rotation also rotates every arrow inside the 3x3 block.
const rotateArrow = (arrow) => {
  if (arrow === 'U') return 'R';
  if (arrow === 'R') return 'D';
  if (arrow === 'D') return 'L';
  if (arrow === 'L') return 'U';
  return arrow;
};

const rotateBlock = (blockGrid) => {
  const newGrid = [
    ['W', 'W', 'W'],
    ['W', 'W', 'W'],
    ['W', 'W', 'W'],
  ];

  for (let y = 0; y < 3; y += 1) {
    for (let x = 0; x < 3; x += 1) {
      newGrid[x][2 - y] = rotateArrow(blockGrid[y][x]);
    }
  }

  return newGrid;
};

/*
  Cross block:
  - The BLACK-CELL MASK NEVER CHANGES between layouts.
  - Layout 0 = straight route
  - Layout 1 = clockwise corner
  - Layout 2 = counter-clockwise corner

  Rotation then gives the other orientations.
*/
const BLOCKS = [
  {
    name: 'Cross',
    layouts: [
      [
        ['W', 'U', 'W'],
        ['.', 'R', '.'],
        ['W', 'D', 'W'],
      ],
      [
        ['W', 'U', 'W'],
        ['.', 'D', '.'],
        ['W', '.', 'W'],
      ],
      [
        ['W', 'U', 'W'],
        ['.', 'U', '.'],
        ['W', '.', 'W'],
      ],
    ],
  },
  {
    name: 'Empty',
    layouts: [
      [
        ['W', 'W', 'W'],
        ['W', 'W', 'W'],
        ['W', 'W', 'W'],
      ],
    ],
  },
];

/*
  Dedicated level set.

  Each token represents one 3x3 block in ROW-MAJOR order:
    "LR" -> layout L, rotation R
    "e"  -> empty block

  This is deliberately static: there is NO procedural puzzle generator or
  runtime solver. Every level was designed from a known valid route.
*/
const LEVELS = [
  // EASY - 6x6
  {
    id: 1,
    name: 'First Turn',
    difficulty: 'Easy',
    gridSize: 2,
    moveLimit: 14,
    blocks: ['22', '11', 'e', '12'],
  },
  {
    id: 2,
    name: 'Bottom Hook',
    difficulty: 'Easy',
    gridSize: 2,
    moveLimit: 14,
    blocks: ['02', '23', '12', '02'],
  },
  {
    id: 3,
    name: 'Crossroad',
    difficulty: 'Easy',
    gridSize: 2,
    moveLimit: 14,
    blocks: ['02', '02', '10', '20'],
  },
  {
    id: 4,
    name: 'Mirror Cross',
    difficulty: 'Easy',
    gridSize: 2,
    moveLimit: 14,
    blocks: ['02', '21', '10', '02'],
  },

  // MEDIUM - 9x9
  {
    id: 5,
    name: 'Right Sweep',
    difficulty: 'Medium',
    gridSize: 3,
    moveLimit: 18,
    blocks: ['01', '22', '12', 'e', 'e', '23', 'e', '11', '12'],
  },
  {
    id: 6,
    name: 'Left Sweep',
    difficulty: 'Medium',
    gridSize: 3,
    moveLimit: 18,
    blocks: ['11', '21', '23', '02', 'e', 'e', '22', '22', '02'],
  },
  {
    id: 7,
    name: 'Middle Zig',
    difficulty: 'Medium',
    gridSize: 3,
    moveLimit: 20,
    blocks: ['23', '13', '01', '02', '10', '03', 'e', '01', '23'],
  },
  {
    id: 8,
    name: 'S Curve',
    difficulty: 'Medium',
    gridSize: 3,
    moveLimit: 22,
    blocks: ['02', '02', '02', '20', '22', '20', '02', '03', '13'],
  },

  // HARD / EXPERT - 9x9
  {
    id: 9,
    name: 'Upper Snake',
    difficulty: 'Hard',
    gridSize: 3,
    moveLimit: 26,
    blocks: ['02', '03', '02', '11', '00', '00', '20', '23', '02'],
  },
  {
    id: 10,
    name: 'Lower Snake',
    difficulty: 'Hard',
    gridSize: 3,
    moveLimit: 30,
    blocks: ['03', '22', '03', '13', '02', '20', '10', '13', '02'],
  },
  {
    id: 11,
    name: 'Full Snake',
    difficulty: 'Expert',
    gridSize: 3,
    moveLimit: 34,
    blocks: ['12', '21', '02', '20', '03', '12', '22', '13', '22'],
  },
  {
    id: 12,
    name: 'Deep Zig',
    difficulty: 'Expert',
    gridSize: 3,
    moveLimit: 30,
    blocks: ['23', '13', '23', '10', '00', '11', '22', '21', '02'],
  },
];

const makeBlock = (token) => {
  if (token === 'e') {
    const grid = BLOCKS[1].layouts[0].map((row) => [...row]);
    return {
      template: 1,
      layoutIdx: 0,
      rot: 0,
      grid,
    };
  }

  const layoutIdx = Number(token[0]);
  const rot = Number(token[1]);
  let grid = BLOCKS[0].layouts[layoutIdx].map((row) => [...row]);

  for (let i = 0; i < rot; i += 1) {
    grid = rotateBlock(grid);
  }

  return {
    template: 0,
    layoutIdx,
    rot,
    grid,
  };
};

const buildBlocksForLevel = (level) => level.blocks.map(makeBlock);

export default function PathGame() {
  const [gameState, setGameState] = useState('setup');
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [level, setLevel] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [selectedBlockIdx, setSelectedBlockIdx] = useState(null);
  const [pathResult, setPathResult] = useState(null);
  const [moves, setMoves] = useState(0);

  const loadLevel = (index) => {
    const preset = LEVELS[index];
    setSelectedLevel(index);
    setLevel(preset);
    setBlocks(buildBlocksForLevel(preset));
    setSelectedBlockIdx(0);
    setPathResult(null);
    setMoves(0);
    setGameState('playing');
  };

  const resetLevel = () => loadLevel(selectedLevel);

  const canModify =
    level &&
    selectedBlockIdx !== null &&
    blocks[selectedBlockIdx]?.template === 0 &&
    moves < level.moveLimit &&
    pathResult?.status !== 'won';

  const handleRotate = () => {
    if (!canModify) return;

    setBlocks((prev) =>
      prev.map((block, index) => {
        if (index !== selectedBlockIdx) return block;

        return {
          ...block,
          rot: (block.rot + 1) % 4,
          grid: rotateBlock(block.grid),
        };
      }),
    );

    setMoves((prev) => prev + 1);
    setPathResult(null);
  };

  const handleChangeLayout = () => {
    if (!canModify) return;

    setBlocks((prev) =>
      prev.map((block, index) => {
        if (index !== selectedBlockIdx) return block;

        const template = BLOCKS[block.template];
        const newLayoutIdx = (block.layoutIdx + 1) % template.layouts.length;
        let newGrid = template.layouts[newLayoutIdx].map((row) => [...row]);

        for (let i = 0; i < block.rot; i += 1) {
          newGrid = rotateBlock(newGrid);
        }

        return {
          ...block,
          layoutIdx: newLayoutIdx,
          grid: newGrid,
        };
      }),
    );

    setMoves((prev) => prev + 1);
    setPathResult(null);
  };

  const getCell = (r, c) => {
    const blockR = Math.floor(r / 3);
    const blockC = Math.floor(c / 3);

    if (
      !level ||
      blockR < 0 ||
      blockR >= level.gridSize ||
      blockC < 0 ||
      blockC >= level.gridSize
    ) {
      return null;
    }

    const blockIdx = blockR * level.gridSize + blockC;
    const localR = r % 3;
    const localC = c % 3;
    return blocks[blockIdx].grid[localR][localC];
  };

  const validatePath = () => {
    if (!level) return;

    let r = 1;
    let c = -1;
    let dir = 'R';

    const end = {
      r: level.gridSize * 3 - 2,
      c: level.gridSize * 3,
    };

    const maxSteps = level.gridSize * level.gridSize * 9 + 20;
    const tracedPath = [];
    const visitedStates = new Set();

    for (let step = 0; step < maxSteps; step += 1) {
      if (dir === 'U') r -= 1;
      else if (dir === 'D') r += 1;
      else if (dir === 'L') c -= 1;
      else if (dir === 'R') c += 1;

      // Endpoint sits just outside the final block.
      if (r === end.r && c === end.c) {
        setPathResult({ status: 'won', path: tracedPath });
        return;
      }

      if (r < 0 || r >= level.gridSize * 3 || c < 0 || c >= level.gridSize * 3) {
        setPathResult({ status: 'failed', path: tracedPath });
        return;
      }

      const cell = getCell(r, c);
      tracedPath.push({ r, c });

      if (!cell || cell === 'W') {
        setPathResult({ status: 'failed', path: tracedPath });
        return;
      }

      if (cell === 'U' || cell === 'D' || cell === 'L' || cell === 'R') {
        dir = cell;
      }

      const stateKey = `${r},${c},${dir}`;
      if (visitedStates.has(stateKey)) {
        setPathResult({ status: 'failed', path: tracedPath });
        return;
      }

      visitedStates.add(stateKey);
    }

    setPathResult({ status: 'failed', path: tracedPath });
  };

  const renderArrow = (dir) => {
    if (dir === '.') {
      return <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full" />;
    }

    let rotation = '';
    if (dir === 'R') rotation = 'rotate-0';
    if (dir === 'D') rotation = 'rotate-90';
    if (dir === 'L') rotation = 'rotate-180';
    if (dir === 'U') rotation = '-rotate-90';

    return (
      <svg
        className={`w-6 h-6 sm:w-8 sm:h-8 text-white ${rotation}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3}
          d="M14 5l7 7m0 0l-7 7m7-7H3"
        />
      </svg>
    );
  };

  if (gameState === 'setup') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center p-8 font-sans">
        <div className="w-full max-w-4xl flex justify-between items-center mb-8">
          <Link
            to="/"
            className="bg-white px-4 py-2 rounded shadow text-gray-700 hover:bg-gray-100 font-bold"
          >
            Back to Menu
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">3x3 Grid Path Builder</h1>
          <div className="w-24" />
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg max-w-3xl w-full">
          <h2 className="text-2xl font-bold mb-2 text-gray-800 text-center">Choose a Level</h2>
          <p className="text-gray-500 text-center mb-6">
            12 handcrafted puzzles. No procedural generation.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {LEVELS.map((item, index) => (
              <button
                key={item.id}
                onClick={() => loadLevel(index)}
                className="border-2 border-gray-300 rounded-lg p-4 text-left hover:bg-gray-50 hover:border-black transition"
              >
                <div className="font-bold text-gray-900">Level {item.id}</div>
                <div className="text-sm font-semibold text-gray-700">{item.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {item.difficulty} • {item.gridSize * 3}x{item.gridSize * 3}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!level || blocks.length === 0) return null;

  const failCell =
    pathResult?.status === 'failed' && pathResult.path.length > 0
      ? pathResult.path[pathResult.path.length - 1]
      : null;

  const remainingMoves = Math.max(0, level.moveLimit - moves);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-8 font-sans">
      <div className="w-full max-w-5xl flex justify-between items-center mb-4">
        <button
          onClick={() => setGameState('setup')}
          className="bg-gray-100 px-4 py-2 rounded shadow text-gray-700 hover:bg-gray-200 font-bold"
        >
          Level Select
        </button>

        <div className="font-bold text-gray-700">
          Level {level.id} / {LEVELS.length}
        </div>
      </div>

      <h1 className="text-4xl font-bold text-gray-900 mb-1">{level.name}</h1>
      <p className="text-gray-500 mb-2">
        {level.difficulty} • {level.gridSize * 3}x{level.gridSize * 3}
      </p>
      <p className="text-gray-600 max-w-2xl text-center mb-5">
        Select a 3x3 block. Rotate it or change its arrow layout. Connect the rocket to the planet.
      </p>

      <div className="flex items-center gap-6 mb-6 text-sm font-bold">
        <span>Moves: {moves} / {level.moveLimit}</span>
        <span>Remaining: {remainingMoves}</span>
      </div>

      <div className="flex items-center gap-4 mb-8 relative">
        <div
          className="absolute -left-12 flex items-center justify-center"
          style={{
            top: `${(1 / (level.gridSize * 3)) * 100}%`,
            transform: 'translateY(50%)',
          }}
        >
          <Rocket className="text-pink-500 w-8 h-8 rotate-45" />
        </div>

        <div
          className="border-4 border-black bg-black p-1 relative shadow-2xl"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${level.gridSize}, 1fr)`,
            gap: '4px',
          }}
        >
          {blocks.map((block, bIdx) => (
            <div
              key={bIdx}
              onClick={() => {
                setSelectedBlockIdx(bIdx);
                setPathResult(null);
              }}
              className={`transition-colors cursor-pointer ${
                selectedBlockIdx === bIdx
                  ? 'ring-4 ring-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] z-10'
                  : 'ring-2 ring-transparent hover:ring-gray-600'
              }`}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '2px',
              }}
            >
              {block.grid.map((row, rIdx) =>
                row.map((cell, cIdx) => {
                  const globalR = Math.floor(bIdx / level.gridSize) * 3 + rIdx;
                  const globalC = (bIdx % level.gridSize) * 3 + cIdx;
                  const isTraced = pathResult?.path.some(
                    (p) => p.r === globalR && p.c === globalC,
                  );
                  const isFailCell =
                    failCell?.r === globalR && failCell?.c === globalC;

                  let cellBg = cell === 'W' ? 'bg-white' : 'bg-black';
                  if (isTraced && cell !== 'W') cellBg = 'bg-green-600';
                  if (isFailCell) cellBg = 'bg-red-600';

                  const cellSize =
                    level.gridSize === 3
                      ? 'w-10 h-10 sm:w-14 sm:h-14'
                      : 'w-14 h-14 sm:w-20 sm:h-20';

                  return (
                    <div
                      key={`${rIdx}-${cIdx}`}
                      className={`${cellSize} flex items-center justify-center ${cellBg}`}
                    >
                      {cell !== 'W' && renderArrow(cell)}
                    </div>
                  );
                }),
              )}
            </div>
          ))}
        </div>

        <div
          className="absolute -right-12 flex items-center justify-center"
          style={{
            top: `${(level.gridSize * 3 - 2) / (level.gridSize * 3) * 100}%`,
            transform: 'translateY(-50%)',
          }}
        >
          <Globe2 className="text-orange-400 w-8 h-8" />
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={handleRotate}
          disabled={!canModify}
          className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 font-bold hover:bg-gray-50 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-5 h-5 text-blue-500" /> Rotate
        </button>

        <button
          onClick={handleChangeLayout}
          disabled={!canModify}
          className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 font-bold hover:bg-gray-50 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Shuffle className="w-5 h-5 text-blue-500" /> Change Layout
        </button>

        <button
          onClick={validatePath}
          className="flex items-center gap-2 px-6 py-3 border-2 border-black font-bold hover:bg-gray-100 shadow-sm"
        >
          <CheckCircle2 className="w-5 h-5 text-green-600" /> Validate
        </button>

        <button
          onClick={resetLevel}
          className="flex items-center gap-2 px-6 py-3 border-2 border-black font-bold hover:bg-gray-100 shadow-sm"
        >
          <RefreshCw className="w-5 h-5" /> Reset Level
        </button>
      </div>

      <div className="h-20 mt-6 flex items-center justify-center">
        {pathResult?.status === 'won' && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-2xl font-bold text-green-600 animate-pulse">
              <Trophy className="w-7 h-7" />
              Valid Path!
            </div>
            <button
              onClick={() => {
                if (selectedLevel < LEVELS.length - 1) {
                  loadLevel(selectedLevel + 1);
                } else {
                  setGameState('setup');
                }
              }}
              className="mt-3 bg-black text-white px-5 py-2 rounded font-bold hover:bg-gray-800"
            >
              {selectedLevel < LEVELS.length - 1 ? 'Next Level' : 'Back to Levels'}
            </button>
          </div>
        )}

        {pathResult?.status === 'failed' && (
          <div className="text-center text-xl font-bold text-red-600">
            Invalid Path. It hit a wall, looped, or went out of bounds.
          </div>
        )}

        {!pathResult && moves >= level.moveLimit && (
          <div className="text-center text-xl font-bold text-red-600">
            Move limit reached. Reset the level and try again.
          </div>
        )}
      </div>
    </div>
  );
}
