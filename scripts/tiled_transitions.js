#!/usr/bin/env node
/*
 Minimal Tiled helper CLI to:
 1) Inspect a Tiled JSON map for tilesets and wangsets/terrains
 2) Initialize a transitions config stub to map tiles to terrain types and transitions
 3) Apply transitions using a config to generate an overlay layer of transition tiles

 Usage examples:
   node scripts/tiled_transitions.js inspect assets/maps/overworld.json
   node scripts/tiled_transitions.js init-config assets/maps/overworld.json --out scripts/wang_mappings
   node scripts/tiled_transitions.js apply assets/maps/overworld.json --config scripts/wang_mappings/overworld.transitions.json --out assets/maps/overworld.json

 Notes:
 - "apply" requires a config describing how to classify tiles and which transition tile IDs to use per bitmask.
 - This script does NOT modify source tilesets; it creates/updates a separate overlay layer named "Transitions".
*/

const fs = require('fs');
const path = require('path');

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function saveJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function print(msg) {
  process.stdout.write(String(msg) + '\n');
}

function error(msg) {
  process.stderr.write('[ERROR] ' + String(msg) + '\n');
}

function getArgv() {
  const [,, cmd, mapPath, ...rest] = process.argv;
  const opts = {};
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--out') opts.out = rest[++i];
    else if (rest[i] === '--config') opts.config = rest[++i];
  }
  return { cmd, mapPath, opts };
}

function ensureFileExists(file) {
  if (!file) return false;
  if (!fs.existsSync(file)) {
    error(`File not found: ${file}`);
    process.exit(1);
  }
  return true;
}

function inspectMap(map) {
  const tilesets = map.tilesets || [];
  print(`tilesets: ${tilesets.length}`);
  tilesets.forEach((ts, i) => {
    const hasWang = !!ts.wangsets;
    const hasTerrain = !!ts.terrains;
    const src = ts.image || ts.source || '(embedded)';
    print(`${i}: image=${src} firstgid=${ts.firstgid} columns=${ts.columns || '?'} hasWang=${hasWang} hasTerrains=${hasTerrain}`);
  });
  const layers = (map.layers || []).map(l => `${l.type}:${l.name}`);
  print(`layers: ${layers.join(', ')}`);
}

function initConfig(map, outDir) {
  const baseName = path.basename(map, path.extname(map));
  const outPath = path.join(outDir || 'scripts/wang_mappings', `${baseName}.transitions.json`);
  const stub = {
    description: 'Fill in tile classification and transition mapping. localId refers to tile id in tileset (0-based). gid will be computed using firstgid + localId.',
    terrainTypes: ['grass', 'road', 'water'],
    tilesets: (loadJson(map).tilesets || []).map(ts => ({
      name: path.basename(ts.image || ts.source || 'tileset'),
      firstgid: ts.firstgid,
      image: ts.image || null,
      // classify local tile ids into terrain types (fill arrays)
      classify: {
        grass: [],
        road: [],
        water: []
      },
      // transition mapping: for each terrain pair, provide a 4-bit mask mapping (N,E,S,W) -> localId
      transitions: {
        'grass->road': {},
        'grass->water': {},
        'road->grass': {},
        'water->grass': {}
      }
    }))
  };
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  if (!fs.existsSync(outPath)) {
    saveJson(outPath, stub);
    print(`Wrote config stub: ${outPath}`);
  } else {
    print(`Config already exists: ${outPath}`);
  }
}

function loadConfig(configPath) {
  const cfg = loadJson(configPath);
  // build convenience maps
  const tsConfigs = (cfg.tilesets || []).map(ts => ({
    ...ts,
    classifySet: {
      grass: new Set(ts.classify?.grass || []),
      road: new Set(ts.classify?.road || []),
      water: new Set(ts.classify?.water || [])
    }
  }));
  return { cfg, tsConfigs };
}

function gidToTs(map, gid) {
  // Find tileset whose firstgid <= gid and closest to gid
  let found = null;
  for (const ts of map.tilesets) {
    if (gid >= ts.firstgid) {
      if (!found || ts.firstgid > found.firstgid) found = ts;
    }
  }
  if (!found) return null;
  const localId = gid - found.firstgid;
  return { tileset: found, localId };
}

function classifyTile(tsConfig, localId) {
  if (tsConfig.classifySet.grass.has(localId)) return 'grass';
  if (tsConfig.classifySet.road.has(localId)) return 'road';
  if (tsConfig.classifySet.water.has(localId)) return 'water';
  return null;
}

function getTransitionLocalId(tsConfig, from, to, mask) {
  // mask is a string like "NESW" in binary (e.g., "1010") or integer 0..15; we use normalized integer
  const key = `${from}->${to}`;
  const m = typeof mask === 'string' ? parseInt(mask, 2) : mask;
  const entry = tsConfig.transitions?.[key];
  if (!entry) return null;
  const val = entry[String(m)] ?? entry[m];
  return typeof val === 'number' ? val : null;
}

