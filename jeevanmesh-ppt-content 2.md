# JEEVANMESH — 12-Slide Deck Content

**Problem Statement III · The Innovator's Court**

Slide-ready copy, end to end. Every visual comes from an asset you already have — the master architecture diagram and the dashboard wireframe. A full feature-coverage audit is at the bottom of this file.

| # | Slide | Template section | Visual |
|---|---|---|---|
| 01 | Title | Title | — |
| 02 | The problem, and the gap nobody fills | Problem Statement | — |
| 03 | What JeevanMesh is, and how a mission runs | Idea / Solution | — |
| 04 | The architecture — no central brain | Idea / Solution | Full architecture diagram |
| 05 | Pillar 1 · Search | Idea / Solution | Crop: JeevanSearch band |
| 06 | Pillar 2 · Remember | Idea / Solution | Crop: JeevanMemory block |
| 07 | Pillar 3 · Recover | Idea / Solution | Crop: self-healing row |
| 08 | Walkthrough — split-brain rescue | Conceptual visual | Crop: partition workflow strip |
| 09 | What makes it different | Idea / Solution | — |
| 10 | Commander console | Mockups / Wireframes | Dashboard wireframe |
| 11 | Feasibility | Feasibility | — |
| 12 | Scalability & future impact | Scalability / Future Impact | — |

---

## 01 · TITLE

`Section: Title` · `Visual: none`

**JEEVANMESH**

A self-healing rescue swarm

*Search intelligently. Remember consistently. Recover automatically.*

PROBLEM STATEMENT III

TEAM NAME :

TEAM MEMBERS :

---

## 02 · THE PROBLEM

`Section: Problem Statement` · `Visual: none — opening line large, the two-box comparison as typography in the lower half`

**Slide title — Disasters break the network. Then they break the swarm's knowledge.**

In a disaster zone the communication network is usually the first casualty — and today's drone swarms are built on the assumption that it survives.

- Towers collapse, power fails, rubble and buildings block signals. Links drop for minutes at a time.
- **Centralised coordination** means one ground station decides what every drone does. Lose the link to it and a drone hovers, turns back, or re-searches ground the swarm already covered.
- **Who it affects:** survivors in the first critical hours · NDRF and SDRF teams entering unmapped, hazardous ground · commanders forced to decide on stale information.

### But the harder problem comes next

When the network breaks, the swarm **partitions** — it splits into groups that can no longer talk to each other. Both groups keep flying and keep observing, so you end up with two half-pictures of the same disaster.

| GROUP A · D1, D2 | GROUP B · D3 |
|---|---|
| Survivor at Zone X | Survivor at Zone X |
| confidence 0.72 | confidence 0.76 |

*Confidence = how sure the drone is, on a 0–1 scale. 0.72 means "fairly sure, not certain."*

### One person seen twice — or two people?

Add the numbers and you get a confident answer that may be completely wrong. Send a team to a survivor who was already found, and someone else waits.

**Flying together is solved. Knowing together is not. A swarm that keeps *flying* while disconnected is only half an answer — it has to keep *knowing*.**

---

## 03 · WHAT JEEVANMESH IS

`Section: Idea / Solution` · `Visual: none — the six-stage mission flow is the visual, built as a numbered strip or column`

**Slide title — A swarm that keeps its mission and its memory alive**

JeevanMesh is a disaster-response drone swarm with no central controller. Every drone carries the mission rules, decides for itself, records what it sees as verifiable evidence, and can rebuild one shared, trusted picture with the others after any break in communication.

### How a mission actually runs, end to end

1. **Before take-off** — the commander sets goals, boundaries and approval rules, and external feeds are loaded: maps and building data, satellite and weather, incident-command priorities. These compile into a **mission policy**: a small rulebook copied onto every drone, so the rules survive even when the commander cannot be reached.
2. **In the air** — each drone scores the area by how much it would *learn* by flying there, and searches in a spiral that widens when it is unsure and tightens as evidence builds. No lawnmower sweeps.
3. **On a detection** — the drone doesn't report "survivor found". It creates an **evidence object**: what it saw, where in 3D, when, with which sensor, how confident it is, and the frame that proves it. A second sensor or a second drone must agree before anything is declared.
4. **When something fails** — a dead drone's unfinished tasks are picked up by neighbours within seconds. A weak link is fixed by another drone repositioning as a signal bridge. A dying battery triggers a handover, not an abandonment.
5. **When the network dies completely** — the swarm splits and keeps working. Each group builds its own memory locally. Nothing waits for permission.
6. **When the link returns** — the separated memories are compared, duplicates are recognised, disagreements are flagged for verification, and the groups converge on **one trusted mission picture**.

