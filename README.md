# Virtual Memory Optimization Simulator

A complete, production-quality simulator that visualizes and analyzes demand paging, memory allocation, and fragmentation under various workloads.

## Features

- **Interactive Visualization**: See physical memory frames allocate, hit, and fault in real-time with beautiful glassmorphic UI.
- **Page Replacement Algorithms**: Compare FIFO, LRU, and Optimal (Bélády's) algorithms.
- **Advanced Workload Generation**: Simulate Sequential, Random, Locality (80/20 rule), and Looping access patterns.
- **Multi-Process Support**: Simulates an OS handling multiple processes interleaving memory requests.
- **Metrics Dashboard**: Track Hit Rate, Page Faults, Replacements, Memory Utilization, and Internal Fragmentation.
- **Algorithmic Comparison Charts**: Visualize the performance (Page Faults vs. Frame Count) of different algorithms, potentially demonstrating Bélády's Anomaly.
- **Event Log**: Step-by-step logging of TLB hits, memory hits, page faults, and frame replacements.

## Tech Stack
- Frontend: **React** + **Vite**
- Styling: **Tailwind CSS v4** + Framer Motion (Animations)
- Charts: **Recharts**

## How to Run

1. Make sure you have Node.js installed.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open the displayed URL (usually `http://localhost:5173`) in your browser.

## Architecture

- `src/core/Memory.js`: Physical memory and frame management, internal fragmentation calculation.
- `src/core/Process.js`: Process structure, page table representation.
- `src/core/TLB.js`: Translation Lookaside Buffer simulation.
- `src/core/WorkloadGenerator.js`: Configurable reference string generators.
- `src/core/algorithms.js`: Implementation of FIFO, LRU, Optimal.
- `src/core/Simulator.js`: The main engine orchestrating the components and maintaining state.
- `src/components/*`: React UI components bridging the engine to the DOM.
