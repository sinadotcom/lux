# LUX — Reclaim the Light

A premium browser puzzle about restoring power to abandoned miniature cities floating in darkness. Every solved board is a district waking up: streets glow amber, windows light one by one, and the world map slowly comes back to life.

The underlying logic is the classic *Light Up* constraint system, but the game never says so — you install **energy cores**, satisfy each structure's printed **power requirement**, and bring **power to every street**. Two cores may never feed each other down the same open street.

## Run it

```bash
npm install
npm run dev      # local development
npm run build    # production build (type-checks first)
npm test         # puzzle engine test suite (solver, generator, daily, hints)
```

Targets evergreen Chrome, Safari, Firefox and Edge on desktop, tablet and mobile.

## How it plays

- **Districts** — eight handcrafted-feeling boards (deterministically generated and uniqueness-verified), each unlocking neighbors on the world map and one recovered *memory*.
- **Daily City** — one seeded puzzle per local calendar day, with streak tracking. Weekends run slightly harder.
- **Survey (hint)** — flags a misplaced core or reveals one correct placement; using it forfeits the *flawless restoration* mark.
- **Archive** — restoration statistics, recovered memories, and settings.

Controls: click/tap a street to install or remove a core; drag to orbit, wheel/pinch to dolly. Full keyboard play: arrows roam the streets, `Space`/`Enter` toggles a core, `U` undoes, `H` surveys, `Esc` returns to the map.

## Architecture

```
src/
  game/        Pure logic, zero dependencies, runs in node
    board.ts        grid model + evaluation (lit cells, conflicts, clue state)
    solver.ts       propagation + backtracking solver, uniqueness counting, hints
    generator.ts    seeded generation with difficulty presets, unique-solution guarantee
    daily.ts        local-date seeded Daily City
    districts.ts    world content: districts, unlock graph, memories
    engine.test.ts  node:test suite
  state/       zustand store: session, progression, settings, localStorage persistence
  audio/       generative WebAudio score — drone bed that opens with restoration
               progress, pentatonic placement plucks, completion swell. No assets.
  scene/       React Three Fiber diorama
    useEnergyField  discrete lit/unlit → continuous, time-staggered power spread
    Tiles           instanced streets + additive energy faces (what bloom catches)
    Buildings       structures, requirement plates (runtime canvas digits), reactive windows
    Cores           lantern cores: descent, landing pulse, breathing, conflict stutter
    CameraRig       damped orbit, breathing drift, hero revolution on completion
    Dust            atmospheric motes, density follows restoration
  ui/          DOM screens: title, world map (SVG), HUD, archive
```

### Design notes

- **Fantasy first.** No mathematical vocabulary anywhere in the UI; the rules are expressed as grid restoration. Errors read as *grid overload*, hints as *surveys*.
- **Determinism.** All generation flows through a seeded mulberry32 RNG, so district boards and dailies are identical for every player — and reproducible in tests.
- **Accessibility.** Reduced motion (honors `prefers-reduced-motion`), reduced effects (fewer particles, no post-processing, no shadows), high-contrast energy ramp, shape-coded clue states (ring = satisfied, bar = over-supplied), full keyboard play, ARIA roles on the map.
- **Performance.** Streets, energy faces and windows are instanced; post-processing is a single composer pass; the canvas mounts only during play; DPR capped at 2.
