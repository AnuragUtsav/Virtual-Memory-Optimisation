/**
 * Simulator.js - Main Simulation Engine
 * Orchestrates memory management, page fault handling, TLB, and event logging.
 */

import { PhysicalMemory } from './Memory.js';
import { Process } from './Process.js';
import { TLB } from './TLB.js';
import { algorithms } from './algorithms.js';
import { generateMultiProcessWorkload, generateReferenceString } from './WorkloadGenerator.js';

export const EVENT_TYPES = {
  HIT: 'hit',
  FAULT: 'fault',
  REPLACE: 'replace',
  TLB_HIT: 'tlb_hit',
  TLB_MISS: 'tlb_miss',
  THRASH: 'thrash',
};

export class Simulator {
  constructor(config) {
    this.config = {
      numFrames: config.numFrames ?? 8,
      frameSize: config.frameSize ?? 4096,
      algorithm: config.algorithm ?? 'LRU',
      tlbEnabled: config.tlbEnabled ?? true,
      tlbSize: config.tlbSize ?? 16,
      processes: config.processes ?? [],
      totalAccesses: config.totalAccesses ?? 50,
    };

    this.memory = null;
    this.tlb = null;
    this.processes = [];
    this.workload = [];
    this.events = [];
    this.currentStep = 0;
    this.timestamp = 0;

    // Metrics
    this.metrics = {
      totalAccesses: 0,
      pageFaults: 0,
      tlbHits: 0,
      tlbMisses: 0,
      replacements: 0,
      thrashDetected: false,
      thrashWindow: [],
    };

    // Snapshot history for step-by-step playback
    this.history = [];
  }

  /** Initialize the simulator */
  init() {
    this.memory = new PhysicalMemory(this.config.numFrames, this.config.frameSize);
    this.tlb = new TLB(this.config.tlbSize);
    this.tlb.enabled = this.config.tlbEnabled;
    this.processes = [];
    this.events = [];
    this.currentStep = 0;
    this.timestamp = 0;
    this.metrics = { totalAccesses: 0, pageFaults: 0, tlbHits: 0, tlbMisses: 0, replacements: 0, thrashDetected: false, thrashWindow: [] };
    this.history = [];

    // Create process objects
    for (const pc of this.config.processes) {
      this.processes.push(new Process(pc.id, pc.name, pc.numPages, this.config.frameSize));
    }

    // Generate interleaved workload
    this.workload = generateMultiProcessWorkload(
      this.config.processes.map(p => ({ processId: p.id, numPages: p.numPages, workloadType: p.workloadType })),
      this.config.totalAccesses
    );

    // Take initial snapshot
    this.history.push(this._snapshot(null));
  }

