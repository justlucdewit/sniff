import { create } from "zustand";

export const useInputStore = create((set) => ({
    visible: false,
    mode: "none",
    value: "",
    setVisible: (visible: boolean) => set({ visible }),
    setMode: (mode: "none" | "prompt" | "search" | "command") => set({ mode }),
    setValue: (value: string) => set({ value }),
}));
