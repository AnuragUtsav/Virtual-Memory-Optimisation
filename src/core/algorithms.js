/**
 * algorithms.js - Page Replacement Algorithms
 * 
 * Implements FIFO, LRU, and Optimal page replacement strategies.
 * Each algorithm receives the current memory state and returns
 * the frame index to evict.
 */

/**
 * FIFO (First-In, First-Out)
 * Evicts the page that was loaded earliest.
 * 
 * @param {import('./Memory').PhysicalMemory} memory 
 * @param {number} _currentTime - unused
 * @param {Array} _futureRefs - unused
 * @returns {number} Frame index to evict
 */
export function fifoReplace(memory, _currentTime, _futureRefs) {
  let oldestTime = Infinity;
  let oldestFrame = 0;

  for (let i = 0; i < memory.frames.length; i++) {
    const frame = memory.frames[i];
    if (frame.occupied && frame.loadedAt < oldestTime) {
      oldestTime = frame.loadedAt;
      oldestFrame = i;
    }
  }

  return oldestFrame;
}

/**
 * LRU (Least Recently Used)
 * Evicts the page that hasn't been accessed for the longest time.
 * 
 * @param {import('./Memory').PhysicalMemory} memory 
 * @param {number} _currentTime - unused
 * @param {Array} _futureRefs - unused
 * @returns {number} Frame index to evict
 */
export function lruReplace(memory, _currentTime, _futureRefs) {
  let lruTime = Infinity;
  let lruFrame = 0;

  for (let i = 0; i < memory.frames.length; i++) {
    const frame = memory.frames[i];
    if (frame.occupied && frame.lastAccessed < lruTime) {
      lruTime = frame.lastAccessed;
      lruFrame = i;
    }
  }

  return lruFrame;
}

/**
 * Optimal (Bélády's Algorithm)
 * Evicts the page that won't be used for the longest time in the future.
 * This is the theoretical best and used for comparison only.
 * 
 * @param {import('./Memory').PhysicalMemory} memory 
 * @param {number} _currentTime - unused
 * @param {Array} futureRefs - Remaining reference string [{processId, pageId}, ...]
 * @returns {number} Frame index to evict
 */
export function optimalReplace(memory, _currentTime, futureRefs) {
  let farthest = -1;
  let victimFrame = 0;

  for (let i = 0; i < memory.frames.length; i++) {
    const frame = memory.frames[i];
    if (!frame.occupied) continue;

    // Find next use of this page in future references
    let nextUse = Infinity;
    for (let j = 0; j < futureRefs.length; j++) {
      if (futureRefs[j].processId === frame.processId && 
          futureRefs[j].pageId === frame.pageId) {
        nextUse = j;
        break;
      }
    }

    if (nextUse === Infinity) {
      // This page is never used again - best candidate
      return i;
    }

    if (nextUse > farthest) {
      farthest = nextUse;
      victimFrame = i;
    }
  }

  return victimFrame;
}

/** Algorithm registry for easy lookup */
export const algorithms = {
  FIFO: {
    name: 'FIFO',
    fullName: 'First-In, First-Out',
    description: 'Evicts the page that was loaded first into memory.',
    fn: fifoReplace,
    color: '#4cc9f0',
  },
  LRU: {
    name: 'LRU',
    fullName: 'Least Recently Used',
    description: 'Evicts the page that hasn\'t been accessed for the longest time.',
    fn: lruReplace,
    color: '#06d6a0',
  },
  Optimal: {
    name: 'Optimal',
    fullName: 'Bélády\'s Optimal Algorithm',
    description: 'Evicts the page that won\'t be needed for the longest time (theoretical best).',
    fn: optimalReplace,
    color: '#a78bfa',
  },
};

export default algorithms;
