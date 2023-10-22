// loadingStore.ts
import { create } from "zustand";

type LoadingMessage = {
  message: string;
};

type LoadingState = {
  loadingMessages: LoadingMessage[];
  addLoadingMessage: (message: string) => void;
};

const useLoadingStore = create<LoadingState>((set) => ({
  loadingMessages: [],
  addLoadingMessage: (message: string) => {
    set((prev) => ({
      loadingMessages: [...prev.loadingMessages, { message }],
    }));
  },
}));

export default useLoadingStore;
