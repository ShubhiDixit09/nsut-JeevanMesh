"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type DroneState = "active" | "weak" | "offline" | "syncing";
type ViewMode = "2d" | "3d";
type ApprovalState = "pending" | "approved" | "rejected";

type Drone = {
  id: "D1" | "D2" | "D3" | "D4";
  role: string;
  color: string;
  x: number;
  y: number;
  z: number;
  battery: number;
  speed: number;
  signal: number;
  state: DroneState;
  task: string;
  packets: number;
};

type LayerKey = "heatmap" | "links" | "obstacles" | "routes";

declare global {
  interface Window {
    google?: any;
    __jeevanMeshGoogleMaps?: Promise<any>;
    gm_authFailure?: () => void;
  }

  interface ImportMetaEnv {
    readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

const MAX_SCENARIO_STEP = 7;

const SCENARIO_STEPS = [
  {
    title: "Mission baseline",
    short: "Search",
    detail: "Four agents divide Sector A without assigning a permanent leader.",
  },
  {
    title: "Thermal clue detected",
    short: "Detect",
    detail: "D1 raises Hotspot H1 to 82% and asks D2 for an independent view.",
  },
  {
    title: "Route obstruction",
    short: "Reroute",
    detail: "A landslide blocks D2. D* Lite computes a safe local detour.",
  },
  {
    title: "Battery-aware handoff",
    short: "Handoff",
    detail: "D4 reaches reserve energy. Its supply task and mission capsule move to D3.",
  },
  {
    title: "Deliberate mesh partition",
    short: "Disconnect",
    detail: "D4 loses every link but keeps acting from its last verified mission state.",
  },
  {
    title: "JeevanLink activated",
    short: "Connect",
    detail: "D3 becomes a relay and broadcasts a local emergency portal to survivors.",
  },
  {
    title: "Store–carry–forward sync",
    short: "Reconnect",
    detail: "D4 returns with six signed packets; the swarm merges its offline discoveries.",
  },
  {
    title: "Human safety checkpoint",
    short: "Approve",
    detail: "AI recommends a rooftop winch approach. A commander must authorize it.",
  },
];

const BASE_EVENTS = [
  { time: "01:28", tone: "blue", text: "New evidence added at Hotspot H1" },
  { time: "01:27", tone: "orange", text: "D3 acting as relay for Sector A" },
  { time: "01:26", tone: "orange", text: "Battery low — task reassignment prepared" },
  { time: "01:25", tone: "red", text: "Route blocked near Grid 512, 640" },
  { time: "01:22", tone: "slate", text: "Connection lost — continuing locally" },
  { time: "01:18", tone: "green", text: "Possible survivor detected by RGB + thermal" },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return [hours, minutes, secs]
    .map((part) => part.toString().padStart(2, "0"))
    .join(":");
}

function spiralPath(
  cx: number,
  cy: number,
  maxRadius: number,
  turns = 3.25,
  points = 160,
) {
  let path = "";
  for (let index = 0; index <= points; index += 1) {
    const ratio = index / points;
    const theta = ratio * turns * Math.PI * 2;
    const radius = 8 + ratio * maxRadius;
    const x = cx + radius * Math.cos(theta);
    const y = cy + radius * Math.sin(theta) * 0.78;
    path += `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)} `;
  }
  return path;
}

function linePath(points: Array<[number, number]>) {
  return points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"}${x},${y}`)
    .join(" ");
}

function getDrones(step: number, tick: number): Drone[] {
  const phase = tick / 8;
  const spiralRadius = step >= 1 ? Math.max(3.2, 7.8 - step * 0.5) : 6.5;
  const d1x = 52 + Math.cos(phase) * spiralRadius;
  const d1y = 28 + Math.sin(phase) * spiralRadius * 0.72;
  const d4Offline = step === 4 || step === 5;
  const d4Syncing = step === 6;

  return [
    {
      id: "D1",
      role: "SCOUT",
      color: "#42a846",
      x: d1x,
      y: d1y,
      z: 63,
      battery: clamp(72 - Math.floor(tick / 190), 48, 72),
      speed: 12,
      signal: 92,
      state: "active",
      task: step >= 1 ? "BubbleNet scan · H1" : "Search Sector A",
      packets: 0,
    },
    {
      id: "D2",
      role: "VERIFY",
      color: "#ef8200",
      x: 22 + Math.sin(phase / 1.8) * 2.5,
      y: 70 + Math.cos(phase / 1.8) * 2,
      z: 58,
      battery: step >= 3 ? 31 : 34,
      speed: step >= 2 ? 7 : 10,
      signal: step >= 4 ? 58 : 66,
      state: step >= 3 ? "weak" : "active",
      task: step >= 2 ? "Verify H2 · detour" : "Verify Hotspot H2",
      packets: 1,
    },
    {
      id: "D3",
      role: step >= 5 ? "RELAY + SUPPLY" : "RELAY",
      color: "#2879d0",
      x: step >= 5 ? 67 : 73,
      y: step >= 5 ? 49 : 46,
      z: step >= 5 ? 92 : 81,
      battery: clamp(82 - Math.floor(tick / 240), 60, 82),
      speed: 11,
      signal: 95,
      state: "active",
      task: step >= 3 ? "Inherited supply + mesh relay" : "Relay & scan",
      packets: step >= 6 ? 6 : 0,
    },
    {
      id: "D4",
      role: step >= 3 ? "LOCAL SCOUT" : "SUPPLY",
      color: "#d63a3a",
      x: step >= 6 ? 75 : 79,
      y: step >= 6 ? 69 : 72,
      z: d4Offline ? 42 : 49,
      battery: step >= 3 ? 17 : 46,
      speed: d4Offline ? 4 : 9,
      signal: d4Offline ? 0 : d4Syncing ? 61 : 78,
      state: d4Offline ? "offline" : d4Syncing ? "syncing" : step >= 3 ? "weak" : "active",
      task: d4Offline
        ? "Continue locally · last verified state"
        : d4Syncing
          ? "Merging six offline packets"
          : step >= 3
            ? "Return-to-base reserved"
            : "Medical supply drop",
      packets: d4Offline || d4Syncing ? 6 : 0,
    },
  ];
}

function StatusPill({ state }: { state: DroneState }) {
  const label =
    state === "active"
      ? "Good"
      : state === "weak"
        ? "Weak"
        : state === "syncing"
          ? "Syncing"
          : "No link";
  return <span className={`status-pill ${state}`}>{label}</span>;
}

function SignalBars({ value }: { value: number }) {
  return (
    <span className="signal-bars" aria-label={`${value}% signal`}>
      {[22, 42, 66, 90].map((threshold, index) => (
        <i key={threshold} className={value >= threshold ? "on" : ""} style={{ height: 4 + index * 3 }} />
      ))}
    </span>
  );
}

function DroneMarker({
  drone,
  selected,
  onSelect,
}: {
  drone: Drone;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`drone-marker ${drone.state} ${selected ? "selected" : ""}`}
      style={
        {
          left: `${drone.x}%`,
          top: `${drone.y}%`,
          "--drone-color": drone.color,
          "--altitude-scale": 0.94 + drone.z / 900,
        } as CSSProperties
      }
      onClick={onSelect}
      aria-label={`${drone.id}, ${drone.role}, ${drone.state}`}
    >
      <span className="drone-glyph" aria-hidden="true">
        <i />
        <b>{drone.id}</b>
        <i />
      </span>
      <span className="drone-tag">
        <strong>{drone.id}</strong>
        <small>{drone.battery}%</small>
      </span>
    </button>
  );
}

function NetworkGraph({ drones }: { drones: Drone[] }) {
  const d4Offline = drones[3].state === "offline";
  return (
    <div className="network-graph" aria-label="Peer-to-peer mesh topology">
      <svg viewBox="0 0 300 118" role="img">
        <line x1="52" y1="28" x2="144" y2="59" className="graph-good" />
        <line x1="52" y1="92" x2="144" y2="59" className="graph-good" />
        <line x1="144" y1="59" x2="246" y2="25" className="graph-good" />
        <line x1="144" y1="59" x2="246" y2="93" className={d4Offline ? "graph-offline" : "graph-weak"} />
        <line x1="52" y1="28" x2="246" y2="25" className="graph-soft" />
      </svg>
      {drones.map((drone, index) => {
        const positions = [
          [17, 14],
          [17, 69],
          [81, 11],
          [81, 66],
        ];
        return (
          <span
            key={drone.id}
            className={`graph-node ${drone.state}`}
            style={{ left: `${positions[index][0]}%`, top: `${positions[index][1]}%`, background: drone.color }}
          >
            {drone.id}
          </span>
        );
      })}
      <span className="graph-hub">P2P</span>
    </div>
  );
}

function ConfidenceRing({ value, tone }: { value: number; tone: string }) {
  return (
    <span
      className="confidence-ring"
      style={
        {
          "--confidence": `${value * 3.6}deg`,
          "--ring-color": tone,
        } as CSSProperties
      }
    >
      <b>{value}%</b>
    </span>
  );
}

function GoogleMissionMap({
  drones,
  layers,
  scenarioStep,
  selectedDrone,
  onSelectDrone,
  viewMode,
  zoom,
  spiralRadius,
  onStatus,
}: {
  drones: Drone[];
  layers: Record<LayerKey, boolean>;
  scenarioStep: number;
  selectedDrone: Drone["id"];
  onSelectDrone: (id: Drone["id"]) => void;
  viewMode: ViewMode;
  zoom: number;
  spiralRadius: number;
  onStatus: (status: "loading" | "ready" | "failed") => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState("");
  // Next.js prerender does not expose Vite's import.meta.env. Both builds
  // retain optional maps support and fall back to the built-in offline map.
  const apiKey = (
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    import.meta.env?.VITE_GOOGLE_MAPS_API_KEY
  )?.trim();

  useEffect(() => {
    let cancelled = false;

    async function loadGoogleMaps() {
      onStatus("loading");
      if (!apiKey) {
        setMapError("Google Maps key missing — add VITE_GOOGLE_MAPS_API_KEY to .env.local");
        onStatus("failed");
        return;
      }

      try {
        window.gm_authFailure = () => {
          setMapError("Google Maps authorization unavailable");
          setMapReady(false);
          mapRef.current = null;
          onStatus("failed");
        };
        if (!window.__jeevanMeshGoogleMaps) {
          window.__jeevanMeshGoogleMaps = new Promise((resolve, reject) => {
            if (window.google?.maps) {
              resolve(window.google);
              return;
            }

            const script = document.createElement("script");
            script.id = "jeevanmesh-google-maps";
            script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
            script.async = true;
            script.defer = true;
            script.onload = () => resolve(window.google);
            script.onerror = () => reject(new Error("Google Maps SDK could not be loaded"));
            document.head.appendChild(script);
          });
        }

        const google = await window.__jeevanMeshGoogleMaps;
        if (cancelled || !containerRef.current) return;

        mapRef.current = new google.maps.Map(containerRef.current, {
          center: { lat: 30.981, lng: 78.934 },
          zoom: 15,
          mapTypeId: "terrain",
          tilt: 0,
          heading: 0,
          disableDefaultUI: true,
          clickableIcons: false,
          gestureHandling: "greedy",
          keyboardShortcuts: true,
          backgroundColor: "#dfe7e7",
        });
        setMapReady(true);
        onStatus("ready");
      } catch (error) {
        setMapError(error instanceof Error ? error.message : "Google Maps failed to initialize");
        onStatus("failed");
      }
    }

    loadGoogleMaps();
    return () => {
      cancelled = true;
      overlaysRef.current.forEach((overlay) => overlay.setMap?.(null));
      overlaysRef.current = [];
      window.gm_authFailure = undefined;
    };
  }, [apiKey, onStatus]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    map.setZoom(zoom);
    map.setMapTypeId(viewMode === "3d" ? "satellite" : "terrain");
    map.setTilt(viewMode === "3d" ? 45 : 0);
    map.setHeading(viewMode === "3d" ? 18 : 0);
  }, [mapReady, viewMode, zoom]);

  useEffect(() => {
    const google = window.google;
    const map = mapRef.current;
    if (!mapReady || !google?.maps || !map) return;

    overlaysRef.current.forEach((overlay) => overlay.setMap?.(null));
    overlaysRef.current = [];
    const overlays = overlaysRef.current;
    const center = { lat: 30.981, lng: 78.934 };
    const toLatLng = (x: number, y: number) => ({
      lat: center.lat + (50 - y) * 0.00009,
      lng: center.lng + (x - 50) * 0.00012,
    });

    if (layers.heatmap) {
      const heatZones = [
        { x: 51, y: 28.9, radius: 175, color: "#ef4b35" },
        { x: 23.8, y: 72.3, radius: 148, color: "#ef8a23" },
        { x: 55.5, y: 60.3, radius: 92, color: "#d5ac38" },
      ];
      heatZones.forEach((zone) => {
        [1, 0.65, 0.34].forEach((scale, index) => {
          overlays.push(
            new google.maps.Circle({
              map,
              center: toLatLng(zone.x, zone.y),
              radius: zone.radius * scale,
              fillColor: index === 0 ? "#65b94f" : zone.color,
              fillOpacity: index === 0 ? 0.08 : index === 1 ? 0.1 : 0.18,
              strokeOpacity: index === 2 ? 0.35 : 0,
              strokeColor: zone.color,
              strokeWeight: 1.5,
              clickable: false,
            }),
          );
        });
      });
    }

    if (layers.routes) {
      const spiralCenter = toLatLng(51, 28.9);
      const spiralCoordinates = Array.from({ length: 150 }, (_, index) => {
        const ratio = index / 149;
        const theta = ratio * 3.25 * Math.PI * 2;
        const radius = 8 + ratio * spiralRadius;
        return {
          lat: spiralCenter.lat + (radius * Math.sin(theta)) / 111320,
          lng:
            spiralCenter.lng +
            (radius * Math.cos(theta)) /
              (111320 * Math.cos((spiralCenter.lat * Math.PI) / 180)),
        };
      });
      overlays.push(
        new google.maps.Polyline({
          map,
          path: spiralCoordinates,
          strokeColor: "#287dcc",
          strokeOpacity: 0.95,
          strokeWeight: 3,
          clickable: false,
          icons: [
            {
              icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 2 },
              offset: "0",
              repeat: "14px",
            },
          ],
        }),
      );

      const routeSets = [
        { color: "#3b9d47", points: [[19.8, 29.7], [29.4, 32.9], [40.5, 47.8], [51, 28.9]] },
        { color: "#e6811b", points: [[22, 72.3], [33.2, 65.5], [40.7, 54.5], [47, 49.7]] },
        { color: "#7449bd", points: [[78.5, 71.2], [70.4, 65.4], [68.2, 79.4], [61.5, 88.4]] },
      ];
      routeSets.forEach((route) => {
        overlays.push(
          new google.maps.Polyline({
            map,
            path: route.points.map(([x, y]) => toLatLng(x, y)),
            strokeColor: route.color,
            strokeOpacity: 0,
            strokeWeight: 3,
            icons: [
              {
                icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 2 },
                offset: "0",
                repeat: "13px",
              },
            ],
            clickable: false,
          }),
        );
      });
    }

    if (layers.links) {
      const links = [
        [drones[0], drones[2], "#35a04a"],
        [drones[1], drones[2], "#e4871f"],
        [drones[0], drones[1], "#35a04a"],
        [drones[2], drones[3], drones[3].state === "offline" ? "#d83f3a" : "#e4871f"],
      ] as const;
      links.forEach(([from, to, color]) => {
        overlays.push(
          new google.maps.Polyline({
            map,
            path: [toLatLng(from.x, from.y), toLatLng(to.x, to.y)],
            strokeColor: color,
            strokeOpacity: 0,
            strokeWeight: 2,
            icons: [
              {
                icon: { path: "M 0,-1 0,1", strokeOpacity: 0.95, scale: 1.8 },
                offset: "0",
                repeat: "11px",
              },
            ],
            clickable: false,
          }),
        );
      });
    }

    if (layers.obstacles && scenarioStep >= 2) {
      const blocked = toLatLng(38.3, 61.5);
      overlays.push(
        new google.maps.Circle({
          map,
          center: blocked,
          radius: 34,
          fillColor: "#dc4439",
          fillOpacity: 0.22,
          strokeColor: "#dc4439",
          strokeOpacity: 0.9,
          strokeWeight: 2,
          clickable: false,
        }),
        new google.maps.Marker({
          map,
          position: blocked,
          title: "Landslide — route blocked",
          label: { text: "!", color: "#ffffff", fontWeight: "900" },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 13,
            fillColor: "#d9413a",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        }),
      );
    }

    [
      { x: 62.2, y: 29.2, title: "Survivor signal H1" },
      { x: 69.6, y: 60, title: "Survivor signal H2" },
    ].forEach((survivor) => {
      overlays.push(
        new google.maps.Marker({
          map,
          position: toLatLng(survivor.x, survivor.y),
          title: survivor.title,
          label: { text: "S", color: "#ffffff", fontSize: "10px", fontWeight: "800" },
          icon: {
            path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: "#7451c7",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        }),
      );
    });

    drones.forEach((drone) => {
      const marker = new google.maps.Marker({
        map,
        position: toLatLng(drone.x, drone.y),
        title: `${drone.id} · ${drone.role} · ${drone.task}`,
        zIndex: drone.id === selectedDrone ? 50 : 20,
        label: {
          text: drone.id,
          color: "#ffffff",
          fontSize: "9px",
          fontWeight: "900",
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: drone.id === selectedDrone ? 15 : 12,
          fillColor: drone.state === "offline" ? "#7d858b" : drone.color,
          fillOpacity: 1,
          strokeColor: drone.id === selectedDrone ? "#10202e" : "#ffffff",
          strokeWeight: drone.id === selectedDrone ? 4 : 2.5,
        },
      });
      marker.addListener("click", () => onSelectDrone(drone.id));
      overlays.push(marker);
    });
  }, [
    drones,
    layers,
    mapReady,
    onSelectDrone,
    scenarioStep,
    selectedDrone,
    spiralRadius,
  ]);

  return (
    <div className="google-map-surface">
      <div ref={containerRef} className="google-map-canvas" aria-label="Google Maps rescue mission map" />
      {!mapReady && (
        <div className={`google-map-loading ${mapError ? "error" : ""}`}>
          <span>{mapError ? "!" : "⌁"}</span>
          <strong>{mapError || "Loading secure Google Maps SDK…"}</strong>
          {mapError && <small>Restart the local server after updating .env.local.</small>}
        </div>
      )}
      {mapReady && <span className="google-attribution-chip">LIVE GOOGLE MAP · SIMULATED MISSION OVERLAYS</span>}
    </div>
  );
}