### The three pillars behind those six steps

| 01 · SEARCH | 02 · REMEMBER | 03 · RECOVER |
|---|---|---|
| Spend scarce battery where information is worth the most. | Keep every finding verifiable, and merge separated memories correctly. | Never let a lost drone or a lost link take unfinished work with it. |
| *Steps 2–3* | *Steps 3, 5–6* | *Steps 4–5* |

### Where it operates

Floods · earthquakes · landslides · wildfires · cyclones · urban collapse · industrial accidents · night and low-visibility conditions

---

## 04 · THE ARCHITECTURE

`Section: Idea / Solution` · `Visual: your full master architecture diagram, full-bleed — this slide explains the diagram, so keep text tight`

**Slide title — No central brain: the whole stack runs on every drone**

| Layer | What it does |
|---|---|
| **Human commander** | Sets mission goals, defines constraints, approves high-risk actions, monitors and intervenes. |
| **External systems** | NDRF / SDRF and the incident commander, satellite and weather feeds, maps and building data, emergency services. |
| **Mission intent & safety policy** | Goals plus the **safety guardrails** — no-fly zones, geo-fencing, DGCA / Digital Sky airspace rules, altitude limits, emergency protocols — compiled once and copied onto every drone before take-off. *Geofence = an invisible boundary a drone may not cross.* |
| **JeevanCore** — swarm intelligence | A shared **protocol** (rules every drone follows) plus a decision engine on each drone. Five jobs: **mission policy** (turns goals into swarm rules) · **global situational awareness** (a high-level view of the disaster and progress) · **role & capability manager** (assigns and changes roles) · **safety & risk manager** (geofencing, risk assessment) · **conflict & decision manager** (verifies conflicts, requests re-checks, makes final calls). **It is not a server that tells everyone what to do.** |
| **Sensing & perception** — on every drone | RGB and thermal cameras, audio mic array, RF / phone scanner, IMU and GPS, environmental sensors for air, smoke and gas — feeding an on-board pipeline that turns raw data into structured findings. |
| **JeevanSearch · JeevanMemory · JeevanMesh** | The three pillars — where to look, what we believe, and who does what when something breaks. Next three slides. |
| **Communication layer** | Peer-to-peer mesh, delay-tolerant store-carry-forward, adaptive routing, relay placement, link-quality estimation. |

### The rule that makes it decentralised

Every action is checked against the local rulebook **before it happens**. Routine actions execute immediately. High-risk actions need commander approval — and if the commander is unreachable, the drone holds that action as **pending**, runs a safe fallback, and raises it when a link returns. It never guesses, and it never freezes.

**Rules are replicated. Decisions are local. Remove any drone — including the one nearest the commander — and the mission continues.**

---

## 05 · PILLAR 1 — SEARCH

`Section: Idea / Solution` · `Visual: crop the JeevanSearch band — the five spiral stages plus the adaptive parameters strip`

**Slide title — Don't search uniformly. Search where information matters.**

A grid sweep spends the same battery on an empty field as on a collapsed building.

### The perception pipeline, running on every drone

sensors → **sensor fusion** (combines camera, thermal and audio into one view) → **object detection** (a YOLO-class lightweight model spots people, hazards, structures) → **evidence reasoning** (small vision-language model judges what it means and how sure it is) → local world state → navigation & search planner → mission decision → flight controller

The drone sends a small structured finding, **not a video stream**. That one choice is why the system still works on a broken link.

### The five search stages

broad spiral (explore widely at low confidence) → gather evidence → confidence rises in a high-utility region → **tighten the spiral** → request verification from another drone before declaring

- Each drone builds a **utility field U(x,y,t)** — a live value map scoring how much it would learn by flying to any point right now. Rebuilt continuously from **confidence, uncertainty, battery, obstacles, comms quality and weather**.
- **Whale-inspired spiral:** humpback whales circle wide when they don't know where the prey is and tighten as they close in. Same here — radius shrinking by a **contraction factor *k*** as evidence builds.
- Nothing is confirmed on one drone's opinion. A second sensor or a second drone must agree first.

### Mission Criticality Map

Alongside the survivor probability map, the swarm tracks **what information is mission-critical right now** — CRITICAL (survivor confirmation) · HIGH (safe responder route) · MEDIUM (infrastructure inspection) · LOW (general mapping).

One tag, three jobs: **where to fly next · what to transmit first · what to back up first.**

---

## 06 · PILLAR 2 — REMEMBER

