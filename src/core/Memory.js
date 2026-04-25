/**
 * Memory.js - Physical Memory Manager
 * 
 * Manages the physical memory frames, allocation, deallocation,
 * and tracks internal fragmentation.
 */

export class Frame {
  constructor(frameId, frameSize) {
    this.frameId = frameId;
    this.frameSize = frameSize;    // Total bytes in frame
    this.processId = null;         // Owning process ID
    this.pageId = null;            // Loaded page ID
    this.occupied = false;
    this.usedBytes = 0;            // Actual used bytes (for fragmentation tracking)
    this.loadedAt = 0;             // Timestamp when loaded (for FIFO)
    this.lastAccessed = 0;         // Last access timestamp (for LRU)
    this.dirty = false;            // Modified flag
  }

  /** Load a page into this frame */
  load(processId, pageId, usedBytes, timestamp) {
    this.processId = processId;
    this.pageId = pageId;
    this.occupied = true;
    this.usedBytes = usedBytes;
    this.loadedAt = timestamp;
    this.lastAccessed = timestamp;
    this.dirty = false;
  }

  /** Clear this frame */
  clear() {
    this.processId = null;
    this.pageId = null;
    this.occupied = false;
    this.usedBytes = 0;
    this.loadedAt = 0;
    this.lastAccessed = 0;
    this.dirty = false;
  }

  /** Get internal fragmentation for this frame */
  getFragmentation() {
    if (!this.occupied) return 0;
    return this.frameSize - this.usedBytes;
  }

  /** Create a snapshot of this frame's state */
  snapshot() {
    return {
      frameId: this.frameId,
      frameSize: this.frameSize,
      processId: this.processId,
      pageId: this.pageId,
      occupied: this.occupied,
      usedBytes: this.usedBytes,
      loadedAt: this.loadedAt,
      lastAccessed: this.lastAccessed,
      dirty: this.dirty,
      fragmentation: this.getFragmentation(),
    };
  }
}

export class PhysicalMemory {
  constructor(numFrames, frameSize) {
    this.numFrames = numFrames;
    this.frameSize = frameSize;
    this.frames = [];
    this.totalCapacity = numFrames * frameSize;

    for (let i = 0; i < numFrames; i++) {
      this.frames.push(new Frame(i, frameSize));
    }
  }

  /** Find a free frame, returns frame index or -1 */
  findFreeFrame() {
    for (let i = 0; i < this.frames.length; i++) {
      if (!this.frames[i].occupied) return i;
    }
    return -1;
  }

  /** Get count of occupied frames */
  getOccupiedCount() {
    return this.frames.filter(f => f.occupied).length;
  }

  /** Get memory utilization as a ratio [0, 1] */
  getUtilization() {
    return this.getOccupiedCount() / this.numFrames;
  }

  /** Get total internal fragmentation in bytes */
  getTotalFragmentation() {
    return this.frames.reduce((sum, f) => sum + f.getFragmentation(), 0);
  }

  /** Get all frames owned by a specific process */
  getProcessFrames(processId) {
    return this.frames.filter(f => f.processId === processId);
  }

  /** Allocate a frame to a process page */
  allocateFrame(frameIndex, processId, pageId, usedBytes, timestamp) {
    if (frameIndex < 0 || frameIndex >= this.numFrames) return false;
    this.frames[frameIndex].load(processId, pageId, usedBytes, timestamp);
    return true;
  }

  /** Deallocate (free) a frame */
  deallocateFrame(frameIndex) {
    if (frameIndex < 0 || frameIndex >= this.numFrames) return false;
    this.frames[frameIndex].clear();
    return true;
  }

  /** Update the access timestamp for LRU tracking */
  touchFrame(frameIndex, timestamp) {
    if (frameIndex >= 0 && frameIndex < this.numFrames) {
      this.frames[frameIndex].lastAccessed = timestamp;
    }
  }

  /** Get a snapshot of the entire memory state */
  snapshot() {
    return {
      numFrames: this.numFrames,
      frameSize: this.frameSize,
      totalCapacity: this.totalCapacity,
      occupiedCount: this.getOccupiedCount(),
      utilization: this.getUtilization(),
      totalFragmentation: this.getTotalFragmentation(),
      frames: this.frames.map(f => f.snapshot()),
    };
  }

  /** Reset all frames */
  reset() {
    this.frames.forEach(f => f.clear());
  }
}
