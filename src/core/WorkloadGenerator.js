/**
 * WorkloadGenerator.js - Reference String Generator
 * Generates page access sequences for different workload patterns.
 */

export const WORKLOAD_TYPES = {
  SEQUENTIAL: 'sequential',
  RANDOM: 'random',
  LOCALITY: 'locality',
  LOOPING: 'looping',
};

export const workloadInfo = {
  [WORKLOAD_TYPES.SEQUENTIAL]: { name: 'Sequential', description: 'Pages accessed in sequential order', icon: '→' },
  [WORKLOAD_TYPES.RANDOM]: { name: 'Random', description: 'Uniform random page access', icon: '⟳' },
  [WORKLOAD_TYPES.LOCALITY]: { name: 'Locality (80/20)', description: '80% of accesses target 20% of pages', icon: '◎' },
  [WORKLOAD_TYPES.LOOPING]: { name: 'Looping', description: 'Repeated access over a small working set', icon: '↻' },
};

export function generateReferenceString(type, numPages, length) {
  switch (type) {
    case WORKLOAD_TYPES.SEQUENTIAL: return genSeq(numPages, length);
    case WORKLOAD_TYPES.RANDOM: return genRand(numPages, length);
    case WORKLOAD_TYPES.LOCALITY: return genLocality(numPages, length);
    case WORKLOAD_TYPES.LOOPING: return genLoop(numPages, length);
    default: return genRand(numPages, length);
  }
}

function genSeq(n, len) {
  const r = [];
  for (let i = 0; i < len; i++) r.push(i % n);
  return r;
}

function genRand(n, len) {
  const r = [];
  for (let i = 0; i < len; i++) r.push(Math.floor(Math.random() * n));
  return r;
}

function genLocality(n, len) {
  const r = [];
  const hotSize = Math.max(1, Math.floor(n * 0.2));
  const all = Array.from({ length: n }, (_, i) => i).sort(() => Math.random() - 0.5);
  const hot = all.slice(0, hotSize);
  const cold = all.slice(hotSize);
  for (let i = 0; i < len; i++) {
    if (Math.random() < 0.8 || cold.length === 0)
      r.push(hot[Math.floor(Math.random() * hot.length)]);
    else
      r.push(cold[Math.floor(Math.random() * cold.length)]);
  }
  return r;
}

function genLoop(n, len) {
  const r = [];
  const ws = Math.max(2, Math.floor(n * 0.3));
  let start = 0, i = 0;
  while (i < len) {
    const loops = 2 + Math.floor(Math.random() * 3);
    for (let l = 0; l < loops && i < len; l++)
      for (let p = 0; p < ws && i < len; p++) { r.push((start + p) % n); i++; }
    start = Math.floor(Math.random() * n);
  }
  return r;
}

export function generateMultiProcessWorkload(processConfigs, totalAccesses) {
  const refStrings = processConfigs.map(c => ({
    processId: c.processId,
    refs: generateReferenceString(c.workloadType, c.numPages, Math.ceil(totalAccesses / processConfigs.length)),
    index: 0,
  }));
  const workload = [];
  let cur = 0;
  for (let i = 0; i < totalAccesses; i++) {
    const ps = refStrings[cur];
    if (ps.index < ps.refs.length) {
      workload.push({ processId: ps.processId, pageId: ps.refs[ps.index] });
      ps.index++;
    }
    cur = (cur + 1) % refStrings.length;
  }
  return workload;
}