`Section: Idea / Solution` · `Visual: crop the JeevanMemory block — the Evidence Model row plus the Memory Services row`

**Slide title — When the swarm splits, its knowledge splits safely**

### An observation is a record, not a flag

Not `survivor = true`, but an **evidence object**: observation ID · which drone · 3D position · time · sensor type · confidence · evidence reference · mission context. That history is called **provenance**, and it is what makes correct merging possible later.

### Six memory services

provenance tracking · freshness & decay · deduplication & matching · conflict detection · fusion & reconciliation · state versioning

### The matching question: same event, or two events?

Decided by three tests — how far apart in space, how far apart in time, and whether those two sensors could plausibly be seeing the same thing. Borderline cases are deliberately **not** merged; they become conflicts and get verified.

### The consistency principles that make separated memories merge back safely

| Principle | What it prevents |
|---|---|
| **Event IDs** — every observation and task change carries a unique identifier | The same finding arriving by three routes being counted as three findings |
| **Commutative merges** — memories combine to the same result whichever way groups reconnect | Two halves ending up with different final pictures |
| **Evidence weighting** — confidence combines with a discount for how related two observations are | Fake certainty. Independent sensors add a lot; a repeat adds almost nothing; the total can never exceed 1 |
| **Quorum for critical claims** — no single drone can declare a survivor alone | One faulty sensor sending a rescue team to an empty building |
| **Conflict as first-class state** — disagreement is stored, never averaged away | A clean-looking answer that hides an unresolved question |
| **Eventual consistency** — groups are allowed to diverge, on the guarantee that they converge | Freezing the mission until everyone agrees |

### 0.72 ⊕ 0.76 = 0.91 &nbsp;&nbsp; ~~1.47~~

**Freshness & decay.** A road reported clear 25 minutes ago is not clear during a flood, so old evidence automatically loses weight. Every update to the mission picture is **versioned**, so drones can always tell newer from older.

**Single Point of Knowledge detector.** Different from a single point of failure — the swarm asks *is some critical information known by only one drone?* If yes, it is copied to a neighbour before that drone leaves, lands or runs out of battery. **We protect not just drones, but knowledge.**

---

## 07 · PILLAR 3 — RECOVER

`Section: Idea / Solution` · `Visual: crop the self-healing coordination row, with the failure-scenarios column beside it`

**Slide title — When a drone or a link disappears, its mission doesn't**

- **Dynamic role assignment.** Roles are a pool, not a wiring diagram — scout, verify, relay, supply, guide, beacon. No drone owns a role, so a scout becomes a **relay** (a flying signal bridge) the moment the mesh needs one.
- **Health monitoring & recovery.** Every drone sends a regular **heartbeat** — a short "I'm alive, here's my status" signal. Miss enough heartbeats and neighbours act within seconds. The same monitor watches sensor sanity and isolates faulty units.
- **Task inheritance & reassignment.** A missing drone's unfinished work is bid for locally: cost = distance + battery + how critical the task is. The winner inherits the task **and its context** — what was already seen, and why the task existed.
- **Battery-aware task handoff.** A low-battery drone hands over its tasks and context, pushes its critical evidence first, and returns safely — it does not simply drop out.
- **Route repair & replanning.** Blocked routes and hazards are stored as evidence, routes are replanned on the fly, and the other drones and responders are warned.
- **Relay & store-carry-forward.** When no route exists at all, a drone physically flies the data to a place where a connection exists.

### Communication Debt · Meaning Before Media

A disconnected drone keeps working and keeps a ledger of everything the swarm hasn't been told — *7 observations, 2 critical events, 1 survivor candidate, 4 task updates.* On reconnect it repays that debt **by importance, not by the order recorded**:

**critical evidence → mission state → telemetry → media**

A 200-byte finding outranks a 2 MB video frame. Store-carry-forward becomes intelligent rather than "store everything and send it later".

### Failure → response

| | |
|---|---|
| Drone failure | Tasks re-bid, winner inherits task and context |
| Link failure | Reroute, then reposition a relay, then carry the data physically |
| GPS loss | Navigate by camera, motion sensors and distance to neighbours |
| Battery depletion | Hand over context, push critical evidence, return to base |
| Blocked route | Store the hazard as evidence, replan, warn the others |
| Sensor fault | Demote the role, exclude from verification |
| Swarm partition | Both halves keep flying under the same policy, reconcile on reconnect |
| Loss of internet | Nothing changes — we never relied on it |

---

## 08 · WALKTHROUGH

