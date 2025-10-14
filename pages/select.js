import { useState } from "react";

export default function SelectPage() {
  const [player, setPlayer] = useState("");
  const [character, setCharacter] = useState("Knight");
  const [location, setLocation] = useState("Forest");
  const [storyline, setStoryline] = useState("The Lost Sword");
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player, character, location, storyline }),
    });
    const data = await res.json();
    setLoading(false);
    alert(data.success ? "Submitted successfully!" : "Failed: " + data.error);
  }

  return (
    <div className="flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-4">Create Your Story</h1>
      <input
        className="border rounded p-2 mb-2"
        placeholder="Player name"
        value={player}
        onChange={(e) => setPlayer(e.target.value)}
      />
      <select className="border rounded p-2 mb-2" value={character} onChange={(e) => setCharacter(e.target.value)}>
        <option>Knight</option>
        <option>Witch</option>
        <option>Explorer</option>
      </select>
      <select className="border rounded p-2 mb-2" value={location} onChange={(e) => setLocation(e.target.value)}>
        <option>Forest</option>
        <option>Desert</option>
        <option>Castle</option>
      </select>
      <select className="border rounded p-2 mb-2" value={storyline} onChange={(e) => setStoryline(e.target.value)}>
        <option>The Lost Sword</option>
        <option>The Dark Ritual</option>
        <option>Echoes of the Cave</option>
      </select>
      <button
        className="bg-blue-600 text-white rounded px-4 py-2"
        onClick={handleConfirm}
        disabled={loading}
      >
        {loading ? "Uploading..." : "Confirm Selection"}
      </button>
    </div>
  );
}
