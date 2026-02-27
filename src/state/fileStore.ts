import fs from "fs";
import path from "path";
import { create } from "zustand";

type FileType = "dir" | "file" | "unknown";

export const useFileStore = create((set) => ({
    cursorIndex: 0,
    multiSelectOffsetIndex: 0,
    searchQuery: "",
    directory: "/",
    files: [],

    moveUp: () => set((state: any) => ({
        cursorIndex: Math.max(state.cursorIndex - 1, 0),
        multiSelectOffsetIndex: 0
    })),

    moveDown: () => set((state: any) => ({
        cursorIndex: Math.min(state.cursorIndex + 1, (useFileStore.getState() as any).files.length - 1),
        multiSelectOffsetIndex: 0
    })),

    extendSelectionUp: () => set((state: any) => {
        const offset = state.multiSelectOffsetIndex - 1;
        const minOffset = -state.cursorIndex;

        return {
            multiSelectOffsetIndex: Math.max(minOffset, offset)
        };
    }),

    extendSelectionDown: () => set((state: any) => {
        const files = (useFileStore.getState() as any).files;
        const maxIndex = Math.max(0, files.length - 1);
        const offset = state.multiSelectOffsetIndex + 1;
        const maxOffset = maxIndex - state.cursorIndex;

        return {
            multiSelectOffsetIndex: Math.min(maxOffset, offset)
        };
    }),

    setIndex: (index: number) => set({
        cursorIndex: index,
        multiSelectOffsetIndex: 0
    }),
    setSelection: (index: number, offset: number) => set({
        cursorIndex: Math.max(0, index),
        multiSelectOffsetIndex: offset
    }),
    setSearchQuery: (query: string, resetSelection: boolean = true) => set((state: any) => ({
        searchQuery: query,
        cursorIndex: resetSelection ? 0 : state.cursorIndex,
        multiSelectOffsetIndex: resetSelection ? 0 : state.multiSelectOffsetIndex
    })),

    setDirectory: (dir: string) => set(() => ({
        directory: dir,
        searchQuery: ""
    })),

    getSelectedItem: () => {
        (useFileStore.getState() as any).loadFiles();
        const files = (useFileStore.getState() as any).files;
        const i = (useFileStore.getState() as any).cursorIndex;

        return files[i];
    },

    resetSelectedItem: () => set(() => ({
        cursorIndex: 0,
        multiSelectOffsetIndex: 0
    })),

    loadFiles: () => {
        const directory = (useFileStore.getState() as any).directory;
        const searchQuery = ((useFileStore.getState() as any).searchQuery ?? "").toLowerCase();

        const content = fs.readdirSync(directory);

        const typePriority: Record<FileType, number> = {
            dir: 0,
            file: 1,
            unknown: 2
        };

        const sortedFiles = content
            .map((name) => {
                const fullPath = path.join(directory, name);
                let type: FileType = "unknown";

                const stats = fs.lstatSync(fullPath);
                if (stats.isDirectory()) {
                    type = "dir";
                } else if (stats.isFile()) {
                    type = "file";
                }

                return { name, type, size: stats.size };
            })
            .sort((a, b) => {
                if (typePriority[a.type] !== typePriority[b.type]) {
                    return typePriority[a.type] - typePriority[b.type];
                }

                return a.name.localeCompare(b.name, undefined, {
                    numeric: true,
                    sensitivity: "base"
                });
            })
            .map((file, index) => ({
                ...file,
                indx: index
            }));

        const filteredFiles = searchQuery.length > 0
            ? sortedFiles.filter((file) => file.name.toLowerCase().includes(searchQuery))
            : sortedFiles;
        const maxIndex = Math.max(0, filteredFiles.length - 1);
        const currentCursor = (useFileStore.getState() as any).cursorIndex ?? 0;
        const currentOffset = (useFileStore.getState() as any).multiSelectOffsetIndex ?? 0;
        const clampedCursor = Math.min(Math.max(0, currentCursor), maxIndex);
        const minOffset = -clampedCursor;
        const maxOffset = maxIndex - clampedCursor;
        const clampedOffset = filteredFiles.length > 0
            ? Math.min(maxOffset, Math.max(minOffset, currentOffset))
            : 0;

        set({
            files: filteredFiles.map((file, index) => ({ ...file, indx: index })),
            cursorIndex: clampedCursor,
            multiSelectOffsetIndex: clampedOffset
        });
    },
}));