`Section: Conceptual visual` · `Visual: crop the partition workflow strip — the five stages with the node graphics`

**Slide title — A split-brain rescue, in six steps**

*Split-brain = two halves of one system, both awake, neither aware of the other.*

1. **Searching** — three drones, one shared mission memory.
2. **First sighting** — D1 spots a possible survivor. Evidence E184, confidence 0.71.
3. **The swarm splits** — the link drops. D1 and D2 can no longer reach D3.
4. **Independent discovery** — D3 detects something near the same spot. E311, confidence 0.76. It has never heard of E184.
5. **Both halves keep working** — neither waits for permission. Two separate memories grow.
6. **Reconnect** — the two records are compared, found to describe one incident, and combined into **0.91**. One survivor. One trusted picture. No team sent twice.

**Change one thing and the system still holds:** if D3 had reported a collapsed structure instead of a survivor, the merge would produce a **conflict** — and the swarm would dispatch its own verification flight rather than guessing.

---

## 09 · WHAT MAKES IT DIFFERENT

`Section: Idea / Solution` · `Visual: none — the comparison table is the visual`

**Slide title — Our USPs: what JeevanMesh does that other swarms don't**

| | Typical drone swarm | JeevanMesh |
|---|---|---|
| **Control** | A ground station assigns every task | Every drone carries the rulebook and decides locally |
| **On link loss** | Hovers, returns home, or repeats covered ground | Keeps searching and keeps recording, under the same rules |
| **What it stores** | "Survivor found: true" | Who saw it, when, with which sensor, and the proof |
| **Two reports, one person** | Counted as two survivors | Matched, merged, counted once |
| **Disagreement** | Averaged away into a clean number | Becomes a conflict and a verification flight |
| **Bandwidth** | Streams video, floods the link | Sends meaning first, media last |
| **A drone is lost** | Its knowledge is lost with it | Critical knowledge was already copied to a neighbour |

### The five differentiators, stated plainly

1. **Mission memory that survives being split.** Other systems lose or corrupt shared knowledge during a partition. Ours is designed to diverge safely and converge correctly.
2. **Evidence with provenance, not booleans.** Every claim is auditable and weighable — which is what makes merging, verification and a defensible mission log possible at all.
3. **Conflict is a first-class state.** The system prefers an honest open question to a confident wrong answer, because a conflict costs one verification flight and a wrong merge costs a rescue.
4. **One criticality tag, three jobs.** The Mission Criticality Map decides where to fly next, what to transmit first when bandwidth collapses, and what to replicate before a drone is lost.
5. **Failure behaviour is designed, not accidental.** All eight failure modes have a defined response the swarm executes on its own.

**We protect not just drones, but knowledge — which is the thing a rescue team actually needs.**

---

## 10 · COMMANDER CONSOLE

`Section: Mockups / Wireframes` · `Visual: your dashboard wireframe, full-bleed`

**Slide title — What the commander actually sees**

Seven panels: mission overview · live rescue map · drone status · search & confidence · network health · tasks & events · evidence & alerts.

### Three outputs come out of the swarm

- **JeevanMap** — survivor probability heatmap, 3D drone positions, blocked and safe routes, points of interest, confidence levels
- **JeevanEvidence** — every observation with its provenance, every conflict and how it was resolved, time-stamped events, a full audit trail
- **Actionable insights** — where to send teams, what to verify next, which routes are safe, how to spend remaining drone-hours

**Confidence is shown, not hidden.** A 61% hotspot looks different from an 82% one, so a commander can prioritise. Conflicts appear as conflicts — the console never turns an unresolved question into a clean-looking answer.

**The human stays in the loop without being in the way.** The swarm proposes; the commander approves anything high-risk. The swarm never declares a survivor on one drone's opinion.

---

## 11 · FEASIBILITY

`Section: Feasibility` · `Visual: none — build the three phases as a shape strip`

**Slide title — Every building block already exists**

We are not inventing hardware. Mesh radios, delay-tolerant messaging, on-board detection and the consistency techniques databases have used for decades are all mature. Our contribution is combining them in the memory layer of a rescue swarm — and that part is software running on commercially available drones.

| PHASE 1 · SIMULATION | PHASE 2 · BENCH MESH | PHASE 3 · FIELD PROTOTYPE |
|---|---|---|
| Multi-drone simulator with a network we can break on purpose. Proves that separated memories merge back correctly. | 3–4 small computers with real radios on a desk, no flight. Proves the protocol on real hardware. | 3–4 drones on a controlled site, inside DGCA-compliant airspace. |
| Cost is time, not capital. | | |

