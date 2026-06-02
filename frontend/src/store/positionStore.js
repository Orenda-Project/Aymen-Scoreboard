import { create } from 'zustand';

const usePositionStore = create((set) => ({
  // Current selected position
  currentPosition: null,

  // Set the current position
  setCurrentPosition: (position) => set({ currentPosition: position }),

  // Clear current position
  clearCurrentPosition: () => set({ currentPosition: null }),
}));

export default usePositionStore;
