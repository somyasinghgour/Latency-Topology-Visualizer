'use client';

import dynamic from "next/dynamic";

const Globe = dynamic(() => import("../components/Globe"), { ssr: false });

export default function HomeContent() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-6">3D Latency Topology Visualizer</h1>
      <Globe />
    </main>
  );
} 