### Risks, and what absorbs them

| Risk | Absorbed by |
|---|---|
| Weak bandwidth | Meaning before media — findings first, video last |
| Limited on-board computing | Lightweight models; the drone sends findings, not footage |
| GPS blocked by buildings | Navigate by camera, motion sensors and neighbour distances |
| False alarms | Quorum — a second drone must confirm before anything is declared |
| Regulation | DGCA and Digital Sky airspace rules are written into the mission policy every drone carries, not bolted on afterwards |

---

## 12 · SCALABILITY & FUTURE IMPACT

`Section: Scalability / Future Impact` · `Visual: none`

**Slide title — One protocol, many missions**

- **Scales by adding units, not servers.** No central computer to outgrow — three drones or thirty, the rules are identical. The real limits are radio bandwidth and keeping aircraft safely separated, both measurable engineering constraints.
- **Works for any machine that observes and reports** — ground robots into rubble, boats in floods, fixed sensors left behind after the drones leave.
- **The same problem exists beyond rescue** — agriculture, logistics, inspection and surveying all involve machines coordinating where communication is unreliable.
- **Long term:** a shared mission-memory layer for autonomous teams, the way they already share maps.

### JeevanLink — the emergency network for people

The same mesh that carries evidence can carry survivors' voices. Victim **SOS beacons** · emergency **messages and broadcasts** · **location approximation** for people who cannot be seen · **offline connectivity** when the ground network is gone.

Phones, people, drones and responders on one mesh — when every other network has failed.

### The outcome we are aiming at

More survivors found · faster response · lower risk to rescuers · efficient resource use, with no drone-hour spent re-discovering something the swarm already knew.

**JeevanMesh is not just a swarm of drones. It is a mesh of decisions, memories and communication that survives long enough to save lives.**

---

# APPENDIX — Feature coverage audit

Every element of the architecture diagram and every named feature, mapped to where it now appears.

| Feature | Slide |
|---|---|
| Human commander — goals, constraints, approvals, intervene | 04 |
| External systems — NDRF/SDRF/IC, satellite & weather, maps & building data, emergency services | 03, 04 |
| Mission intent & safety policy | 03, 04 |
| Safety guardrails — no-fly, geofencing, DGCA/Digital Sky, altitude limits, emergency protocols | 04, 11 |
| JeevanCore — mission policy, global situational awareness, role & capability manager, safety & risk manager, conflict & decision manager | 04 |
| Communication layer — P2P mesh, DTN store-carry-forward, adaptive routing, relay placement, link-quality estimation | 04, 07 |
| Sensing — RGB, thermal, audio array, RF/phone scanner, IMU/GPS, environmental sensors | 04, 05 |
| Local perception pipeline — fusion, detection, evidence reasoning, world state, planner, mission decision, flight controller | 05 |
| JeevanSearch — five stages, utility field U(x,y,t), adaptive parameters, whale spiral | 05 |
| Mission Criticality Map | 05, 09 |
| Evidence model — obs ID, who, where, when, sensor, confidence, evidence ref, context | 06 |
| Memory services — provenance, freshness & decay, dedup & matching, conflict detection, fusion & reconciliation, state versioning | 06 |
| Consistency principles — event IDs, commutative merges, conflict as first-class state, evidence weighting, quorum, eventual consistency | 06 |
| Single Point of Knowledge detector | 06, 09 |
| Partition workflow — five stages | 08 |
| Self-healing — dynamic roles, task inheritance, battery-aware handoff, relay & store-carry-forward, route repair, health monitoring | 07 |
| Communication Debt · Meaning Before Media | 07, 09, 11 |
| Failure scenarios — all eight | 07 |
| Supported terrains & disasters — all eight | 03 |
| JeevanMap · JeevanEvidence · Actionable insights | 10 |
| Commander console — seven panels | 10 |
| JeevanLink — SOS beacons, messages & broadcasts, location approximation, offline connectivity | 12 |
| Mission outcome — more survivors, faster response, lower risk, efficient resources | 12 |

**Held for Q&A, deliberately off the slides:** the formal wording of the six consistency principles · the full six-role catalogue in detail · alternate planners and optimisation variants · SLAM and mapping as a named subsystem (it sits inside perception) · the distributed-consistency literature framing — *"we bring distributed-consistency principles into the mission-memory layer of a disaster-response swarm"*, never "nobody has done this before".

## Two things to fill before submitting

- **Slide 01** — team name and members.
- **Slide 11** — a real per-drone bill of materials and week count for Phases 2 and 3. Leave the number out rather than guessing on stage.
