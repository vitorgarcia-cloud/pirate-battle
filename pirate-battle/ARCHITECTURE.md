# Pirate Battle — Architecture & Technical Design

This document details the architectural decisions, design patterns, rendering lifecycle, and synchronization strategies implemented for the **Pirate Battle** project, adhering strictly to the requirements in `agent.md`.

---

## 1. System Architecture & Separation of Concerns (SRP)

The project separates the pure game engine simulation from the React user interface and the network integration layer:

- **`src/game/` (Pure Simulation Engine)**:
  - Free from React hooks, JSX, or component lifecycles.
  - Implements a **delta-time-based update loop** (`ticker.deltaMS / 1000`) so entity movement, rotation, weapon cooldowns, projectile lifetimes, and enemy spawns are completely frame-rate agnostic (stable across 60Hz, 120Hz, and 144Hz displays).
  - Layers: `backgroundLayer`, `islandLayer`, `entityLayer`, `effectLayer`, `uiLayer`.
- **`src/ui/` (React Menus & HUD)**:
  - Manages screen navigation (`MainMenu`, `Playing`, `ResultScreen`), settings modal (`OptionsModal`), and real-time heads-up display (`GameHUD`).
- **`src/api/` & `src/mocks/` (Network & Remote State)**:
  - **Axios client** + **TanStack Query** for cached requests, automated stale time handling, background invalidation, and retry capabilities.
  - **Mock Service Worker (MSW)** running in the browser with `localStorage` persistence, deterministic tie-breaking ranking algorithms, and network latency/failure simulations.

---

## 2. React / PixiJS Synchronization & Performance

To prevent React from re-rendering 60 times per second during intense naval combat:
- **Observer Pattern (`EventEmitter`)**: The `GameEngine` acts as an agnostic event subject.
- React components only listen to discrete changes: `score:update`, `time:update`, `player:health`, `game:paused`, `game:resumed`, `game:over`.
- React StrictMode compatibility is guaranteed by strict lifecycle tracking (`isCancelled` flags and dedicated `app.destroy(true)` cleanup in `GameCanvas`).

---

## 3. Combat Rules & Collision System

- **Player Ship**:
  - Longitudinal movement and continuous rotation.
  - **Primary Frontal Cannon** (1 projectile, low cooldown).
  - **Broadside Cannons** (3 parallel projectiles along the hull, port & starboard, higher cooldown).
  - Health bar overlay and visual ship deterioration (alpha opacity scaling).
- **Enemies**:
  - **Chaser**: Directly tracks player ship orientation and applies collision damage on impact before exploding.
  - **Shooter**: Stays within tactical distance (`shooterAttackRange`) and fires directional projectiles towards the player.
- **Collision Detection**:
  - Circle-to-circle collision calculations across ships, projectiles, and island obstacles.
  - Obstacles and island tiles absorb projectiles and block ship navigation.

---

## 4. Network Resilience & Offline-First Persistence

1. **Idempotent Match Submissions**: Match records have unique UUIDs. Duplicate submissions return the existing confirmed entry without duplicate points or ranking spam.
2. **Offline Pending Queue**: If a match ends while the network is offline or encounters a timeout/503 error, the match is saved to `localStorage` under pending matches. The UI notifies the user and provides a **Sync Now** recovery mechanism.
3. **Cross-Tab Invalidation**: Submitting a match immediately invalidates both the `['leaderboard']` and `['matchHistory']` query caches in TanStack Query.
