# JeevanMesh Command Center

<!-- LIVE DEPLOYMENT LINK -->

[**Open live JeevanMesh simulation**](https://jeevanmesh-shubhidixit09.vercel.app/)

**Deployment:** Vercel · Interactive disaster-rescue mesh simulation. The prototype models drones and autonomous coordination; it is not connected to physical rescue drones.
<!-- END LIVE DEPLOYMENT LINK -->

**A leaderless, self-healing rescue swarm for disaster zones where internet and infrastructure cannot be trusted.**

JeevanMesh is an interactive hackathon prototype that simulates autonomous drones coordinating during a Himalayan flash flood. The command center shows live movement, 3D positions, battery levels, peer-to-peer links, survivor confidence, blocked routes, local decision-making, task handoff, delayed data delivery, reconnection and human approval of high-risk actions.

> This repository is a browser simulation and proof of concept. It does not control real aircraft. All telemetry and benchmark values are seeded for demonstration.

## Signature innovations

### BubbleNet Adaptive Search

A whale-inspired search policy starts with a broad spiral when the survivor location is uncertain, then tightens around stronger evidence. A second drone verifies high-confidence detections before the system recommends action.

### Firefly Relay Positioning

Potential relay positions receive a virtual brightness score based on connectivity gain, survivor priority and energy cost. A healthy drone moves toward the brightest safe point when the mesh partitions, temporarily becoming a communication relay.

### Search–Remember–Recover

- **Search:** each drone performs local multisensor perception and route planning.
- **Remember:** a disconnected drone keeps signed facts, tasks and timestamps in a local packet buffer.
- **Recover:** after reconnection, the swarm merges packets, flags conflicts and restores the best role assignment.

## What the working prototype demonstrates

- No permanent leader; loss of one drone does not stop the mission
- Self-healing scout, verifier, relay and supply roles
- Adaptive whale-inspired spiral search and confidence heatmap
- Simulated RGB/thermal survivor evidence with confidence and provenance
- Conflicting reports that trigger a second observation
- Battery-aware task inheritance with an auditable task capsule
- D* Lite-style rerouting when a road or corridor is blocked
- Store–carry–forward packets during a network partition
- Firefly-inspired temporary relay placement
- Meaning-before-media bandwidth prioritisation
- JeevanLink emergency access for affected civilians
- 2D/3D map modes, layers, links, routes and live 3D coordinates
- Automatic network-failure demonstration and reconnection merge
- Human safety checkpoint for dangerous rescue decisions
- Built-in feature catalogue and operator walkthrough
- Optional Google Maps JavaScript SDK with automatic offline-map fallback

## Quick start

Requirements: Node.js 22.13+ and npm.

### Windows PowerShell

```powershell
cd "C:\path\to\jeevanmesh-command"
npm.cmd install
npm.cmd run dev:windows
```

Open [http://localhost:5174](http://localhost:5174).

If PowerShell blocks `npm.ps1`, always use `npm.cmd` and `npx.cmd`, or run the same commands in Command Prompt. You do not need to weaken the system execution policy.

### macOS or Linux

```bash
npm install
npm run dev
```

## Optional Google Maps setup

The prototype works immediately with its detailed offline rescue map. To enable Google Maps, copy `.env.example` to `.env.local` and add a restricted browser key:

```env
VITE_GOOGLE_MAPS_API_KEY=your_restricted_google_maps_browser_key
```

In Google Cloud Console:

1. Enable **Maps JavaScript API**.
2. Restrict the key to that API.
3. Add `http://localhost:5174/*` and `http://127.0.0.1:5174/*` as website referrers.
4. Restart the development server.

Never commit `.env.local` or a real API key. If Google rejects the key, JeevanMesh automatically returns to the offline map instead of showing a broken map surface.

## Two-minute judge demo

1. Click **Run failure demo** in the scenario strip.
2. Show the BubbleNet path tightening around an 82% survivor hotspot.
3. Let a blocked route trigger local rerouting and a low battery trigger task inheritance.
4. At **Disconnect**, show D4 continuing locally while storing packets.
5. At **Connect**, point out the Firefly relay repair and JeevanLink civilian portal.
6. At **Reconnect**, show packet merge and conflict handling, then use the human checkpoint to approve or hold the proposed rescue route.

Every stage can also be triggered manually from the **Innovation & Operator Guide** inside the prototype.

## Prototype architecture

| Layer | Hackathon implementation | Real deployment path |
|---|---|---|
| Perception | Seeded RGB/thermal detections and evidence cards | YOLO11n or equivalent edge detector, thermal camera, optional compact VLM |
| Local autonomy | Browser state machine, role and battery logic | PX4/ArduPilot companion computer with ROS 2 nodes |
| Search | Adaptive spiral and confidence updates | Bayesian belief map with replanning from observations |
| Routing | Simulated blocked-edge detour | D* Lite or A* over a shared traversability graph |
| Mesh | Link graph, partition, buffers and replay | Wi-Fi Direct/802.11s, LoRa telemetry or MANET radios |
| Data merge | Event IDs, timestamps and conflict flags | Signed append-only events with CRDT-style reconciliation |
| Human control | Approve/hold checkpoint and audit event | Authenticated incident-command console with policy rules |

Suggested real-drone hardware includes an RGB camera, radiometric thermal sensor, GNSS, IMU, barometer, LiDAR or depth sensor, mesh radio and an edge computer such as Jetson Orin Nano. Hardware choice depends on payload, flight time, regulation and terrain.

## Responsible claims

The displayed **39.7% faster** comparison is the result of the prototype's seeded scenario, not a universal scientific guarantee. A real evaluation should compare BubbleNet and lawnmower scans across identical target priors, terrain, sensor range, wind, false-positive rates and energy budgets, then publish confidence intervals.

JeevanMesh treats AI output as evidence, not truth. Survivor detections retain confidence, sensor source and timestamp; disagreements request another observation; and high-risk actions remain subject to human approval.

## Production check

```bash
npm run lint
npm run build
```

On Windows, the direct build command is:

```powershell
npm.cmd run build:windows
```

## Repository hygiene

- `.env.local`, build output and dependencies are ignored.
- `.env.example` is safe to commit.
- Do not put personal API keys, flight credentials or survivor data in Git.
- Keep the prototype labelled as simulated until it has hardware-in-the-loop validation.

## License

Add the license selected by the hackathon team before public release.
