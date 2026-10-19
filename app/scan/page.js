'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const CHARACTERS = [
  {
    id: 'naomi',
    name: 'Naomi',
    motive: 'Disproving danger, staying safe',
    description: 'A cautious investigator focused on disproving danger and staying safe. Armed with skepticism and a flashlight, Naomi approaches every mystery with scientific rigor.',
    prompt: 'A cautious figure with a flashlight, alert and skeptical in the darkness',
    icon: '🛡️',
    image: '/images/characters/naomi.jpg',
    color: 'from-blue-900 to-blue-700'
  },
  {
    id: 'eddie',
    name: 'Eddie',
    motive: 'Dares, ego, and thrill-seeking',
    description: 'A thrill-seeking daredevil driven by ego and dangerous challenges. Eddie never backs down from a dare, no matter how terrifying.',
    prompt: 'A confident silhouette moving boldly through shadows, seeking thrills',
    icon: '⚡',
    image: '/images/characters/eddie.jpg',
    color: 'from-red-900 to-red-700'
  },
  {
    id: 'clara',
    name: 'Clara',
    motive: 'Rationalizing and debunking myths',
    description: 'A rational investigator dedicated to debunking myths and supernatural claims. Clara believes everything has a logical explanation.',
    prompt: 'An analytical figure with measured movements, investigating every detail',
    icon: '🔬',
    image: '/images/characters/clara.jpg',
    color: 'from-purple-900 to-purple-700'
  },
  {
    id: 'jayden',
    name: 'Jayden',
    motive: 'Filming and "viral" proof',
    description: 'A content creator obsessed with filming viral proof of the supernatural. Everything must be documented for the world to see.',
    prompt: 'A figure filming with shaking hands, capturing supernatural phenomena',
    icon: '📹',
    image: '/images/characters/jayden.jpg',
    color: 'from-yellow-900 to-yellow-700'
  },
  {
    id: 'miles',
    name: 'Miles',
    motive: 'Compassion for ghosts, supernatural curiosity',
    description: 'A compassionate paranormal enthusiast curious about helping supernatural entities. Miles believes lost spirits deserve understanding.',
    prompt: 'A gentle presence reaching toward ethereal wisps, seeking connection',
    icon: '👻',
    image: '/images/characters/miles.jpg',
    color: 'from-green-900 to-green-700'
  }
];

const LOCATIONS = [
  {
    id: 'pumpkin-farm',
    name: 'Pumpkin Farm',
    description: 'A desolate farm where jack-o-lanterns glow with unnatural light',
    details: 'Glowing pumpkins, scarecrow, cellar',
    prompt: 'in a desolate pumpkin farm with glowing jack-o-lanterns and a menacing scarecrow guarding a dark cellar',
    icon: '🎃',
    image: '/images/locations/pumpkin-farm.jpg',
    color: 'from-orange-900 to-orange-700'
  },
  {
    id: 'library',
    name: 'Abandoned Library',
    description: 'Ancient texts whisper secrets from behind rusted chains',
    details: 'Chained books, whispering pages, iron door',
    prompt: 'in an ancient library with chained books, whispering pages, and a mysterious iron door',
    icon: '📚',
    image: '/images/locations/library.jpg',
    color: 'from-indigo-900 to-indigo-700'
  },
  {
    id: 'carnival',
    name: 'Abandoned Carnival',
    description: 'Rides move on their own, dolls watch with glass eyes',
    details: 'Carousel, prize dolls, funhouse mirrors',
    prompt: 'in an abandoned carnival with a creaking carousel, haunted prize dolls, and distorted funhouse mirrors',
    icon: '🎪',
    image: '/images/locations/carnival.jpg',
    color: 'from-pink-900 to-pink-700'
  },
  {
    id: 'cemetery',
    name: 'Foggy Cemetery',
    description: 'Thick fog conceals crumbling crypts and underground passages',
    details: 'Fog, collapsing crypt, torch-lit tunnels',
    prompt: 'in a fog-shrouded cemetery with a collapsing crypt entrance and torch-lit underground tunnels',
    icon: '⚰️',
    image: '/images/locations/cemetery.jpg',
    color: 'from-gray-900 to-gray-700'
  },
  {
    id: 'hospital',
    name: 'Derelict Hospital',
    description: 'Empty halls echo with phantom children and moving gurneys',
    details: "Rolling gurneys, children's laughter, basement",
    prompt: "in a derelict hospital with rolling gurneys, echoing children's laughter, and a forbidden basement",
    icon: '🏥',
    image: '/images/locations/hospital.jpg',
    color: 'from-teal-900 to-teal-700'
  },
  {
    id: 'parade',
    name: 'Ghost Parade',
    description: 'A parade frozen in time, mannequins that seem too alive',
    details: 'Empty floats, mannequins, cleaver float',
    prompt: 'at a ghostly parade with empty floats, lifeless mannequins, and a blood-stained cleaver float',
    icon: '🎭',
    image: '/images/locations/parade.jpg',
    color: 'from-red-900 to-red-700'
  }
];

