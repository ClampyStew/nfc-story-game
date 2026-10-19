'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ResultPageContent() {
  const [storyData, setStoryData] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const name = searchParams.get('name');

    if (!name) {
      router.push('/start');
      return;
    }

    const storedData = localStorage.getItem('storyData');
    if (!storedData) {
      router.push('/start');
      return;
    }

    const data = JSON.parse(storedData);

    if (!data.generatedPrompt || !data.videoUrl) {
      router.push(`/scan?name=${encodeURIComponent(name)}`);
      return;
    }

    setStoryData(data);
  }, [router, searchParams]);

  const handleStartOver = () => {
    localStorage.removeItem('storyData');
    router.push('/start');
  };

  const handleDownload = () => {
    alert('Video download will be implemented with S3 signed URLs');
  };

  if (!storyData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-red-900/5 to-transparent"></div>
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-red-900/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-purple-900/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-6">
            <div className="text-8xl animate-bounce">🎬</div>
          </div>
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 bg-clip-text text-transparent animate-pulse">
            Your Nightmare Awaits
          </h1>
          <div className="inline-block px-6 py-3 bg-black/50 backdrop-blur-sm rounded-full border border-red-900/50 mb-3">
            <p className="text-gray-300 text-xl">
              Player: <span className="text-red-400 font-bold">{storyData.playerName}</span>
            </p>
          </div>
          <p className="text-gray-500 italic text-sm">The maze has claimed another soul...</p>
        </div>

        {/* Video */}
        <div className="bg-black/50 backdrop-blur-sm rounded-xl p-8 mb-8 border-2 border-red-800/50 shadow-2xl shadow-red-900/30">
          <div className="flex items-center gap-3 mb-6">
            <div className="text-4xl">🎥</div>
            <h2 className="text-3xl font-bold text-red-400">Your Horror Video</h2>
          </div>

          <div className="bg-black rounded-xl aspect-video mb-6 flex items-center justify-center border-2 border-gray-700 overflow-hidden relative">
            {storyData.videoUrl ? (
              <div className="text-center p-8 w-full">
                <div className="text-7xl mb-6 animate-bounce">🎬</div>
                <div className="space-y-4">
                  <p className="text-green-400 text-2xl font-bold flex items-center justify-center gap-2">
                    <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                    Video Generated Successfully!
                  </p>
                  <div className="bg-gray-900 rounded-lg p-4 max-w-2xl mx-auto">
                    <p className="text-xs text-gray-500 mb-2">S3 URL:</p>
                    <p className="text-sm text-gray-300 font-mono break-all">{storyData.videoUrl}</p>
                  </div>
                  <p className="text-xs text-gray-600 mt-4">
                    💡 Note: Video playback needs S3 presigned URLs (not implemented)
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">Video not available</div>
            )}

            <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-red-500/50"></div>
            <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-red-500/50"></div>
            <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-red-500/50"></div>
            <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-red-500/50"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">📁</span>
                <span className="text-sm font-bold text-gray-400">S3 Location</span>
              </div>
              <p className="font-mono text-xs text-gray-300 break-all">{storyData.s3Path}</p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">✅</span>
                <span className="text-sm font-bold text-gray-400">Status</span>
              </div>
              <p className="text-green-400 font-bold text-lg flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Generation Complete
              </p>
            </div>
          </div>
        </div>

        {/* Story summary */}
        <div className="bg-black/50 backdrop-blur-sm rounded-xl p-8 mb-8 border border-gray-700/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="text-4xl">📖</div>
            <h2 className="text-3xl font-bold text-red-400">Your Story</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-5 border border-gray-700 hover:border-red-800 transition-all">
              <div className="text-4xl mb-3">{storyData.character.icon || '👤'}</div>
              <h3 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Character</h3>
              <p className="text-xl font-bold text-white mb-2">{storyData.character.name}</p>
              <p className="text-xs text-gray-400 italic leading-relaxed">{storyData.character.motive}</p>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-5 border border-gray-700 hover:border-red-800 transition-all">
              <div className="text-4xl mb-3">{storyData.location.icon || '🏚️'}</div>
              <h3 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Location</h3>
              <p className="text-xl font-bold text-white mb-2">{storyData.location.name}</p>
              <p className="text-xs text-gray-400 italic leading-relaxed">{storyData.location.description}</p>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-5 border border-gray-700 hover:border-red-800 transition-all">
              <div className="text-4xl mb-3">{storyData.storyline.icon || '🌀'}</div>
              <h3 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Phase</h3>
              <p className="text-xl font-bold text-white mb-2">{storyData.storyline.phase}</p>
              <p className="text-xs text-gray-400 italic leading-relaxed">{storyData.storyline.subtitle}</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-950/50 to-black/50 rounded-xl p-6 border-2 border-red-800/50">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">📝</span>
              <h3 className="text-sm font-bold text-red-400 uppercase tracking-wide">Generated Prompt</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">{storyData.generatedPrompt}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button
            onClick={handleDownload}
            className="px-8 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transition-all duration-300 shadow-lg hover:shadow-blue-500/50 hover:scale-105"
          >
            📥 Download Video
          </button>

          <button
            onClick={handleStartOver}
            className="px-8 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white transition-all duration-300 shadow-lg hover:shadow-red-500/50 hover:scale-105"
          >
            🔄 Create New Nightmare
          </button>
        </div>

        <div className="text-center">
          <div className="inline-block px-6 py-3 bg-black/70 backdrop-blur-sm rounded-full border border-gray-700">
            <p className="italic text-gray-400 text-sm">
              &quot;Once you enter the maze, there is no escape...&quot;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-pulse">🎬</div>
            <div className="text-white text-xl">Loading your nightmare...</div>
          </div>
        </div>
      }
    >
      <ResultPageContent />
    </Suspense>
  );
}