  /** Run one step of the simulation */
  step() {
    if (this.currentStep >= this.workload.length) return false;

    const ref = this.workload[this.currentStep];
    const proc = this.processes.find(p => p.id === ref.processId);
    if (!proc) { this.currentStep++; return true; }

    this.timestamp++;
    this.metrics.totalAccesses++;

    // Build future refs for Optimal
    const futureRefs = this.workload.slice(this.currentStep + 1);

    let event = null;

    // 1. TLB Lookup
    const tlbResult = this.tlb.lookup(ref.processId, ref.pageId, this.timestamp);

    if (tlbResult !== -1) {
      // TLB Hit
      this.metrics.tlbHits++;
      this.memory.touchFrame(tlbResult, this.timestamp);
      proc.accessPage(ref.pageId, this.timestamp);
      event = { step: this.currentStep, type: EVENT_TYPES.TLB_HIT, processId: ref.processId, pageId: ref.pageId, frameId: tlbResult, timestamp: this.timestamp, detail: `TLB Hit: P${ref.processId} pg${ref.pageId} → frame ${tlbResult}` };
    } else {
      this.metrics.tlbMisses++;

      if (proc.isPageLoaded(ref.pageId)) {
        // Page Table Hit
        const frameId = proc.getFrameId(ref.pageId);
        this.memory.touchFrame(frameId, this.timestamp);
        proc.accessPage(ref.pageId, this.timestamp);
        this.tlb.insert(ref.processId, ref.pageId, frameId, this.timestamp);
        event = { step: this.currentStep, type: EVENT_TYPES.HIT, processId: ref.processId, pageId: ref.pageId, frameId, timestamp: this.timestamp, detail: `Hit: P${ref.processId} pg${ref.pageId} → frame ${frameId}` };
      } else {
        // Page Fault
        this.metrics.pageFaults++;
        let freeFrame = this.memory.findFreeFrame();
        let replaced = null;

        if (freeFrame === -1) {
          // Run replacement algorithm
          const algoFn = algorithms[this.config.algorithm]?.fn;
          freeFrame = algoFn ? algoFn(this.memory, this.timestamp, futureRefs) : 0;
          const victim = this.memory.frames[freeFrame];
          replaced = { processId: victim.processId, pageId: victim.pageId, frameId: freeFrame };

          // Evict from old process page table + TLB
          const oldProc = this.processes.find(p => p.id === victim.processId);
          if (oldProc) oldProc.evictPage(victim.pageId);
          this.tlb.invalidate(victim.processId, victim.pageId);
          this.metrics.replacements++;
        }

        // Load new page
        const usedBytes = proc.getPageUsedBytes(ref.pageId);
        this.memory.allocateFrame(freeFrame, ref.processId, ref.pageId, usedBytes, this.timestamp);
        proc.loadPage(ref.pageId, freeFrame, this.timestamp);
        this.tlb.insert(ref.processId, ref.pageId, freeFrame, this.timestamp);

        // Thrashing detection: if fault rate in last 10 steps > 70%
        this.metrics.thrashWindow.push(1);
        if (this.metrics.thrashWindow.length > 10) this.metrics.thrashWindow.shift();
        const recentFaultRate = this.metrics.thrashWindow.reduce((a, b) => a + b, 0) / this.metrics.thrashWindow.length;
        if (recentFaultRate >= 0.7) this.metrics.thrashDetected = true;

        const evtType = replaced ? EVENT_TYPES.REPLACE : EVENT_TYPES.FAULT;
        event = { step: this.currentStep, type: evtType, processId: ref.processId, pageId: ref.pageId, frameId: freeFrame, replaced, timestamp: this.timestamp, detail: replaced ? `Fault+Replace: P${ref.processId} pg${ref.pageId} → frame ${freeFrame} (evicted P${replaced.processId} pg${replaced.pageId})` : `Fault: P${ref.processId} pg${ref.pageId} → frame ${freeFrame} (free frame)` };
      }
    }

    // Track non-faults in thrash window
    if (event.type === EVENT_TYPES.HIT || event.type === EVENT_TYPES.TLB_HIT) {
      this.metrics.thrashWindow.push(0);
      if (this.metrics.thrashWindow.length > 10) this.metrics.thrashWindow.shift();
    }

    this.events.push(event);
    this.currentStep++;
    this.history.push(this._snapshot(event));
    return true;
  }

  /** Run the full simulation at once */
  runAll() {
    while (this.currentStep < this.workload.length) this.step();
  }

  /** Get computed statistics */
  getStats() {
    const total = this.metrics.totalAccesses;
    const faults = this.metrics.pageFaults;
    const tlbHits = this.metrics.tlbHits;
    const mem = this.memory;
    return {
      totalAccesses: total,
      pageFaults: faults,
      pageFaultRate: total > 0 ? faults / total : 0,
      hitRate: total > 0 ? (total - faults) / total : 0,
      tlbHits,
      tlbMisses: this.metrics.tlbMisses,
      tlbHitRate: this.tlb.getHitRate(),
      replacements: this.metrics.replacements,
      memoryUtilization: mem ? mem.getUtilization() : 0,
      totalFragmentation: mem ? mem.getTotalFragmentation() : 0,
      thrashDetected: this.metrics.thrashDetected,
      algorithm: this.config.algorithm,
    };
  }

  _snapshot(event) {
    return {
      step: this.currentStep,
      event,
      memory: this.memory ? this.memory.snapshot() : null,
      tlb: this.tlb ? this.tlb.snapshot() : null,
      processes: this.processes.map(p => p.snapshot()),
      stats: this.getStats(),
    };
  }

  isDone() { return this.currentStep >= this.workload.length; }
  getProgress() { return this.workload.length > 0 ? this.currentStep / this.workload.length : 0; }
}

/**
 * Run simulation for multiple algorithms and return comparison data.
 */
export function runComparison(baseConfig, frameCountRange) {
  const results = {};
  for (const algo of ['FIFO', 'LRU', 'Optimal']) {
    results[algo] = [];
    for (const nf of frameCountRange) {
      const sim = new Simulator({ ...baseConfig, numFrames: nf, algorithm: algo });
      sim.init();
      sim.runAll();
      const s = sim.getStats();
      results[algo].push({ frames: nf, pageFaults: s.pageFaults, faultRate: s.pageFaultRate });
    }
  }
  return results;
}
