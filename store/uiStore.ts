import { create } from "zustand";

export type ToastVariant = "info" | "success" | "warning" | "error";

export interface ToastMessage {
  id: string;
  variant: ToastVariant;
  message: string;
}

interface UIState {
  toasts: ToastMessage[];
  isProcessing: boolean;
  showToast: (variant: ToastVariant, message: string) => void;
  dismissToast: (id: string) => void;
  setProcessing: (isProcessing: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  isProcessing: false,
  showToast: (variant, message) =>
    set((state) => ({
      toasts: [...state.toasts, { id: crypto.randomUUID(), variant, message }],
    })),
  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
  setProcessing: (isProcessing) => set({ isProcessing }),
}));
