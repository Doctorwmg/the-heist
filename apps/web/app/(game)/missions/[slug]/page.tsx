'use client';

export default function MissionPage() {
  return (
    <main className="flex h-screen">
      <div className="w-1/4 border-r border-gray-800 p-4">
        <h2 className="text-lg font-bold">Mission Panel</h2>
        <p className="mt-2 text-sm text-gray-400">File explorer + objectives coming soon.</p>
      </div>
      <div className="w-1/2 border-r border-gray-800 p-4">
        <h2 className="text-lg font-bold">Code Editor</h2>
        <p className="mt-2 text-sm text-gray-400">Monaco editor coming soon.</p>
      </div>
      <div className="w-1/4 p-4">
        <h2 className="text-lg font-bold">Terminal</h2>
        <p className="mt-2 text-sm text-gray-400">xterm.js terminal coming soon.</p>
      </div>
    </main>
  );
}
