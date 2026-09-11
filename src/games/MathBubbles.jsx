import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const generateExpression = () => {
  const types = ['int_add', 'int_sub', 'int_mul', 'decimal_add', 'decimal_sub', 'fraction_add'];
  const type = types[Math.floor(Math.random() * types.length)];
  
  let text = '';
  let value = 0;

  if (type === 'int_mul') {
    const a = Math.floor(Math.random() * 8) + 1;
    const b = Math.floor(Math.random() * 8) + 1;
    text = `${a} * ${b}`;
    value = a * b;
  } else if (type === 'int_add') {
    const a = Math.floor(Math.random() * 50) + 1;
    const b = Math.floor(Math.random() * 50) + 1;
    text = `${a} + ${b}`;
    value = a + b;
  } else if (type === 'int_sub') {
    const a = Math.floor(Math.random() * 50) + 10;
    const b = Math.floor(Math.random() * a); 
    text = `${a} - ${b}`;
    value = a - b;
  } else if (type === 'decimal_add') {
    const a = (Math.random() * 10).toFixed(1);
    const b = (Math.random() * 10).toFixed(1);
    text = `${a} + ${b}`;
    value = parseFloat(a) + parseFloat(b);
  } else if (type === 'decimal_sub') {
    const a = (Math.random() * 10 + 5).toFixed(1);
    const b = (Math.random() * 5).toFixed(1);
    text = `${a} - ${b}`;
    value = parseFloat(a) - parseFloat(b);
  } else if (type === 'fraction_add') {
    const denoms = [2, 3, 4, 5];
    const d1 = denoms[Math.floor(Math.random() * denoms.length)];
    const d2 = denoms[Math.floor(Math.random() * denoms.length)];
    const n1 = Math.floor(Math.random() * d1) + 1;
    const n2 = Math.floor(Math.random() * d2) + 1;
    text = `${n1}/${d1} + ${n2}/${d2}`;
    value = (n1 / d1) + (n2 / d2);
  }
  
  return { text, value, id: Math.random() };
};

const generateExpressionsForDifficulty = (difficulty) => {
  let bubbles = [];
  let attempts = 0;
  
  while (attempts < 1000) {
    bubbles = [generateExpression(), generateExpression(), generateExpression()];
    const values = bubbles.map(b => b.value).sort((a, b) => a - b);
    const gap1 = values[1] - values[0];
    const gap2 = values[2] - values[1];
    const minGap = Math.min(gap1, gap2);
    const maxGap = Math.max(gap1, gap2);
    
    // Ensure unique values so there is a definitive order
    if (minGap < 0.01) {
      attempts++;
      continue;
    }

    if (difficulty === 'easy') {
      if (minGap >= 15) break;
    } else if (difficulty === 'medium') {
      if (minGap >= 4 && maxGap <= 15) break;
    } else if (difficulty === 'hard') {
      if (maxGap <= 3) break;
    }
    
    attempts++;
  }
  
  return bubbles;
};

const TOTAL_TEST_ROUNDS = 24;

