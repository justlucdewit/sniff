import { create } from "zustand";

export const usePopupStore = create((set, get) => ({
    nextPopupId: 1,
    activePopup: null as null | { id: number, message: string },

    showPopup: (message: string, durationMs: number = 10000) => {
        const popupId = (get() as any).nextPopupId;

        set({
            nextPopupId: popupId + 1,
            activePopup: { id: popupId, message }
        });

        setTimeout(() => {
            const activePopup = (get() as any).activePopup;
            if (activePopup?.id == popupId) {
                set({ activePopup: null });
            }
        }, durationMs);
    }
}));

export const popup = (message: string, durationMs: number = 10000) => {
    (usePopupStore.getState() as any).showPopup(message, durationMs);
};
