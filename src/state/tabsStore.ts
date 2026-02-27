import { create } from "zustand";
import { useFileStore } from "./fileStore";

export const useTabsStore = create((set) => ({
    tabs: [
        { name: "new_tab", cwd: process.cwd(), cursorIndex: 0, multiSelectOffsetIndex: 0, searchQuery: "" }
    ],
    currentTabIndex: 0,
    closeTab: () => set((state: any) => {
        const newTabs = state.tabs.filter((_: any, i: number) => i !== state.currentTabIndex);
        const nextIndex = Math.max(0, Math.min(state.currentTabIndex, newTabs.length - 1));

        if (newTabs.length == 0) {
            newTabs.push({ name: "new_tab", cwd: process.cwd(), cursorIndex: 0, multiSelectOffsetIndex: 0, searchQuery: "" });
        }

        return {
            tabs: newTabs,
            currentTabIndex: nextIndex
        };
    }),
    nextTab: () => set((state: any) => {
        let v = state.currentTabIndex;
        if (v == state.tabs.length - 1) {
            v = -1;
        }

        return {
            currentTabIndex: (v + 1)
        };
    }),
    previousTab: () => set((state: any) => {
        let v = state.currentTabIndex;
        if (v == 0) {
            v = state.tabs.length;
        }

        return {
            currentTabIndex: (v - 1)
        };
    }),
    createNewTab: (name: string) => set((state: any) => ({
        tabs: state.tabs.concat({
            name,
            cwd: process.cwd(),
            cursorIndex: 0,
            multiSelectOffsetIndex: 0,
            searchQuery: ""
        }),
    })),
    saveTabData: () => set((state: any) => {
        const newTabs = JSON.parse(JSON.stringify(state.tabs));
        const fileStore = useFileStore.getState() as any;

        newTabs[state.currentTabIndex] = {
            name: state.tabs[state.currentTabIndex].name,
            cwd: fileStore.directory,
            cursorIndex: fileStore.cursorIndex,
            multiSelectOffsetIndex: fileStore.multiSelectOffsetIndex,
            searchQuery: fileStore.searchQuery ?? ""
        };

        return {
            tabs: newTabs
        };
    }),
    loadTabData: () => set((state: any) => {
        const memory = state.tabs[state.currentTabIndex] ?? null;

        if (!memory) {
            return {};
        }

        (useFileStore.getState() as any).setDirectory(memory.cwd);
        (useFileStore.getState() as any).setSearchQuery(
            memory.searchQuery ?? "",
            false
        );
        (useFileStore.getState() as any).setSelection(
            memory.cursorIndex ?? 0,
            memory.multiSelectOffsetIndex ?? 0
        );

        return {};
    })
}));
