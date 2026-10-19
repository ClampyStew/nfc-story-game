'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StartPage() {
  const [playerName, setPlayerName] = useState('');
  const router = useRouter();

  useEffect(() => {
    const storedData = localStorage.getItem('storyData');
    if (storedData) {
      const data = JSON.parse(storedData);
      if (data.playerName) setPlayerName(data.playerName);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }

    const storyData = {
      playerName: playerName.trim(),
      character: null,
      location: null,
      storyline: null,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem('storyData', JSON.stringify(storyData));
    router.push(`/scan?name=${encodeURIComponent(playerName.trim())}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-900/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-900/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-purple-900/10 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="max-w-md w-full">
          <div className="text-center mb-12">
            <div className="inline-block mb-6 animate-bounce">
              <div className="text-8xl">🎃</div>
            </div>

            <h1 className="text-7xl font-bold mb-4 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 bg-clip-text text-transparent animate-pulse">
              The Butcher&apos;s Maze
            </h1>

            <p className="text-gray-300 text-xl mb-2">Enter if you dare...</p>
            <p className="text-sm text-gray-500 italic">All paths lead to darkness</p>

            <div className="flex items-center justify-center gap-2 mt-6">
              <div className="w-16 h-px bg-gradient-to-r from-transparent to-red-500"></div>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <div className="w-16 h-px bg-gradient-to-l from-transparent to-red-500"></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl blur opacity-25"></div>

            <div className="relative bg-black/50 backdrop-blur-sm rounded-xl p-8 border border-red-900/50 shadow-2xl">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-500 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-500 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-500 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-500 rounded-br-lg"></div>

              <label htmlFor="playerName" className="block text-lg font-bold mb-4 text-gray-200">
                <span className="flex items-center gap-2">
                  <span className="text-2xl">👤</span>
                  Enter Your Name
                </span>
              </label>

              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Your name..."
                className="w-full px-5 py-4 rounded-lg bg-gray-900/80 border-2 border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/50 transition-all text-lg"
                maxLength={50}
                autoFocus
              />

              <button
                type="submit"
                className="w-full mt-6 px-6 py-4 rounded-lg font-bold text-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white transition-all duration-300 shadow-lg hover:shadow-red-500/50 hover:scale-105"
              >
                Begin Your Nightmare →
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <div className="inline-block px-4 py-2 bg-black/40 backdrop-blur-sm rounded-full border border-yellow-900/50">
              <p className="text-yellow-400 text-sm">
                ⚠️ Warning: Once you enter, there is no turning back
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}