export default function Home() {
  const [missionSeconds, setMissionSeconds] = useState(5327);
  const [tick, setTick] = useState(0);
  const [missionRunning, setMissionRunning] = useState(true);
  const [scenarioStep, setScenarioStep] = useState(4);
  const [autoDemo, setAutoDemo] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("2d");
  const [zoom, setZoom] = useState(15);
  const [selectedDrone, setSelectedDrone] = useState<Drone["id"]>("D4");
  const [approval, setApproval] = useState<ApprovalState>("pending");
  const [showModels, setShowModels] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [googleMapStatus, setGoogleMapStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [toast, setToast] = useState("D4 partition isolated — swarm remains operational");
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    heatmap: true,
    links: true,
    obstacles: true,
    routes: true,
  });
  const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const drones = useMemo(() => getDrones(scenarioStep, tick), [scenarioStep, tick]);
  const activeDrones = drones.filter((drone) => drone.state !== "offline").length;
  const averageEnergy = Math.round(drones.reduce((sum, drone) => sum + drone.battery, 0) / drones.length);
  const networkHealth = scenarioStep === 4 ? 71 : scenarioStep === 5 ? 79 : scenarioStep === 6 ? 88 : 94;
  const coverage = Math.min(40, 18.6 + tick * 0.018 + Math.max(0, scenarioStep - 4) * 0.32);
  const selected = drones.find((drone) => drone.id === selectedDrone) ?? drones[0];
  const currentStep = SCENARIO_STEPS[scenarioStep];
  const spiralRadius = clamp(178 - scenarioStep * 11, 96, 178);
  const spiral = useMemo(() => spiralPath(510, 188, spiralRadius), [spiralRadius]);

  useEffect(() => {
    if (!missionRunning) return;
    const timer = window.setInterval(() => {
      setMissionSeconds((value) => value + 1);
      setTick((value) => value + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [missionRunning]);

  useEffect(() => {
    return () => {
      if (autoTimer.current) clearInterval(autoTimer.current);
    };
  }, []);

  function applyScenarioStep(nextStep: number) {
    const safeStep = clamp(nextStep, 0, MAX_SCENARIO_STEP);
    setScenarioStep(safeStep);
    setApproval("pending");
    const message = SCENARIO_STEPS[safeStep];
    setToast(`${message.short.toUpperCase()} · ${message.detail}`);
    if (safeStep === 4) setSelectedDrone("D4");
    if (safeStep === 5) setSelectedDrone("D3");
  }

  function runAutoDemo() {
    if (autoTimer.current) clearInterval(autoTimer.current);
    setAutoDemo(true);
    setMissionRunning(true);
    setTick(0);
    applyScenarioStep(0);
    let next = 0;
    autoTimer.current = setInterval(() => {
      next += 1;
      if (next > MAX_SCENARIO_STEP) {
        if (autoTimer.current) clearInterval(autoTimer.current);
        autoTimer.current = null;
        setAutoDemo(false);
        return;
      }
      applyScenarioStep(next);
    }, 2600);
  }

  function stopAutoDemo() {
    if (autoTimer.current) clearInterval(autoTimer.current);
    autoTimer.current = null;
    setAutoDemo(false);
    setToast("Automatic replay paused. Use the incident controls to continue.");
  }

  function toggleLayer(layer: LayerKey) {
    setLayers((value) => ({ ...value, [layer]: !value[layer] }));
  }

  function respondToApproval(next: ApprovalState) {
    setApproval(next);
    setToast(
      next === "approved"
        ? "COMMANDER APPROVED · Rescue-support route released to D2"
        : "COMMANDER HELD ACTION · Swarm will continue observation only",
    );
  }

  function activateFeature(step: number, target = "map") {
    applyScenarioStep(step);
    window.requestAnimationFrame(() => {
      document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#mission" aria-label="JeevanMesh mission dashboard">
          <span className="brand-mark" aria-hidden="true">JM</span>
          <span>
            <strong>JEEVANMESH</strong>
            <small>Self-Healing Rescue Swarm</small>
          </span>
        </a>

        <nav className="main-nav" aria-label="Dashboard sections">
          <a className="active" href="#mission">Dashboard</a>
          <a href="#map">Map</a>
          <a href="#drones">Drones</a>
          <a href="#evidence">Evidence</a>
          <a href="#network">Network</a>
          <a href="#features">Features</a>
        </nav>

        <div className="topbar-actions">
          <button className="models-button" onClick={() => setShowModels(true)}>AI stack</button>
          <div className="mission-clock">
            <small>Mission time</small>
            <strong>{formatTime(missionSeconds)}</strong>
          </div>
          <span className={`mission-state ${missionRunning ? "live" : "paused"}`}>
            <i /> {missionRunning ? "MISSION ACTIVE" : "MISSION PAUSED"}
          </span>
        </div>
      </header>

      <section className="command-strip" aria-label="Demo controls">
        <div className="scenario-copy">
          <span className="eyebrow">HIMALAYAN FLASH-FLOOD · SECTOR A</span>
          <strong>{currentStep.title}</strong>
          <p>{currentStep.detail}</p>
        </div>
        <div className="step-dots" aria-label={`Scenario step ${scenarioStep + 1} of ${SCENARIO_STEPS.length}`}>
          {SCENARIO_STEPS.map((step, index) => (
            <button
              key={step.short}
              className={index === scenarioStep ? "current" : index < scenarioStep ? "done" : ""}
              onClick={() => applyScenarioStep(index)}
              aria-label={`Jump to ${step.title}`}
              title={step.title}
            >
              <span>{index + 1}</span>
              <small>{step.short}</small>
            </button>
          ))}
        </div>
        <div className="demo-actions">
          <button className="secondary-button" onClick={() => setMissionRunning((value) => !value)}>
            {missionRunning ? "Pause mission" : "Resume mission"}
          </button>
          <button className="primary-button" onClick={autoDemo ? stopAutoDemo : runAutoDemo}>
            <span aria-hidden="true">{autoDemo ? "■" : "▶"}</span>
            {autoDemo ? "Stop replay" : "Run failure demo"}
          </button>
        </div>
      </section>

      <div className="toast" role="status">
        <span className="pulse-dot" />
        <strong>LIVE EVENT</strong>
        <p>{toast}</p>
        <button onClick={() => setToast("System monitoring continues across all agents.")} aria-label="Dismiss event">×</button>
      </div>

      <section id="mission" className="overview-section">
        <div className="section-heading">
          <span className="section-number">1</span>
          <div>
            <h1>Mission overview</h1>
            <p>Tap any drone or incident step to inspect the swarm&apos;s response.</p>
          </div>
          <span className="sync-label">Last mesh sync · {scenarioStep === 4 ? "00:58:11" : "just now"}</span>
        </div>

        <div className="kpi-grid">
          <article className="kpi-card accent-blue">
            <div className="kpi-icon">↗</div>
            <span>Area covered</span>
            <strong>{coverage.toFixed(1)} <small>acres</small></strong>
            <div className="progress-track"><i style={{ width: `${(coverage / 40) * 100}%` }} /></div>
            <p>{((coverage / 40) * 100).toFixed(0)}% of 40.0 acres</p>
          </article>
          <article className="kpi-card accent-orange">
            <div className="kpi-icon">◎</div>
            <span>Survivors detected</span>
            <strong>3 <small>signals</small></strong>
            <p><b>1 verified</b> · 2 suspected</p>
          </article>
          <article className="kpi-card accent-indigo">
            <div className="kpi-icon">◷</div>
            <span>Mission time</span>
            <strong>{formatTime(missionSeconds).slice(0, 5)}</strong>
            <p>Remaining estimate · 00:41:13</p>
          </article>
          <article className="kpi-card accent-green">
            <div className="kpi-icon">▣</div>
            <span>Energy average</span>
            <strong>{averageEnergy}%</strong>
            <p>Battery-aware allocation active</p>
          </article>
          <article className="kpi-card accent-cyan">
            <div className="kpi-icon">≋</div>
            <span>Network health</span>
            <strong>{networkHealth}%</strong>
            <p className={networkHealth < 80 ? "warning-text" : "success-text"}>
              {networkHealth < 80 ? "Partition tolerated" : "Mesh healthy"}
            </p>
          </article>
          <article className="kpi-card accent-red">
            <div className="kpi-icon">✣</div>
            <span>Active drones</span>
            <strong>{activeDrones} / 4</strong>
            <p>{4 - activeDrones} offline · no leader dependency</p>
          </article>
        </div>
      </section>

      <section className="main-grid">
        <article id="map" className="panel map-panel">
          <div className="panel-header">
            <div className="title-with-number">
              <span className="section-number">2</span>
              <div>
                <h2>Live rescue map</h2>
                <p>Bhagirathi Valley · 30.981°N, 78.934°E</p>
              </div>
            </div>
            <div className="map-toolbar">
              <div className="segmented-control" role="group" aria-label="Map dimension">
                <button className={viewMode === "2d" ? "active" : ""} onClick={() => setViewMode("2d")}>2D map</button>
                <button className={viewMode === "3d" ? "active" : ""} onClick={() => setViewMode("3d")}>3D terrain</button>
              </div>
              <div className="layer-controls">
                {(Object.keys(layers) as LayerKey[]).map((layer) => (
                  <label key={layer}>
                    <input type="checkbox" checked={layers[layer]} onChange={() => toggleLayer(layer)} />
                    <span>{layer}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className={`map-stage mode-${viewMode}`}>
            <div
              className={`map-transform ${googleMapStatus === "failed" ? "fallback-mode" : "google-mode"}`}
              style={{ "--map-zoom": zoom } as CSSProperties}
            >
              <GoogleMissionMap
                drones={drones}
                layers={layers}
                scenarioStep={scenarioStep}
                selectedDrone={selectedDrone}
                onSelectDrone={setSelectedDrone}
                viewMode={viewMode}
                zoom={zoom}
                spiralRadius={spiralRadius}
                onStatus={setGoogleMapStatus}
              />
              <svg className="terrain-map" viewBox="0 0 1000 650" preserveAspectRatio="none" role="img" aria-label="Simulated flood rescue area map">
                <defs>
                  <linearGradient id="terrainBase" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0" stopColor="#edf3ec" />
                    <stop offset=".48" stopColor="#e6ede6" />
                    <stop offset="1" stopColor="#dce7e8" />
                  </linearGradient>
                  <linearGradient id="river" x1="0" x2="1">
                    <stop offset="0" stopColor="#a9d6e8" stopOpacity=".72" />
                    <stop offset="1" stopColor="#6eb4d2" stopOpacity=".8" />
                  </linearGradient>
                  <radialGradient id="hotHigh">
                    <stop offset="0" stopColor="#ef4b35" stopOpacity=".68" />
                    <stop offset=".28" stopColor="#f6ad37" stopOpacity=".5" />
                    <stop offset=".62" stopColor="#f1d74a" stopOpacity=".28" />
                    <stop offset="1" stopColor="#62bd4c" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="hotMedium">
                    <stop offset="0" stopColor="#ef7d23" stopOpacity=".66" />
                    <stop offset=".38" stopColor="#f5c245" stopOpacity=".4" />
                    <stop offset="1" stopColor="#64bd4d" stopOpacity="0" />
                  </radialGradient>
                  <pattern id="blockedPattern" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="12" height="12" fill="#fff4f2" fillOpacity=".78" />
                    <line x1="0" y1="0" x2="0" y2="12" stroke="#e75d51" strokeWidth="4" />
                  </pattern>
                  <filter id="mapShadow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#14283b" floodOpacity=".16" />
                  </filter>
                </defs>
                <rect width="1000" height="650" fill="url(#terrainBase)" />
                <g className="contours">
                  <path d="M-30 88 C160 22 263 168 415 91 S705 38 824 101 S1040 94 1080 35" />
                  <path d="M-50 138 C158 71 242 226 430 139 S703 85 841 151 S1045 144 1090 91" />
                  <path d="M-40 198 C143 126 271 286 438 202 S722 142 855 213 S1032 218 1084 163" />
                  <path d="M-60 286 C111 218 256 364 434 287 S713 235 857 301 S1032 314 1090 261" />
                  <path d="M-45 390 C150 314 278 477 449 389 S727 334 842 402 S1034 417 1096 359" />
                  <path d="M-34 508 C125 425 292 583 460 505 S721 451 859 518 S1031 537 1095 476" />
                  <path d="M-20 610 C151 532 284 674 486 598 S741 552 881 616" />
                </g>
                <path className="river" d="M835 -30 C794 69 867 126 823 216 C775 315 851 368 808 466 C778 537 810 596 766 694 L1035 694 L1035 -30 Z" fill="url(#river)" />
                <path className="river-line" d="M850 -20 C811 74 879 128 838 223 C798 316 864 379 825 470 C798 535 831 596 787 678" />
                <g className="roads">
                  <path className="road-major" d="M-30 512 C123 485 181 408 300 406 C441 403 484 469 599 451 C704 434 743 348 824 324" />
                  <path className="road-major" d="M97 680 C164 569 261 522 320 422 C377 323 373 201 498 145 C609 94 731 126 831 184" />
                  <path className="road-minor" d="M129 82 C208 166 285 155 363 224 S521 287 665 259" />
                  <path className="road-minor" d="M38 306 C150 263 242 314 324 337 S504 334 620 386" />
                  <path className="road-minor" d="M411 608 C474 536 576 534 636 471 S721 401 790 411" />
                </g>
                <g className="buildings">
                  {[
                    [92, 115, 52, 26, -11], [171, 104, 38, 22, 8], [247, 184, 45, 29, -5],
                    [318, 117, 31, 48, 18], [625, 116, 42, 27, -12], [699, 180, 48, 25, 5],
                    [98, 355, 44, 23, 10], [172, 383, 31, 45, -8], [272, 489, 52, 28, 14],
                    [420, 473, 39, 22, -5], [530, 521, 48, 31, 10], [663, 498, 34, 24, -15],
                    [590, 331, 40, 26, 12], [690, 357, 52, 27, -6], [470, 262, 28, 39, 14],
                  ].map(([x, y, w, h, r], index) => (
                    <rect key={index} x={x} y={y} width={w} height={h} rx="3" transform={`rotate(${r} ${x + w / 2} ${y + h / 2})`} />
                  ))}
                </g>

                {layers.heatmap && (
                  <g className="heatmap-layer">
                    <ellipse cx="510" cy="188" rx="210" ry="170" fill="url(#hotHigh)" />
                    <ellipse cx="238" cy="470" rx="185" ry="148" fill="url(#hotMedium)" />
                    <ellipse cx="555" cy="392" rx="118" ry="98" fill="url(#hotMedium)" opacity=".35" />
                  </g>
                )}

                {layers.routes && (
                  <g className="route-layer">
                    <path className="search-spiral" d={spiral} />
                    <path className="active-route green" d={linePath([[198, 193], [294, 214], [405, 311], [510, 188]])} />
                    <path className="active-route orange" d={linePath([[220, 470], [332, 426], [407, 354], [470, 323]])} />
                    <path className="planned-route" d={linePath([[785, 463], [704, 425], [682, 516], [615, 575]])} />
                  </g>
                )}

                {layers.links && (
                  <g className="mesh-layer">
                    <line x1={drones[0].x * 10} y1={drones[0].y * 6.5} x2={drones[2].x * 10} y2={drones[2].y * 6.5} className="mesh-link good" />
                    <line x1={drones[1].x * 10} y1={drones[1].y * 6.5} x2={drones[2].x * 10} y2={drones[2].y * 6.5} className="mesh-link weak" />
                    <line x1={drones[0].x * 10} y1={drones[0].y * 6.5} x2={drones[1].x * 10} y2={drones[1].y * 6.5} className="mesh-link good" />
                    <line x1={drones[2].x * 10} y1={drones[2].y * 6.5} x2={drones[3].x * 10} y2={drones[3].y * 6.5} className={`mesh-link ${drones[3].state === "offline" ? "down" : "weak"}`} />
                  </g>
                )}

                {layers.obstacles && scenarioStep >= 2 && (
                  <g className="obstacle-layer" filter="url(#mapShadow)">
                    <path d="M337 390 L392 365 L427 402 L371 430 Z" fill="url(#blockedPattern)" stroke="#dc4439" strokeWidth="3" />
                    <text x="383" y="405" textAnchor="middle">BLOCKED</text>
                    <rect x="690" y="520" width="57" height="51" rx="4" fill="url(#blockedPattern)" stroke="#dc4439" strokeWidth="2" />
                  </g>
                )}

                <g className="hotspot-labels">
                  <g transform="translate(510 188)">
                    <circle r="35" className="hotspot high" />
                    <text textAnchor="middle" y="5">82%</text>
                  </g>
                  <g transform="translate(238 470)">
                    <circle r="32" className="hotspot medium" />
                    <text textAnchor="middle" y="5">61%</text>
                  </g>
                  <g transform="translate(555 392)">
                    <circle r="28" className="hotspot low" />
                    <text textAnchor="middle" y="5">28%</text>
                  </g>
                </g>

                <g className="survivor-pins">
                  <g transform="translate(622 190)"><path d="M0 -20 C-13 -20 -18 -6 -12 4 L0 23 L12 4 C18 -6 13 -20 0 -20Z" /><circle cy="-7" r="5" /></g>
                  <g transform="translate(696 390)"><path d="M0 -20 C-13 -20 -18 -6 -12 4 L0 23 L12 4 C18 -6 13 -20 0 -20Z" /><circle cy="-7" r="5" /></g>
                </g>
              </svg>

              {drones.map((drone) => (
                <DroneMarker
                  key={drone.id}
                  drone={drone}
                  selected={drone.id === selectedDrone}
                  onSelect={() => setSelectedDrone(drone.id)}
                />
              ))}
            </div>

            {googleMapStatus === "failed" && (
              <div className="offline-map-chip">
                <span>OFFLINE TERRAIN ACTIVE</span>
                <strong>Google authorization unavailable · mission simulation continues</strong>
              </div>
            )}

            <div className="map-zoom" role="group" aria-label="Map zoom controls">
              <button onClick={() => setZoom((value) => clamp(value + 1, 12, 19))} aria-label="Zoom in">+</button>
              <button onClick={() => setZoom(15)} aria-label="Reset map zoom">⌖</button>
              <button onClick={() => setZoom((value) => clamp(value - 1, 12, 19))} aria-label="Zoom out">−</button>
            </div>

            <div className="map-legend">
              <span><i className="legend-line search" /> BubbleNet path</span>
              <span><i className="legend-line link" /> Mesh link</span>
              <span><i className="legend-box danger" /> Blocked</span>
            </div>

            <div className="coordinate-card">
              <span>SELECTED · {selected.id}</span>
              <strong>{selected.x.toFixed(1)}, {selected.y.toFixed(1)}, {selected.z}m</strong>
              <small>Local ENU position · ±1.8m</small>
            </div>

            <div className="scale-bar"><span>100 m</span></div>
          </div>

          <div className="map-footer">
            <div>
              <span className="live-dot" /> <strong>Belief map updating</strong>
              <small>Confidence decays unless reconfirmed</small>
            </div>
            <div className="benchmark-chip">
              <span>SEEDED BENCHMARK</span>
              <strong>39.7% lower detection time</strong>
              <small>BubbleNet 04:32 · Grid 07:31</small>
            </div>
          </div>
        </article>

        <aside id="drones" className="panel drone-panel">
          <div className="panel-header compact">
            <div className="title-with-number">
              <span className="section-number">3</span>
              <div><h2>Drone status</h2><p>Local agents · no permanent leader</p></div>
            </div>
            <button className="text-button" onClick={() => setShowTimeline(true)}>Mission log →</button>
          </div>
          <div className="drone-list">
            {drones.map((drone) => (
              <button
                key={drone.id}
                className={`drone-row ${selectedDrone === drone.id ? "selected" : ""}`}
                onClick={() => setSelectedDrone(drone.id)}
              >
                <span className="drone-list-icon" style={{ color: drone.color }}>✣</span>
                <span className="drone-summary">
                  <span><strong style={{ color: drone.color }}>{drone.id}</strong><small>{drone.role}</small></span>
                  <b>{drone.task}</b>
                  <small>Alt {drone.z}m · Speed {drone.speed}m/s · buffer {drone.packets}</small>
                </span>
                <span className="drone-vitals">
                  <span className="battery"><i style={{ width: `${drone.battery}%`, background: drone.battery < 35 ? "#ef8200" : "#55ab42" }} /></span>
                  <b>{drone.battery}%</b>
                  <SignalBars value={drone.signal} />
                  <StatusPill state={drone.state} />
                </span>
              </button>
            ))}
          </div>
          <div className="selected-drone-detail">
            <div>
              <span>Task inheritance capsule</span>
              <strong>{scenarioStep >= 3 ? "Transferred & verified" : "Standby"}</strong>
            </div>
            <div>
              <span>Autonomy state</span>
              <strong>{selected.state === "offline" ? "Local-safe mode" : "Cooperative"}</strong>
            </div>
            <div>
              <span>Last verified state</span>
              <strong>{selected.id === "D4" && selected.state === "offline" ? "00:58:11" : "just now"}</strong>
            </div>
          </div>
        </aside>

        <aside id="network" className="panel network-panel">
          <div className="panel-header compact">
            <div className="title-with-number">
              <span className="section-number">4</span>
              <div><h2>Network health</h2><p>Self-forming peer-to-peer mesh</p></div>
            </div>
            <span className={`network-score ${networkHealth < 80 ? "degraded" : ""}`}>{networkHealth}%</span>
          </div>
          <div className="network-grid">
            <div className="network-card">
              <span>Mesh connectivity · last 90s</span>
              <svg className="sparkline" viewBox="0 0 240 72" preserveAspectRatio="none" aria-label="Network health graph">
                <path className="spark-area" d="M0 47 L22 42 L45 36 L68 39 L91 31 L114 37 L136 27 L158 52 L181 43 L204 56 L240 62 L240 72 L0 72 Z" />
                <polyline points="0,47 22,42 45,36 68,39 91,31 114,37 136,27 158,52 181,43 204,56 240,62" />
              </svg>
              <div className="chart-axis"><span>00:00</span><span>00:45</span><span>01:30</span></div>
            </div>
            <div className="network-card topology-card">
              <span>Live link quality</span>
              <NetworkGraph drones={drones} />
            </div>
            <div className="network-card metric-card">
              <span>Bandwidth use</span>
              <strong>{scenarioStep >= 5 ? "4.8" : "2.4"} <small>Mbps</small></strong>
              <div className="mini-meter"><i style={{ width: scenarioStep >= 5 ? "72%" : "38%" }} /></div>
              <small>Meaning-first packets prioritized</small>
            </div>
            <div className="network-card metric-card">
              <span>Partitions detected</span>
              <strong>{scenarioStep === 4 || scenarioStep === 5 ? "2" : "0"}</strong>
              <small>{scenarioStep >= 6 ? "Recovered · all packets signed" : "Mission continuity retained"}</small>
            </div>
          </div>
          <div className={`jeevanlink-card ${scenarioStep >= 5 ? "active" : ""}`}>
            <span className="jeevanlink-icon">⌁</span>
            <div>
              <span>JEEVANLINK · CIVILIAN EMERGENCY NETWORK</span>
              <strong>{scenarioStep >= 5 ? "12 people connected" : "Ready to deploy"}</strong>
              <small>Offline SOS · shelter directions · low-bandwidth messages</small>
            </div>
            <span className="link-state">{scenarioStep >= 5 ? "LIVE" : "STANDBY"}</span>
          </div>
          <div className={`firefly-relay ${scenarioStep >= 4 ? "optimizing" : ""}`}>
            <div className="firefly-beacon" aria-hidden="true">
              <i /><i /><i /><span>F</span>
            </div>
            <div>
              <span>FIREFLY RELAY POSITIONING</span>
              <strong>{scenarioStep >= 5 ? "D3 moved to brightest safe relay point" : scenarioStep >= 4 ? "Scoring connectivity recovery points" : "Monitoring relay utility field"}</strong>
              <small>Brightness = link gain + rescue priority − energy cost</small>
            </div>
            <div className="brightness-score">
              <small>UTILITY</small>
              <strong>{scenarioStep >= 5 ? "0.91" : scenarioStep >= 4 ? "0.74" : "0.38"}</strong>
            </div>
          </div>
        </aside>
      </section>

      <section className="lower-grid">
        <article className="panel confidence-panel">
          <div className="panel-header compact">
            <div className="title-with-number">
              <span className="section-number">5</span>
              <div><h2>Search & confidence</h2><p>Uncertainty is visible—not hidden</p></div>
            </div>
          </div>
          <div className="confidence-content">
            <div className="hotspot-list">
              <span className="subhead">Top survivor hypotheses</span>
              <div><ConfidenceRing value={82} tone="#45a946" /><p><strong>Hotspot H1</strong><small>Thermal + RGB · Grid 428, 711</small></p><span className="verified">2-source</span></div>
              <div><ConfidenceRing value={61} tone="#ef8200" /><p><strong>Hotspot H2</strong><small>Audio anomaly · Grid 255, 344</small></p><span className="review">verify</span></div>
              <div><ConfidenceRing value={28} tone="#8d99a6" /><p><strong>Hotspot H3</strong><small>Stale report · Grid 612, 198</small></p><span className="stale">decaying</span></div>
            </div>
            <div className="whale-card">
              <div className="whale-visual">
                <svg viewBox="0 0 170 150" aria-label="Adaptive spiral search">
                  <path d={spiralPath(84, 73, 63, 2.8, 100)} />
                  <circle cx="84" cy="73" r="5" />
                </svg>
                <span>r = {spiralRadius - 30}m</span>
              </div>
              <div>
                <span className="subhead">Whale-inspired BubbleNet search</span>
                <strong>{scenarioStep >= 1 ? "Confidence-guided tightening" : "Broad exploration"}</strong>
                <ul>
                  <li><span>Confidence</span><b>0.82</b></li>
                  <li><span>Contraction k</span><b>0.23</b></li>
                  <li><span>Sensor overlap</span><b>18%</b></li>
                  <li><span>Mode</span><b>{scenarioStep >= 1 ? "Tightening" : "Expanding"}</b></li>
                </ul>
              </div>
            </div>
            <div className="conflict-card">
              <span className="subhead">Evidence conflict</span>
              <div className="conflict-sources">
                <span><b>D1</b><strong>Person-like heat</strong><small>82% · fresh</small></span>
                <i>≠</i>
                <span><b>D2</b><strong>Blue tarp movement</strong><small>61% · fresh</small></span>
              </div>
              <div className="resolution-callout">
                <span>?</span>
                <p><strong>Third observation requested</strong><small>No single report becomes ground truth.</small></p>
              </div>
            </div>
          </div>
        </article>

        <article id="events" className="panel events-panel">
          <div className="panel-header compact">
            <div className="title-with-number">
              <span className="section-number">6</span>
              <div><h2>Tasks & events</h2><p>Signed, mergeable mission facts</p></div>
            </div>
            <button className="text-button" onClick={() => setShowTimeline(true)}>View all →</button>
          </div>
          <div className="event-list">
            {BASE_EVENTS.map((event, index) => (
              <div key={event.text} className={`event-row ${index <= Math.max(0, scenarioStep - 1) ? "active" : ""}`}>
                <time>{event.time}</time>
                <span className={`event-icon ${event.tone}`}>{index + 1}</span>
                <p>{event.text}</p>
              </div>
            ))}
          </div>
          <button className="incident-button" onClick={() => applyScenarioStep(scenarioStep === 4 ? 6 : 4)}>
            <span>{scenarioStep === 4 || scenarioStep === 5 ? "↺" : "⊘"}</span>
            <div>
              <strong>{scenarioStep === 4 || scenarioStep === 5 ? "Reconnect D4 now" : "Disconnect D4 deliberately"}</strong>
              <small>Judge-visible network failure control</small>
            </div>
          </button>
        </article>

        <article id="evidence" className="panel evidence-panel">
          <div className="panel-header compact">
            <div className="title-with-number">
              <span className="section-number">7</span>
              <div><h2>Evidence & safety</h2><p>AI recommends · humans authorize</p></div>
            </div>
          </div>
          <div className="evidence-preview">
            <div className="thermal-frame" aria-label="Simulated thermal sensor evidence">
              <span className="thermal-time">D2 · THERMAL · 01:27:58</span>
              <div className="thermal-grid" />
              <span className="target-box"><b>PERSON?</b><small>0.82</small></span>
            </div>
            <div className="evidence-copy">
              <span>CRITICAL EVIDENCE · H1</span>
              <strong>Possible rooftop survivor</strong>
              <p>RGB detector and thermal sensor agree. VLM notes partial occlusion by blue tarp.</p>
              <div><b>YOLO11n · 0.87</b><b>SmolVLM2 · review</b></div>
            </div>
          </div>

          <div className={`approval-card ${approval}`}>
            <div className="approval-header">
              <span className="risk-icon">!</span>
              <div>
                <span>HUMAN SAFETY CHECKPOINT</span>
                <strong>Authorize rooftop winch approach?</strong>
              </div>
              <span className="risk-label">HIGH RISK</span>
            </div>
            <p>AI suggests D2 approach from the west at 11m altitude. Wind gust uncertainty remains ±8 km/h.</p>
            {approval === "pending" ? (
              <div className="approval-actions">
                <button onClick={() => respondToApproval("rejected")}>Hold & observe</button>
                <button onClick={() => respondToApproval("approved")}>Approve route</button>
              </div>
            ) : (
              <div className="approval-result">
                <span>{approval === "approved" ? "✓" : "—"}</span>
                <p><strong>{approval === "approved" ? "Action authorized" : "Action held"}</strong><small>Commander decision recorded in audit log</small></p>
                <button onClick={() => setApproval("pending")}>Reset</button>
              </div>
            )}
          </div>
        </article>
      </section>

      <section id="features" className="innovation-section">
        <div className="innovation-heading">
          <div className="title-with-number">
            <span className="section-number">8</span>
            <div>
              <span className="eyebrow">INNOVATION & OPERATOR GUIDE</span>
              <h2>Three ideas make the swarm difficult to break</h2>
              <p>Every feature below is connected to a visible mission state—use the controls to demonstrate it live.</p>
            </div>
          </div>
          <button className="guide-demo-button" onClick={runAutoDemo}>
            <span>▶</span>
            Run complete 20s story
          </button>
        </div>

        <div className="signature-grid">
          <article className="signature-card whale-signature">
            <div className="signature-topline">
              <span className="signature-index">01</span>
              <span className="nature-label">HUMPBACK WHALE</span>
              <span className="feature-state live">LIVE</span>
            </div>
            <div className="signature-art whale-art" aria-hidden="true">
              <svg viewBox="0 0 250 160">
                <path d={spiralPath(124, 78, 68, 3.1, 120)} />
                <circle cx="124" cy="78" r="6" />
              </svg>
              <span>r {spiralRadius - 30}m</span>
            </div>
            <div className="signature-copy">
              <h3>BubbleNet Adaptive Search</h3>
              <p>Search broadly when location confidence is weak, then contract the spiral around evidence-rich regions. A second sensor must verify before confirmation.</p>
              <div className="feature-metrics">
                <span><small>CONFIDENCE</small><b>0.82</b></span>
                <span><small>CONTRACTION</small><b>k 0.23</b></span>
                <span><small>OVERLAP</small><b>18%</b></span>
              </div>
              <button onClick={() => activateFeature(1)}>Show adaptive spiral <span>→</span></button>
            </div>
          </article>

          <article className="signature-card firefly-signature">
            <div className="signature-topline">
              <span className="signature-index">02</span>
              <span className="nature-label">FIREFLY SWARM</span>
              <span className={`feature-state ${scenarioStep >= 4 ? "live" : "standby"}`}>{scenarioStep >= 4 ? "OPTIMIZING" : "STANDBY"}</span>
            </div>
            <div className="signature-art firefly-art" aria-hidden="true">
              <span className="glow-node n1" /><span className="glow-node n2" /><span className="glow-node n3" /><span className="glow-node n4" />
              <i className="glow-link l1" /><i className="glow-link l2" /><i className="glow-link l3" />
              <div className="relay-core"><b>D3</b><small>0.91</small></div>
            </div>
            <div className="signature-copy">
              <h3>Firefly Relay Positioning</h3>
              <p>Possible relay locations emit virtual “brightness” from connectivity gain, survivor priority and battery cost. A healthy drone moves toward the brightest safe point to heal the mesh.</p>
              <div className="feature-equation">
                <span>BRIGHTNESS</span>
                <b>link gain + priority − energy cost</b>
              </div>
              <button onClick={() => activateFeature(5, "network")}>Trigger relay repair <span>→</span></button>
            </div>
          </article>

          <article className="signature-card recover-signature">
            <div className="signature-topline">
              <span className="signature-index">03</span>
              <span className="nature-label">MISSION CONTINUITY LOOP</span>
              <span className="feature-state live">CORE</span>
            </div>
            <div className="recover-flow">
              <button className={scenarioStep <= 3 ? "active" : ""} onClick={() => activateFeature(1)}>
                <span>SEARCH</span><b>01</b><p>Perceive locally with RGB, thermal and audio.</p>
              </button>
              <i>→</i>
              <button className={scenarioStep === 4 || scenarioStep === 5 ? "active" : ""} onClick={() => activateFeature(4)}>
                <span>REMEMBER</span><b>02</b><p>Keep signed facts and tasks through disconnection.</p>
              </button>
              <i>→</i>
              <button className={scenarioStep >= 6 ? "active" : ""} onClick={() => activateFeature(6)}>
                <span>RECOVER</span><b>03</b><p>Merge packets, resolve conflicts and restore roles.</p>
              </button>
            </div>
            <div className="recover-copy">
              <div>
                <h3>Search–Remember–Recover</h3>
                <p>The swarm never assumes continuous internet. It searches cooperatively, remembers independently and recovers shared mission truth after reconnection.</p>
              </div>
              <div className="recover-status">
                <span><i className={scenarioStep >= 1 ? "done" : ""} />Evidence located</span>
                <span><i className={scenarioStep >= 4 ? "done" : ""} />Local memory retained</span>
                <span><i className={scenarioStep >= 6 ? "done" : ""} />Six packets reconciled</span>
              </div>
            </div>
          </article>
        </div>

        <div className="capability-section">
          <div className="capability-intro">
            <span className="eyebrow">FULL CAPABILITY MAP</span>
            <h3>Not one AI feature. A complete resilience system.</h3>
            <p>The intelligence is distributed across sensing, coordination, memory, communication and human safety.</p>
          </div>
          <div className="capability-grid">
            <article><span>✣</span><div><b>No permanent leader</b><p>Any agent can fail without stopping the mission.</p></div><small>RESILIENCE</small></article>
            <article><span>⇄</span><div><b>Self-healing roles</b><p>Scout, verifier, relay and supply roles change locally.</p></div><small>SWARM</small></article>
            <article><span>▣</span><div><b>Task inheritance capsule</b><p>Goal, evidence and safety constraints transfer together.</p></div><small>ENERGY</small></article>
            <article><span>⌁</span><div><b>Store–carry–forward</b><p>Disconnected drones physically carry signed updates.</p></div><small>MEMORY</small></article>
            <article><span>◎</span><div><b>Evidence quorum</b><p>A second source verifies risky survivor declarations.</p></div><small>TRUST</small></article>
            <article><span>↝</span><div><b>D* Lite rerouting</b><p>Only the affected route segment is repaired locally.</p></div><small>ROUTING</small></article>
            <article><span>◔</span><div><b>Time-decaying belief map</b><p>Old evidence loses confidence until observed again.</p></div><small>UNCERTAINTY</small></article>
            <article><span>⚑</span><div><b>Meaning before media</b><p>Critical facts cross weak links before raw imagery.</p></div><small>NETWORK</small></article>
            <article><span>⌁</span><div><b>JeevanLink</b><p>Local SOS, shelter and responder messages without internet.</p></div><small>CIVILIAN</small></article>
            <article><span>!</span><div><b>Human safety checkpoint</b><p>AI proposes; commanders authorize dangerous action.</p></div><small>SAFETY</small></article>
          </div>
        </div>

        <div className="operator-guide">
          <div className="guide-copy">
            <span className="eyebrow">HOW TO USE THE PROTOTYPE</span>
            <h3>Your two-minute judge walkthrough</h3>
            <p>Follow this sequence once. Every differentiator becomes visible without explaining code.</p>
            <button onClick={runAutoDemo}><span>▶</span> Start guided failure demo</button>
          </div>
          <ol className="guide-steps">
            <li><span>01</span><div><b>Start the story</b><p>Click “Run failure demo” and show that four agents have no permanent leader.</p></div></li>
            <li><span>02</span><div><b>Explain the search</b><p>At Detect, point to the spiral shrinking around the 82% confidence hotspot.</p></div></li>
            <li><span>03</span><div><b>Break the mission</b><p>At Disconnect, D4 loses every link while the other agents continue moving.</p></div></li>
            <li><span>04</span><div><b>Show self-healing</b><p>D3 inherits supply work and Firefly positioning repairs the relay geometry.</p></div></li>
            <li><span>05</span><div><b>Reconnect knowledge</b><p>Six offline packets merge; conflicts request another observation.</p></div></li>
            <li><span>06</span><div><b>End with safety</b><p>Approve or hold the winch route to prove the human remains accountable.</p></div></li>
          </ol>
          <div className="quick-controls">
            <button onClick={() => activateFeature(1)}><span>W</span><b>Whale search</b><small>Step 2</small></button>
            <button onClick={() => activateFeature(5, "network")}><span>F</span><b>Firefly repair</b><small>Step 6</small></button>
            <button onClick={() => activateFeature(4)}><span>R</span><b>Remember offline</b><small>Step 5</small></button>
            <button onClick={() => activateFeature(6)}><span>↺</span><b>Recover mesh</b><small>Step 7</small></button>
          </div>
        </div>
      </section>

      <footer className="footer-note">
        <div><span className="brand-mark small">JM</span><p><strong>JeevanMesh simulation console</strong><small>Evidence first. Lives first.</small></p></div>
        <p>This proof of concept generates mission telemetry locally. It does not send real flight commands.</p>
        <span>Prototype build · v0.9</span>
      </footer>

      {showModels && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowModels(false)}>
          <section className="side-modal" role="dialog" aria-modal="true" aria-labelledby="models-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModels(false)} aria-label="Close AI stack">×</button>
            <span className="eyebrow">EDGE AI · EXPLAINABLE PIPELINE</span>
            <h2 id="models-title">What runs on each drone</h2>
            <p className="modal-lead">The fast model detects. The small vision-language model explains uncertain frames. Deterministic safety rules remain in control.</p>
            <div className="model-stack">
              <div><span>01</span><p><strong>YOLO11n</strong><small>People, debris, fire, vehicles · edge detector</small></p><b>ON-DEVICE</b></div>
              <div><span>02</span><p><strong>SmolVLM2-500M</strong><small>Selective review of ambiguous evidence only</small></p><b>ON-DEVICE</b></div>
              <div><span>03</span><p><strong>Confidence fusion</strong><small>Thermal + RGB + time decay + source agreement</small></p><b>RULES</b></div>
              <div><span>04</span><p><strong>D* Lite routing</strong><small>Incremental route repair when terrain changes</small></p><b>PLANNER</b></div>
              <div><span>05</span><p><strong>CRDT-style event merge</strong><small>Signed facts synchronize after reconnection</small></p><b>MESH</b></div>
            </div>
            <div className="guardrail-list">
              <span>Responsible-AI safeguards</span>
              <ul>
                <li>No survivor marked “confirmed” from one model output.</li>
                <li>Confidence and data age always remain visible.</li>
                <li>Dangerous actions require human approval.</li>
                <li>Raw imagery stays local unless explicitly requested.</li>
              </ul>
            </div>
          </section>
        </div>
      )}

      {showTimeline && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowTimeline(false)}>
          <section className="timeline-modal" role="dialog" aria-modal="true" aria-labelledby="timeline-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowTimeline(false)} aria-label="Close mission log">×</button>
            <span className="eyebrow">AUDITABLE MISSION REPLAY</span>
            <h2 id="timeline-title">Incident timeline</h2>
            <div className="full-timeline">
              {SCENARIO_STEPS.map((step, index) => (
                <button key={step.title} className={index <= scenarioStep ? "reached" : ""} onClick={() => { applyScenarioStep(index); setShowTimeline(false); }}>
                  <span>{index + 1}</span>
                  <p><strong>{step.title}</strong><small>{step.detail}</small></p>
                  <b>{index < scenarioStep ? "DONE" : index === scenarioStep ? "LIVE" : "QUEUED"}</b>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
