import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MathBubbles from './games/MathBubbles';
import MemoryPath from './games/MemoryPath';
import PathGame from './games/PathGame';

function MainMenu() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-4xl font-bold mb-8 text-gray-800">Game Platform</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
        <Link to="/game1" className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-6 px-4 rounded-xl shadow-md text-center text-xl transition-colors">
          Game 1: Math Bubbles (Ascending)
        </Link>
        <Link to="/game2" className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-6 px-4 rounded-xl shadow-md text-center text-xl transition-colors">
          Game 2: Math Bubbles (Descending)
        </Link>
        <Link to="/game3" className="bg-green-500 hover:bg-green-600 text-white font-semibold py-6 px-4 rounded-xl shadow-md text-center text-xl transition-colors">
          Game 3: Memory Path (Key & Door)
        </Link>
        <Link to="/game4" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-6 px-4 rounded-xl shadow-md text-center text-xl transition-colors">
          Game 4: Path Game
        </Link>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/game1" element={<MathBubbles order="asc" />} />
        <Route path="/game2" element={<MathBubbles order="desc" />} />
        <Route path="/game3" element={<MemoryPath />} />
        <Route path="/game4" element={<PathGame />} />
      </Routes>
    </Router>
  );
}

export default App;
