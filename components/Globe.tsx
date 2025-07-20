'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, useTexture } from '@react-three/drei';
import { Suspense, useState, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTheme } from 'next-themes';
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import * as THREE from 'three';
import { Card } from "./ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Switch } from "./ui/switch";
import * as htmlToImage from 'html-to-image';
import { saveAs } from 'file-saver';

const LIGHT_MAP_URL = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg';
const DARK_MAP_URL = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg';


const EXCHANGES = [
  {
    name: 'Binance',
    lat: 1.3521, // Singapore
    lng: 103.8198,
    provider: 'AWS',
    location: 'Singapore',
    cloud: 'AWS',
  },
  {
    name: 'OKX',
    lat: 22.3193, // Hong Kong
    lng: 114.1694,
    provider: 'Azure',
    location: 'Hong Kong',
    cloud: 'Azure',
  },
  {
    name: 'Deribit',
    lat: 52.3676, // Amsterdam
    lng: 4.9041,
    provider: 'GCP',
    location: 'Amsterdam',
    cloud: 'GCP',
  },
  {
    name: 'Bybit',
    lat: 25.2048, // Dubai
    lng: 55.2708,
    provider: 'AWS',
    location: 'Dubai',
    cloud: 'AWS',
  },
];

const PROVIDER_COLORS: Record<string, string> = {
  AWS: '#facc15', 
  GCP: '#10b981', 
  Azure: '#3b82f6', 
};

const REGIONS = [
  { lat: 1.3, lng: 103.8, radius: 0.5, provider: 'AWS', name: 'Singapore (AWS)' },
  { lat: 22.3, lng: 114.2, radius: 0.5, provider: 'Azure', name: 'Hong Kong (Azure)' },
  { lat: 52.3, lng: 4.9, radius: 0.5, provider: 'GCP', name: 'Amsterdam (GCP)' },
  { lat: 25.2, lng: 55.2, radius: 0.5, provider: 'AWS', name: 'Dubai (AWS)' },
];

function latLngToXYZ(lat: number, lng: number, radius = 2) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return [x, y, z];
}