const STORYLINES = [
  {
    id: 'lure',
    phase: 'The Lure',
    subtitle: 'First Strange Sign',
    description: "The character notices something that shouldn't exist in this place. It pulls them deeper, either out of curiosity, fear, or compulsion.",
    prompt: 'discovering an impossible anomaly that defies logic, drawn deeper by curiosity and dread',
    icon: '👁️',
    image: '/images/storylines/lure.jpg',
    color: 'from-blue-900 to-blue-700'
  },
  {
    id: 'escalation',
    phase: 'The Escalation',
    subtitle: 'The Place Comes Alive',
    description: 'The environment reacts unnaturally, removing the sense of safety. It becomes clear this is not just imagination or coincidence.',
    prompt: 'as the environment awakens with unnatural movement and hostile intent, removing all sense of safety',
    icon: '⚡',
    image: '/images/storylines/escalation.jpg',
    color: 'from-yellow-900 to-yellow-700'
  },
  {
    id: 'trap',
    phase: 'The Trap',
    subtitle: 'The Moment of No Escape',
    description: 'A sudden shift in the environment cuts off retreat, forcing the character inward. The location actively captures them.',
    prompt: 'trapped as the space violently shifts and seals all exits, forcing them deeper into darkness',
    icon: '🚪',
    image: '/images/storylines/trap.jpg',
    color: 'from-red-900 to-red-700'
  },
  {
    id: 'descent',
    phase: 'The Descent',
    subtitle: 'Transition to the Maze',
    description: 'The character is funneled into a new space - a twisting, unnatural labyrinth. The setting shifts to something darker and more oppressive.',
    prompt: 'descending into the winding passages, a twisted labyrinth that defies reality',
    icon: '🌀',
    image: '/images/storylines/descent.jpg',
    color: 'from-purple-900 to-purple-700'
  }
];

const SLOTS = [
  { key: 'character', label: 'CHARACTER', title: (s) => s.name },
  { key: 'location', label: 'LOCATION', title: (s) => s.name },
  { key: 'storyline', label: 'STORYLINE', title: (s) => s.phase }
];

