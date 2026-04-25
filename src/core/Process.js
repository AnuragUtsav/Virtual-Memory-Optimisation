/**
 * Process.js - Process and Page Table
 * 
 * Represents a process with its own virtual address space and page table.
 * Each process has a configurable number of pages and tracks page table entries.
 */

/** A single entry in the page table */
class PageTableEntry {
  constructor(pageId) {
    this.pageId = pageId;
    this.frameId = -1;        // -1 = not in memory
    this.valid = false;       // true = page is in physical memory
    this.dirty = false;       // true = page has been modified
    this.referenced = false;  // true = page has been accessed recently
    this.loadedAt = 0;        // When this page was loaded into memory
    this.lastAccessed = 0;    // Last access timestamp
  }

  /** Mark as loaded into a frame */
  load(frameId, timestamp) {
    this.frameId = frameId;
    this.valid = true;
    this.loadedAt = timestamp;
    this.lastAccessed = timestamp;
    this.referenced = true;
  }

  /** Mark as evicted from memory */
  evict() {
    this.frameId = -1;
    this.valid = false;
    this.dirty = false;
    this.referenced = false;
  }

  /** Update access timestamp */
  access(timestamp) {
    this.lastAccessed = timestamp;
    this.referenced = true;
  }

  snapshot() {
    return {
      pageId: this.pageId,
      frameId: this.frameId,
      valid: this.valid,
      dirty: this.dirty,
      referenced: this.referenced,
      loadedAt: this.loadedAt,
      lastAccessed: this.lastAccessed,
    };
  }
}

export class Process {
  constructor(id, name, numPages, pageSizeBytes = 4096) {
    this.id = id;
    this.name = name;
    this.numPages = numPages;
    this.pageSizeBytes = pageSizeBytes;
    this.pageTable = [];
    this.color = this._generateColor(id);

    // Initialize page table
    for (let i = 0; i < numPages; i++) {
      this.pageTable.push(new PageTableEntry(i));
    }

    // Randomly assign used bytes per page (for fragmentation simulation)
    this.pageUsedBytes = [];
    for (let i = 0; i < numPages; i++) {
      // Pages use between 60% and 100% of the frame size
      const minUsed = Math.floor(pageSizeBytes * 0.6);
      const used = minUsed + Math.floor(Math.random() * (pageSizeBytes - minUsed + 1));
      this.pageUsedBytes.push(used);
    }
  }

  /** Generate a consistent color for this process */
  _generateColor(id) {
    const colors = [
      '#06d6a0', '#4cc9f0', '#a78bfa', '#f472b6',
      '#fb923c', '#fbbf24', '#34d399', '#818cf8',
      '#f87171', '#38bdf8', '#c084fc', '#fb7185',
    ];
    return colors[id % colors.length];
  }

  /** Check if a page is in memory */
  isPageLoaded(pageId) {
    if (pageId < 0 || pageId >= this.numPages) return false;
    return this.pageTable[pageId].valid;
  }

  /** Get the frame ID for a loaded page */
  getFrameId(pageId) {
    if (!this.isPageLoaded(pageId)) return -1;
    return this.pageTable[pageId].frameId;
  }

  /** Load a page into a frame */
  loadPage(pageId, frameId, timestamp) {
    if (pageId < 0 || pageId >= this.numPages) return;
    this.pageTable[pageId].load(frameId, timestamp);
  }

  /** Evict a page from memory */
  evictPage(pageId) {
    if (pageId < 0 || pageId >= this.numPages) return;
    this.pageTable[pageId].evict();
  }

  /** Access a page (update timestamps) */
  accessPage(pageId, timestamp) {
    if (pageId < 0 || pageId >= this.numPages) return;
    this.pageTable[pageId].access(timestamp);
  }

  /** Get used bytes for a specific page */
  getPageUsedBytes(pageId) {
    if (pageId < 0 || pageId >= this.numPages) return 0;
    return this.pageUsedBytes[pageId];
  }

  /** Get count of pages currently in memory */
  getLoadedPageCount() {
    return this.pageTable.filter(e => e.valid).length;
  }

  /** Get a snapshot of the process state */
  snapshot() {
    return {
      id: this.id,
      name: this.name,
      numPages: this.numPages,
      pageSizeBytes: this.pageSizeBytes,
      color: this.color,
      loadedPages: this.getLoadedPageCount(),
      pageTable: this.pageTable.map(e => e.snapshot()),
    };
  }

  /** Reset the page table */
  reset() {
    this.pageTable.forEach(e => e.evict());
  }
}