function GlobeMesh({ mapUrl, onMarkerHover, hoveredIndex }: { mapUrl: string, onMarkerHover: (i: number | null) => void, hoveredIndex: number | null }) {
  const texture = useTexture(mapUrl);
  return (
    <group>
      <mesh>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial map={texture} />
      </mesh>
      
      {EXCHANGES.map((ex, i) => {
        const [x, y, z] = latLngToXYZ(ex.lat, ex.lng, 2.05);
        return (
          <mesh
            key={ex.name}
            position={[x, y, z]}
            onPointerOver={() => onMarkerHover(i)}
            onPointerOut={() => onMarkerHover(null)}
          >
            <sphereGeometry args={[0.05, 32, 32]} />
            <meshStandardMaterial
              color={PROVIDER_COLORS[ex.provider]}
              emissive={PROVIDER_COLORS[ex.provider]}
              emissiveIntensity={hoveredIndex === i ? 1.2 : 0.7}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function getServerPairs(exchanges: typeof EXCHANGES) {
  const pairs: [number, number][] = [];
  for (let i = 0; i < exchanges.length; i++) {
    for (let j = i + 1; j < exchanges.length; j++) {
      pairs.push([i, j]);
    }
  }
  return pairs;
}


function getLatencyColor(latency: number) {
  if (latency < 80) return '#10b981'; 
  if (latency < 180) return '#facc15'; 
  return '#ef4444'; 
}

// Animated line 
function AnimatedLine({ start, end, latency, time }: { start: number[]; end: number[]; latency: number; time: number }) {
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(...start),
    new THREE.Vector3(
      (start[0] + end[0]) / 2,
      (start[1] + end[1]) / 2 + 0.7,
      (start[2] + end[2]) / 2
    ),
    new THREE.Vector3(...end)
  );
  const points = curve.getPoints(50);
  const color = getLatencyColor(latency);

  const pulseRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (pulseRef.current) {
      const t = (Date.now() / 500 + time) % 1; 
      const idx = Math.floor(t * points.length);
      const pos = points[idx];
      pulseRef.current.position.set(pos.x, pos.y, pos.z);
    }
  });

  return (
    <>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={points.length}
            array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
            itemSize={3}
            args={[new Float32Array(points.flatMap(p => [p.x, p.y, p.z])), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} linewidth={2} />
      </line>
      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.025, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} />
      </mesh>
    </>
  );
}

function generateMockHistory(pair: [number, number], range: string) {
  const now = Date.now();
  let points = 60;
  let interval = 60 * 1000; 
  if (range === '24h') { points = 24; interval = 60 * 60 * 1000; }
  if (range === '7d') { points = 7; interval = 24 * 60 * 60 * 1000; }
  if (range === '30d') { points = 30; interval = 24 * 60 * 60 * 1000; }
  return Array.from({ length: points }, (_, i) => ({
    time: new Date(now - (points - i) * interval).toLocaleTimeString(),
    latency: Math.floor(Math.random() * 300),
  }));
}

const TIME_RANGES = [
  { label: '1h', value: '1h' },
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
];

export default function Globe() {
  const { resolvedTheme, setTheme } = useTheme();
  const mapUrl = resolvedTheme === 'dark' ? DARK_MAP_URL : LIGHT_MAP_URL;
  const [hovered, setHovered] = useState<number | null>(null);

  const [latency, setLatency] = useState(() => {
    const pairs = getServerPairs(EXCHANGES);
    return Object.fromEntries(pairs.map(([a, b]) => [[a, b].join('-'), Math.floor(Math.random() * 300)]));
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(() => {
        const pairs = getServerPairs(EXCHANGES);
        return Object.fromEntries(pairs.map(([a, b]) => [[a, b].join('-'), Math.floor(Math.random() * 300)]));
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const [exchangeFilter, setExchangeFilter] = useState(EXCHANGES.map(() => true));
  const [providerFilter, setProviderFilter] = useState<{ [key: string]: boolean }>({ AWS: true, GCP: true, Azure: true });
  const [latencyRange, setLatencyRange] = useState<[number, number]>([0, 300]);
  const [regionOverlay, setRegionOverlay] = useState<{ [key: string]: boolean }>({ AWS: true, GCP: true, Azure: true });

  const filteredExchanges = EXCHANGES.filter((ex, i) => exchangeFilter[i] && providerFilter[ex.provider]);
  const filteredPairs = getServerPairs(filteredExchanges);

  const [selectedPair, setSelectedPair] = useState<[number, number]>([0, 1]);
  const [timeRange, setTimeRange] = useState('1h');
  const historyData = generateMockHistory(selectedPair, timeRange);
  const min = Math.min(...historyData.map(d => d.latency));
  const max = Math.max(...historyData.map(d => d.latency));
  const avg = Math.round(historyData.reduce((a, b) => a + b.latency, 0) / historyData.length);

  const chartRef = useRef<HTMLDivElement>(null);
  const handleExportPNG = async () => {
    if (chartRef.current) {
      const dataUrl = await htmlToImage.toPng(chartRef.current);
      saveAs(dataUrl, 'latency-chart.png');
    }
  };
  const handleExportCSV = () => {
    const csv = [
      'Time,Latency',
      ...historyData.map(d => `${d.time},${d.latency}`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    saveAs(blob, 'latency-chart.csv');
  };

  return (
    <div className="w-full flex flex-row items-start gap-6">
      {/* Globe and legend */}
      <div className="flex-1 flex flex-col items-center">
        <div className="w-full h-[500px] bg-background rounded-lg shadow relative">
          <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} intensity={1} />
            <Suspense fallback={null}>
              <GlobeMesh mapUrl={mapUrl} onMarkerHover={setHovered} hoveredIndex={hovered} />
              {REGIONS.filter(r => regionOverlay[r.provider]).map((region) => {
                const [x, y, z] = latLngToXYZ(region.lat, region.lng, 2.05);
                return (
                  <mesh key={region.name} position={[x, y, z]}>
                    <sphereGeometry args={[region.radius, 32, 32]} />
                    <meshStandardMaterial color={PROVIDER_COLORS[region.provider]} transparent opacity={0.2} />
                  </mesh>
                );
              })}
              {filteredPairs.map(([a, b], i) => {
                const start = latLngToXYZ(filteredExchanges[a].lat, filteredExchanges[a].lng, 2.05);
                const end = latLngToXYZ(filteredExchanges[b].lat, filteredExchanges[b].lng, 2.05);
                const key = [a, b].join('-');
                return (
                  <AnimatedLine
                    key={key}
                    start={start}
                    end={end}
                    latency={latency[key]}
                    time={i / filteredPairs.length}
                  />
                );
              })}
            </Suspense>
            <Stars radius={10} depth={50} count={5000} factor={4} fade />
            <OrbitControls enablePan enableZoom enableRotate />
          </Canvas>
          {hovered !== null && (
            <Popover open>
              <PopoverTrigger asChild>
                <div style={{ position: 'absolute', left: '50%', top: 40, transform: 'translateX(-50%)' }} />
              </PopoverTrigger>
              <PopoverContent className="w-64 text-sm">
                <div className="font-bold text-lg mb-1">{EXCHANGES[hovered].name}</div>
                <div>Location: {EXCHANGES[hovered].location}</div>
                <div>Cloud: <span style={{ color: PROVIDER_COLORS[EXCHANGES[hovered].provider] }}>{EXCHANGES[hovered].cloud}</span></div>
              </PopoverContent>
            </Popover>
          )}
        </div>
        <div className="flex gap-4 mt-4 p-3 rounded-lg bg-muted border w-fit shadow">
          {Object.entries(PROVIDER_COLORS).map(([provider, color]) => (
            <div key={provider} className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 rounded-full border" style={{ background: color, borderColor: color }} />
              <span className="text-sm font-medium">{provider}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Side panel */}
      <Card className="w-[350px] p-4 flex flex-col gap-4">
        <div className="font-bold text-lg mb-2">Controls</div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm">Light</span>
          <Switch checked={resolvedTheme === 'dark'} onCheckedChange={v => setTheme(v ? 'dark' : 'light')} />
          <span className="text-sm">Dark</span>
        </div>
        <div className="mb-2">
          <div className="text-xs font-medium mb-1">Exchanges</div>
          {EXCHANGES.map((ex, i) => (
            <div key={ex.name} className="flex items-center gap-2 mb-1">
              <Switch checked={exchangeFilter[i]} onCheckedChange={v => setExchangeFilter(f => { const arr = [...f]; arr[i] = v; return arr; })} />
              <span className="text-sm">{ex.name}</span>
            </div>
          ))}
        </div>
        <div className="mb-2">
          <div className="text-xs font-medium mb-1">Cloud Providers</div>
          {Object.keys(PROVIDER_COLORS).map(provider => (
            <div key={provider} className="flex items-center gap-2 mb-1">
              <Switch checked={providerFilter[provider]} onCheckedChange={v => setProviderFilter(f => ({ ...f, [provider]: v }))} />
              <span className="text-sm">{provider}</span>
            </div>
          ))}
        </div>

        
        <div className="mb-2">
          <div className="text-xs font-medium mb-1">Show Cloud Regions</div>
          {Object.keys(PROVIDER_COLORS).map(provider => (
            <div key={provider} className="flex items-center gap-2 mb-1">
              <Switch checked={regionOverlay[provider]} onCheckedChange={v => setRegionOverlay(f => ({ ...f, [provider]: v }))} />
              <span className="text-sm">{provider}</span>
            </div>
          ))}
        </div>



        <div className="mb-2">
          <div className="text-xs font-medium mb-1">Latency Range (ms)</div>
          <input type="range" min={0} max={300} value={latencyRange[1]} onChange={e => setLatencyRange([0, Number(e.target.value)])} className="w-full" />
          <div className="flex justify-between text-xs"><span>0</span><span>{latencyRange[1]}</span><span>300</span></div>
        </div>
        <div className="font-bold text-lg mb-2">Historical Latency Trends</div>
        <div className="mb-2">
          <label className="block text-sm font-medium mb-1">Server Pair</label>
          <select
            className="w-full border rounded p-1"
            value={selectedPair.join('-')}
            onChange={e => setSelectedPair(e.target.value.split('-').map(Number) as [number, number])}
          >
            {filteredPairs.map(([a, b]) => (
              <option key={`${a}-${b}`} value={`${a}-${b}`}>{filteredExchanges[a].name} ↔ {filteredExchanges[b].name}</option>
            ))}
          </select>
        </div>
        <div className="mb-2 flex gap-2">
          {TIME_RANGES.map(r => (
            <button
              key={r.value}
              className={`px-2 py-1 rounded ${timeRange === r.value ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
              onClick={() => setTimeRange(r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div ref={chartRef}>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={historyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" hide />
              <YAxis domain={[0, 300]} />
              <Tooltip />
              <Line type="monotone" dataKey="latency" stroke="#3b82f6" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-2 mt-2">
          <button className="px-2 py-1 rounded bg-primary text-primary-foreground" onClick={handleExportPNG}>Export PNG</button>
          <button className="px-2 py-1 rounded bg-muted border" onClick={handleExportCSV}>Export CSV</button>
        </div>
        <div className="flex justify-between text-xs mt-2">
          <span>Min: <b>{min} ms</b></span>
          <span>Max: <b>{max} ms</b></span>
          <span>Avg: <b>{avg} ms</b></span>
        </div>
      </Card>
    </div>
  );
} 