function ScanPageContent() {
  const [playerName, setPlayerName] = useState('');
  const [selections, setSelections] = useState({
    character: null,
    location: null,
    storyline: null
  });
  const [scannedItem, setScannedItem] = useState(null);
  const [scannedType, setScannedType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const name = searchParams.get('name');
    if (!name) {
      router.push('/start');
      return;
    }

    setPlayerName(name);

    const storedData = localStorage.getItem('storyData');
    if (storedData) {
      const data = JSON.parse(storedData);
      setSelections({
        character: data.character || null,
        location: data.location || null,
        storyline: data.storyline || null
      });
    }

    const nfcParam = searchParams.get('nfc');
    if (nfcParam) {
      handleNFCScan(nfcParam);
    }
  }, [searchParams, router]);

  const handleNFCScan = (nfcValue) => {
    const value = nfcValue.toLowerCase();

    if (value === 'debug' || value === 'test') {
      setDebugMode((d) => !d);
      return;
    }

    let item = CHARACTERS.find((c) => c.id === value);
    if (item) {
      setScannedItem(item);
      setScannedType('character');
      return;
    }

    item = LOCATIONS.find((l) => l.id === value);
    if (item) {
      setScannedItem(item);
      setScannedType('location');
      return;
    }

    item = STORYLINES.find((s) => s.id === value);
    if (item) {
      setScannedItem(item);
      setScannedType('storyline');
      return;
    }

    alert('NFC tag not recognized. Please scan a valid tag.');
  };

  const handleUse = () => {
    if (!scannedItem || !scannedType) return;

    setSelections((prev) => ({ ...prev, [scannedType]: scannedItem }));

    const storedData = JSON.parse(localStorage.getItem('storyData') || '{}');
    storedData[scannedType] = scannedItem;
    localStorage.setItem('storyData', JSON.stringify(storedData));

    setScannedItem(null);
    setScannedType(null);
  };

  const handleReject = () => {
    setScannedItem(null);
    setScannedType(null);
  };

  const handleSubmit = async () => {
    if (!selections.character || !selections.location || !selections.storyline) {
      alert('Please scan all three types of NFC tags');
      return;
    }

    setLoading(true);

    try {
      const prompt = `Cinematic horror atmosphere: ${selections.character.prompt} ${selections.storyline.prompt} ${selections.location.prompt}. Eerie shadows, unsettling whispers, mysterious figures in darkness. All paths lead toward an ominous maze. Suspenseful mood, dramatic lighting, 6-second horror scene.`;

      const response = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName,
          character: selections.character.name,
          action: selections.storyline.phase,
          setting: selections.location.name,
          fullPrompt: prompt,
          generateVideo: true
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate story');
      }

      const storedData = JSON.parse(localStorage.getItem('storyData'));
      storedData.generatedPrompt = result.prompt;
      storedData.videoUrl = result.videoUrl;
      storedData.s3Path = result.s3Path;
      localStorage.setItem('storyData', JSON.stringify(storedData));

      router.push(`/result?name=${encodeURIComponent(playerName)}`);
    } catch (error) {
      alert('Error: ' + error.message);
      setLoading(false);
    }
  };

  const allSelected = selections.character && selections.location && selections.storyline;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-red-900/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-900/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto p-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
            Scan Your Story
          </h1>
          <div className="inline-block px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full border border-red-900/50">
            <p className="text-gray-300">
              Player: <span className="text-red-400 font-bold">{playerName}</span>
            </p>
          </div>
        </div>

        {/* Scanned item: Use / Reject */}
        {scannedItem && (
          <div className="mb-8 bg-black/50 backdrop-blur-sm rounded-xl p-8 border-2 border-red-500 animate-fadeIn">
            <div className="text-center mb-6">
              {scannedItem.image ? (
                <div className="mb-4">
                  <img
                    src={scannedItem.image}
                    alt={scannedItem.name || scannedItem.phase}
                    className="w-48 h-48 mx-auto rounded-lg object-cover border-2 border-red-500 shadow-lg"
                  />
                </div>
              ) : (
                <div className="text-7xl mb-4">{scannedItem.icon}</div>
              )}
              <h2 className="text-3xl font-bold text-white mb-2">
                {scannedItem.name || scannedItem.phase}
              </h2>
              <p className="text-red-400 italic mb-4">
                {scannedItem.motive || scannedItem.subtitle || scannedItem.details}
              </p>
              <p className="text-gray-300 leading-relaxed">{scannedItem.description}</p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleUse}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-lg transition-all"
              >
                ✓ Use This {scannedType?.charAt(0).toUpperCase() + scannedType?.slice(1)}
              </button>
              <button
                onClick={handleReject}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-lg transition-all"
              >
                ✕ Reject
              </button>
            </div>
          </div>
        )}

        {/* Current selections */}
        {!scannedItem && (
          <div className="space-y-4 mb-8">
            {SLOTS.map(({ key, label, title }) => {
              const sel = selections[key];
              return (
                <div
                  key={key}
                  className={`bg-black/50 backdrop-blur-sm rounded-xl p-6 border ${
                    sel ? 'border-green-500' : 'border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {sel?.image ? (
                        <img
                          src={sel.image}
                          alt={title(sel)}
                          className="w-16 h-16 rounded-lg object-cover border-2 border-gray-600"
                        />
                      ) : (
                        <div className="text-4xl">{sel?.icon || '❓'}</div>
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-gray-400">{label}</h3>
                        <p className="text-xl font-bold text-white">
                          {sel ? title(sel) : 'Scan NFC tag...'}
                        </p>
                      </div>
                    </div>
                    {sel && <div className="text-2xl text-green-400">✓</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Instructions / Submit */}
        {!scannedItem && (
          <div className="text-center">
            {!allSelected ? (
              <div>
                <div className="bg-black/50 backdrop-blur-sm rounded-xl p-8 border border-yellow-900/50 mb-4">
                  <div className="text-6xl mb-4 animate-pulse">📱</div>
                  <p className="text-xl text-yellow-400 font-bold mb-2">Scan an NFC Tag</p>
                  <p className="text-gray-400 text-sm">
                    Tap your phone to an NFC tag to add it to your story
                  </p>
                </div>

                {debugMode && (
                  <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-yellow-700 mt-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-yellow-400 font-bold">🔧 Debug Mode Active</p>
                      <button
                        onClick={() => setDebugMode(false)}
                        className="text-xs px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white"
                      >
                        Disable
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {[...CHARACTERS, ...LOCATIONS, ...STORYLINES].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleNFCScan(item.id)}
                          className={`px-3 py-2 bg-gradient-to-r ${item.color} text-white text-xs rounded`}
                        >
                          {item.icon} {item.name || item.phase}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`px-12 py-5 rounded-xl font-bold text-2xl transition-all ${
                  loading
                    ? 'bg-gray-700 text-gray-400 cursor-wait'
                    : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-2xl shadow-red-500/50 hover:scale-105 animate-pulse'
                }`}
              >
                {loading ? (
                  <span className="flex items-center gap-3">
                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </span>
                ) : (
                  '🎬 Submit & Generate!'
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950 flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      }
    >
      <ScanPageContent />
    </Suspense>
  );
}