function applyTransitions(map, cfg) {
  // Build fast lookup for tileset config by tileset image/name
  const tsByFirstGid = new Map();
  for (const ts of cfg.tsConfigs) tsByFirstGid.set(ts.firstgid, ts);

  // Choose a base tile layer (first tilelayer)
  const baseLayer = (map.layers || []).find(l => l.type === 'tilelayer');
  if (!baseLayer) {
    error('No tile layer found to analyze.');
    return false;
  }
  const width = baseLayer.width;
  const height = baseLayer.height;
  const data = baseLayer.data;

  // Helper to get terrain type for a tile by gid
  function terrainAt(x, y) {
    if (x < 0 || x >= width || y < 0 || y >= height) return null;
    const gid = data[y * width + x] || 0;
    if (!gid) return null;
    const res = gidToTs(map, gid);
    if (!res) return null;
    const tsCfg = cfg.tsConfigs.find(t => t.firstgid === res.tileset.firstgid);
    if (!tsCfg) return null;
    return classifyTile(tsCfg, res.localId);
  }

  // Create or replace a layer named "Transitions"
  let transLayer = (map.layers || []).find(l => l.type === 'tilelayer' && l.name === 'Transitions');
  if (!transLayer) {
    transLayer = {
      type: 'tilelayer',
      name: 'Transitions',
      width,
      height,
      opacity: 1,
      visible: true,
      data: new Array(width * height).fill(0)
    };
    map.layers.push(transLayer);
  } else {
    transLayer.data = new Array(width * height).fill(0);
  }

  // For each tile, if neighbor types differ, pick a transition tile based on bitmask
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const center = terrainAt(x, y);
      if (!center) continue;

      const n = terrainAt(x, y - 1);
      const e = terrainAt(x + 1, y);
      const s = terrainAt(x, y + 1);
      const w = terrainAt(x - 1, y);

      // Prefer transitions to grass (most common background)
      const neighbors = { n, e, s, w };
      const types = ['road', 'water'];
      let chosen = null;
      for (const t of types) {
        // If any neighbor is t and center is grass, transition grass->t; if center is t and neighbor grass, transition t->grass
        if (center === 'grass') {
          const mask = (n === t ? 1 : 0) | (e === t ? 2 : 0) | (s === t ? 4 : 0) | (w === t ? 8 : 0);
          if (mask) {
            chosen = { from: 'grass', to: t, mask };
            break;
          }
        } else if (center === t) {
          const mask = (n === 'grass' ? 1 : 0) | (e === 'grass' ? 2 : 0) | (s === 'grass' ? 4 : 0) | (w === 'grass' ? 8 : 0);
          if (mask) {
            chosen = { from: t, to: 'grass', mask };
            break;
          }
        }
      }
      if (!chosen) continue;

      // Find tileset at this location and compute transition GID using config
      const gid = data[y * width + x] || 0;
      const res = gidToTs(map, gid);
      if (!res) continue;
      const tsCfg = cfg.tsConfigs.find(t => t.firstgid === res.tileset.firstgid);
      if (!tsCfg) continue;
      const localId = getTransitionLocalId(tsCfg, chosen.from, chosen.to, chosen.mask);
      if (localId == null) continue;
      transLayer.data[y * width + x] = tsCfg.firstgid + localId;
    }
  }
  return true;
}

async function main() {
  const { cmd, mapPath, opts } = getArgv();
  if (!cmd || !mapPath) {
    print('Usage: node scripts/tiled_transitions.js <inspect|init-config|apply> <map.json> [--out <path>] [--config <file>]');
    process.exit(1);
  }
  ensureFileExists(mapPath);
  const map = loadJson(mapPath);

  if (cmd === 'inspect') {
    inspectMap(map);
    if ((map.tilesets || []).every(ts => !ts.wangsets && !ts.terrains)) {
      print('\nNo wangsets/terrains found. You can:');
      print(' - Open tileset in Tiled and define Terrain/Wang sets, then paint transitions');
      print(' - Or run: node scripts/tiled_transitions.js init-config ' + mapPath);
    }
    return;
  }

  if (cmd === 'init-config') {
    initConfig(mapPath, opts.out);
    print('Now edit the generated transitions config and fill tile local IDs.');
    return;
  }

  if (cmd === 'apply') {
    ensureFileExists(opts.config);
    const loaded = loadJson(mapPath);
    const { tsConfigs } = loadConfig(opts.config);
    const ok = applyTransitions(loaded, { tsConfigs });
    if (!ok) process.exit(2);
    const out = opts.out || mapPath;
    saveJson(out, loaded);
    print(`Applied transitions to: ${out}`);
    return;
  }

  error(`Unknown command: ${cmd}`);
  process.exit(1);
}

main().catch(e => {
  error(e?.stack || e);
  process.exit(1);
});