export default function MathBubbles({ order }) {
  // Game Configuration State
  const [gameState, setGameState] = useState('setup'); // setup, playing, roundResult, testComplete
  const [timeLimit, setTimeLimit] = useState(15); // 15, 12.5, 10
  const [difficulty, setDifficulty] = useState('medium'); // easy, medium, hard
  const [isTestMode, setIsTestMode] = useState(false);

  // Round State
  const [bubbles, setBubbles] = useState([]);
  const [clicked, setClicked] = useState([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [roundStatus, setRoundStatus] = useState(null); // 'won', 'lost', 'timeout'

  const timerRef = useRef(null);

  const startGame = (testMode) => {
    setIsTestMode(testMode);
    setCurrentRound(1);
    setScore(0);
    initRound();
  };

  const initRound = () => {
    const newBubbles = generateExpressionsForDifficulty(difficulty);
    setBubbles(newBubbles);
    setClicked([]);
    setRoundStatus(null);
    setTimeLeft(timeLimit);
    setGameState('playing');
  };

  // Timer Effect
  useEffect(() => {
    if (gameState === 'playing' && timeLimit) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const next = prev - 0.1;
          return next <= 0 ? 0 : next;
        });
      }, 100);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState, timeLimit, currentRound]);

  // Handle Timeout Effect
  useEffect(() => {
    if (gameState === 'playing' && timeLeft === 0) {
      handleRoundEnd(false, 'timeout');
    }
  }, [timeLeft, gameState]);

  // Clean up when navigating between asc/desc
  useEffect(() => {
    setGameState('setup');
  }, [order]);

  const handleRoundEnd = (isWin, reason) => {
    clearInterval(timerRef.current);
    
    if (isWin) {
      setScore(prev => prev + 1);
    }

    if (isTestMode) {
      // In test mode, wait 300ms so user sees the click, then snap to next round
      setTimeout(() => {
        setCurrentRound(prev => {
          if (prev >= TOTAL_TEST_ROUNDS) {
            setGameState('testComplete');
            return prev;
          } else {
            // We can't call initRound directly here safely because it relies on difficulty state
            // But state inside setTimeout closure might be stale.
            // Better to trigger a re-init via a useEffect or call a wrapper.
            return prev + 1;
          }
        });
      }, 300);
    } else {
      setGameState('roundResult');
      setRoundStatus(reason || (isWin ? 'won' : 'lost'));
    }
  };

  // Effect to trigger initRound when currentRound changes in Test Mode
  useEffect(() => {
    if (isTestMode && currentRound > 1 && currentRound <= TOTAL_TEST_ROUNDS && gameState === 'playing') {
       // Wait, if gameState is 'playing', and currentRound increments, we should re-init the round.
       // The timeout above ONLY increments currentRound, so we can watch it here.
       const newBubbles = generateExpressionsForDifficulty(difficulty);
       setBubbles(newBubbles);
       setClicked([]);
       setTimeLeft(timeLimit);
    }
  }, [currentRound, isTestMode]);

  const nextRound = () => {
    setCurrentRound(prev => prev + 1);
    initRound();
  };

  const handleBubbleClick = (bubble) => {
    if (gameState !== 'playing') return;
    if (clicked.find(c => c.id === bubble.id)) return;

    const newClicked = [...clicked, bubble];
    setClicked(newClicked);

    if (isTestMode) {
      // In test mode, wait until all bubbles are clicked before evaluating
      if (newClicked.length === bubbles.length) {
        const sortedBubbles = [...bubbles].sort((a, b) => order === 'asc' ? a.value - b.value : b.value - a.value);
        let isCorrect = true;
        for (let i = 0; i < bubbles.length; i++) {
          if (newClicked[i].id !== sortedBubbles[i].id && newClicked[i].value !== sortedBubbles[i].value) {
            isCorrect = false;
            break;
          }
        }
        handleRoundEnd(isCorrect, isCorrect ? 'won' : 'lost');
      }
    } else {
      // In practice mode, provide instant feedback if they click the wrong bubble
      const sortedBubbles = [...bubbles].sort((a, b) => order === 'asc' ? a.value - b.value : b.value - a.value);
      const currentIndex = newClicked.length - 1;
      
      if (newClicked[currentIndex].id !== sortedBubbles[currentIndex].id) {
        if (newClicked[currentIndex].value !== sortedBubbles[currentIndex].value) {
          handleRoundEnd(false, 'lost');
          return;
        }
      }

      if (newClicked.length === bubbles.length) {
        handleRoundEnd(true, 'won');
      }
    }
  };

  if (gameState === 'setup') {
    return (
      <div className="min-h-screen bg-sky-100 flex flex-col items-center p-8">
        <div className="w-full max-w-4xl flex justify-between items-center mb-8">
          <Link to="/" className="bg-white px-4 py-2 rounded-md shadow text-gray-700 hover:bg-gray-50">Back to Menu</Link>
          <h1 className="text-3xl font-bold text-sky-800">
            Math Bubbles ({order === 'asc' ? 'Ascending' : 'Descending'})
          </h1>
          <div className="w-24"></div>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Game Setup</h2>
          
          <div className="mb-6 text-left">
            <label className="block text-gray-700 font-bold mb-2">Difficulty (Value Gap)</label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="diff" checked={difficulty === 'easy'} onChange={() => setDifficulty('easy')} />
                <span className="font-semibold text-green-700">Easy (Large Gap)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="diff" checked={difficulty === 'medium'} onChange={() => setDifficulty('medium')} />
                <span className="font-semibold text-yellow-600">Medium (Medium Gap)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="diff" checked={difficulty === 'hard'} onChange={() => setDifficulty('hard')} />
                <span className="font-semibold text-red-600">Hard (Small Gap / Decimals)</span>
              </label>
            </div>
          </div>

          <div className="mb-6 text-left">
            <label className="block text-gray-700 font-bold mb-2">Time Limit (per question)</label>
            <div className="flex gap-4 justify-center">
              {[15, 12.5, 10].map(time => (
                <button
                  key={time}
                  onClick={() => setTimeLimit(time)}
                  className={`px-4 py-2 rounded-lg font-bold transition-colors ${timeLimit === time ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  {time}s
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button 
              onClick={() => startGame(false)}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-md w-full"
            >
              Start Practice (Infinite)
            </button>
            <button 
              onClick={() => startGame(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-md w-full"
            >
              Start Dedicated Test (24 Qs)
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'testComplete') {
    return (
      <div className="min-h-screen bg-sky-100 flex flex-col items-center justify-center p-8">
        <div className="bg-white p-10 rounded-2xl shadow-2xl text-center max-w-lg w-full">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Test Complete!</h2>
          <p className="text-gray-600 mb-8 text-lg">You completed all {TOTAL_TEST_ROUNDS} questions on <strong>{difficulty}</strong> difficulty.</p>
          
          <div className="text-6xl font-extrabold text-blue-600 mb-8">
            {score} / {TOTAL_TEST_ROUNDS}
          </div>
          
          <div className="flex gap-4 justify-center">
             <button onClick={() => setGameState('setup')} className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold shadow">
              Change Settings
            </button>
            <button onClick={() => startGame(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold shadow">
              Retake Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-100 flex flex-col items-center p-8">
      <div className="w-full max-w-4xl flex justify-between items-center mb-8">
        <button onClick={() => setGameState('setup')} className="bg-white px-4 py-2 rounded-md shadow text-gray-700 hover:bg-gray-50">Quit to Setup</button>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-sky-800">
            {order === 'asc' ? 'Lowest to Highest' : 'Highest to Lowest'}
          </h1>
          {isTestMode && <div className="text-sky-600 font-semibold">Question {currentRound} of {TOTAL_TEST_ROUNDS}</div>}
        </div>
        <div className="bg-white px-4 py-2 rounded-md shadow text-gray-700 font-bold">
          {isTestMode ? "Test Mode" : `Score: ${score}`}
        </div>
      </div>

      <div className="mb-8">
        <div className={`text-3xl font-mono font-bold px-6 py-2 rounded-full ${timeLeft <= 3 ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-gray-800 shadow'}`}>
          {timeLeft.toFixed(1)}s
        </div>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center w-full">
        {gameState === 'roundResult' && (
          <div className="mb-8 text-center">
            {roundStatus === 'won' && <h2 className="text-4xl font-bold text-green-600 mb-4 animate-bounce">Correct!</h2>}
            {roundStatus === 'lost' && <h2 className="text-4xl font-bold text-red-600 mb-4">Wrong Order!</h2>}
            {roundStatus === 'timeout' && <h2 className="text-4xl font-bold text-orange-600 mb-4">Time's Up!</h2>}
            
            <button onClick={nextRound} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full font-bold shadow-lg">
              Next Question
            </button>
          </div>
        )}

        <div className="flex gap-8 justify-center flex-wrap">
          {bubbles.map((bubble) => {
            const isClicked = clicked.find(c => c.id === bubble.id);
            return (
              <button
                key={bubble.id}
                onClick={() => handleBubbleClick(bubble)}
                disabled={isClicked || gameState !== 'playing'}
                className={`w-32 h-32 rounded-full flex items-center justify-center text-xl font-bold shadow-xl transition-transform duration-300 transform hover:scale-110 
                  ${isClicked ? 'bg-gray-300 opacity-50 cursor-not-allowed scale-90' : 'bg-gradient-to-br from-blue-400 to-blue-600 text-white cursor-pointer'}
                `}
              >
                {bubble.text}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  );
}
