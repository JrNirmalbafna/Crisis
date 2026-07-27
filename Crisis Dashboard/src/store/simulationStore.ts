import { create } from 'zustand';

interface SimulationState {
  simulationTime: number; // Unix timestamp
  isPlaying: boolean;
  playbackSpeed: number; // Multiplier: hours per second (e.g. 1, 3, 6)
  
  setSimulationTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
  
  // A helper to advance time in the game loop
  tick: (deltaSeconds: number) => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  // Initialize to current time
  simulationTime: Date.now(),
  isPlaying: false,
  playbackSpeed: 1, // 1 hour per real-world second

  setSimulationTime: (time) => set({ simulationTime: time }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  tick: (deltaSeconds) => set((state) => {
    if (!state.isPlaying) return state;
    
    // speed is in hours/second. 
    // real delta is seconds.
    // so virtual delta in hours = deltaSeconds * state.playbackSpeed
    // virtual delta in ms = virtual delta in hours * 3600 * 1000
    const deltaMs = deltaSeconds * state.playbackSpeed * 3600 * 1000;
    
    return {
      simulationTime: state.simulationTime + deltaMs
    };
  })
}));
