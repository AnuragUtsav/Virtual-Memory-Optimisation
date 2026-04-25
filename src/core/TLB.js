/**
 * TLB.js - Translation Lookaside Buffer
 * 
 * Simulates a TLB cache that speeds up page table lookups.
 * Implements a simple LRU eviction for TLB entries.
 */

class TLBEntry {
  constructor(processId, pageId, frameId, timestamp) {
    this.processId = processId;
    this.pageId = pageId;
    this.frameId = frameId;
    this.lastAccessed = timestamp;
  }
}

export class TLB {
  constructor(size = 16) {
    this.size = size;
    this.entries = [];
    this.hits = 0;
    this.misses = 0;
    this.enabled = true;
  }

  /** Lookup a page in the TLB. Returns frame ID or -1 on miss. */
  lookup(processId, pageId, timestamp) {
    if (!this.enabled) {
      this.misses++;
      return -1;
    }

    for (const entry of this.entries) {
      if (entry.processId === processId && entry.pageId === pageId) {
        entry.lastAccessed = timestamp;
        this.hits++;
        return entry.frameId;
      }
    }
    this.misses++;
    return -1;
  }

  /** Insert or update a TLB entry */
  insert(processId, pageId, frameId, timestamp) {
    if (!this.enabled) return;

    // Check if entry already exists, update it
    for (let i = 0; i < this.entries.length; i++) {
      if (this.entries[i].processId === processId && this.entries[i].pageId === pageId) {
        this.entries[i].frameId = frameId;
        this.entries[i].lastAccessed = timestamp;
        return;
      }
    }

    // If TLB is full, evict LRU entry
    if (this.entries.length >= this.size) {
      let lruIdx = 0;
      let lruTime = this.entries[0].lastAccessed;
      for (let i = 1; i < this.entries.length; i++) {
        if (this.entries[i].lastAccessed < lruTime) {
          lruTime = this.entries[i].lastAccessed;
          lruIdx = i;
        }
      }
      this.entries.splice(lruIdx, 1);
    }

    this.entries.push(new TLBEntry(processId, pageId, frameId, timestamp));
  }

  /** Invalidate a specific entry (on page eviction) */
  invalidate(processId, pageId) {
    this.entries = this.entries.filter(
      e => !(e.processId === processId && e.pageId === pageId)
    );
  }

  /** Flush all entries for a process */
  flushProcess(processId) {
    this.entries = this.entries.filter(e => e.processId !== processId);
  }

  /** Flush the entire TLB */
  flush() {
    this.entries = [];
  }

  /** Get TLB hit rate */
  getHitRate() {
    const total = this.hits + this.misses;
    return total === 0 ? 0 : this.hits / total;
  }

  /** Get a snapshot of TLB state */
  snapshot() {
    return {
      size: this.size,
      enabled: this.enabled,
      entries: this.entries.map(e => ({
        processId: e.processId,
        pageId: e.pageId,
        frameId: e.frameId,
        lastAccessed: e.lastAccessed,
      })),
      hits: this.hits,
      misses: this.misses,
      hitRate: this.getHitRate(),
      occupancy: this.entries.length,
    };
  }

  /** Reset TLB stats and entries */
  reset() {
    this.entries = [];
    this.hits = 0;
    this.misses = 0;
  }
}
