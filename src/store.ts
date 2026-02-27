import fs from 'fs'
import { create } from 'zustand';
import path from "path"
import os from "os"

type FileType = "dir" | "file" | "unknown";

const determineContentType = (file: string) => {
    if (fs.lstatSync(file).isFile()) {
        return "file"
    }

    else if (fs.lstatSync(file).isDirectory()) {
        return "dir"
    }

    else {
        return "unknown"
    }
}

export const useSideMenuStore = create((set) => ({
    cursorIndex: 0,
    favoriteDirectories: [
        { name: "root", dir: "/" },
        { name: "home", dir: os.homedir() },
        { name: "projects", dir: path.join(os.homedir(), "projects") },
    ],
    moveUp: () => set((state: any) => ({
        cursorIndex: Math.max(state.cursorIndex - 1, 0)
    })),
    moveDown: () => set((state: any) => ({
        cursorIndex: Math.min(
            state.cursorIndex + 1,
            (useSideMenuStore.getState() as any).favoriteDirectories.length - 1
        )
    })),
    setIndex: (index: number) => set({ cursorIndex: index }),
    addFavoriteDirectory: (name: string, dir: string) => set((state: any) => {
        const existing = state.favoriteDirectories.find((item: any) => item.dir === dir);

        // Replace the existing
        if (existing) {
            return {
                favoriteDirectories: state.favoriteDirectories.map((item: any) =>
                    item.dir === dir ? { ...item, name } : item
                )
            };
        }

        // Add a new item
        return {
            favoriteDirectories: state.favoriteDirectories.concat({ name, dir })
        };
    }),
    removeFavoriteDirectory: (index: number) => set((state: any) => {
        const favoriteDirectories = state.favoriteDirectories.filter((_: any, i: number) => i !== index);
        const maxIndex = Math.max(0, favoriteDirectories.length - 1);

        return {
            favoriteDirectories,
            cursorIndex: Math.min(state.cursorIndex, maxIndex)
        };
    }),
    moveFavoriteDirectoryDown: () => set((state: any) => {
        const index = state.cursorIndex;
        const lastIndex = state.favoriteDirectories.length - 1;

        if (index >= lastIndex) {
            return {};
        }

        const favoriteDirectories = [...state.favoriteDirectories];
        const current = favoriteDirectories[index];
        favoriteDirectories[index] = favoriteDirectories[index + 1];
        favoriteDirectories[index + 1] = current;

        return {
            favoriteDirectories,
            cursorIndex: index + 1
        };
    }),
    moveFavoriteDirectoryUp: () => set((state: any) => {
        const index = state.cursorIndex;

        if (index <= 0) {
            return {};
        }

        const favoriteDirectories = [...state.favoriteDirectories];
        const current = favoriteDirectories[index];
        favoriteDirectories[index] = favoriteDirectories[index - 1];
        favoriteDirectories[index - 1] = current;

        return {
            favoriteDirectories,
            cursorIndex: index - 1
        };
    }),

    saveFavoriteDirectories: () => {
        const configPath = path.join(os.homedir(), "sniffconfig.json");
        const favoriteDirectories = (useSideMenuStore.getState() as any).favoriteDirectories;

        fs.writeFileSync(
            configPath,
            JSON.stringify({ favoriteDirectories }, null, 2)
        );
    },
    
    loadFavoriteDirectories: () => {
        const configPath = path.join(os.homedir(), "sniffconfig.json");

        if (!fs.existsSync(configPath)) {
            const favoriteDirectories = (useSideMenuStore.getState() as any).favoriteDirectories;
            fs.writeFileSync(
                configPath,
                JSON.stringify({ favoriteDirectories }, null, 2)
            );
            return;
        }

        const raw = fs.readFileSync(configPath, "utf-8");
        const parsed = JSON.parse(raw);
        const loadedFavorites = Array.isArray(parsed?.favoriteDirectories)
            ? parsed.favoriteDirectories
            : [];

        if (loadedFavorites.length > 0) {
            set({ favoriteDirectories: loadedFavorites });
        }
    }
}))

export const useTabsStore = create((set) => ({
    tabs: [
        { name: "new_tab", cwd: process.cwd(), cursorIndex: 0, multiSelectOffsetIndex: 0, searchQuery: "" }
    ],
    currentTabIndex: 0,
    closeTab: () => set((state: any) => {
        
        // 1. Create the new array
        const newTabs = state.tabs.filter((_: any, i: number) => i !== state.currentTabIndex);
        
        // 2. Handle the case where the user closes the very last tab
        // We move the index back by one, but never below 0
        const nextIndex = Math.max(0, Math.min(state.currentTabIndex, newTabs.length - 1));

        // 3. If no tab is left after closing, create a new default tab
        if (newTabs.length == 0) {
            newTabs.push({ name: "new_tab", cwd: process.cwd(), cursorIndex: 0, multiSelectOffsetIndex: 0, searchQuery: "" })
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
    createNewTab: (name: string) => set((state: any) => {
        return {
            tabs: state.tabs.concat({
                name: name,
                cwd: process.cwd(),
                cursorIndex: 0,
                multiSelectOffsetIndex: 0,
                searchQuery: ""
            }),
        }
    }),
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

        if (!memory)
            return {};

        // load
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
}))

export const useInputStore = create((set) => ({
    visible: false,
    mode: "none",
    value: '',
    setVisible: (visible: boolean) => set({ visible: visible }),
    setMode: (mode: "none" | "prompt" | "search") => set({ mode: mode }),
    setValue: (value: string) => set({ value: value }),
}))

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
}))

export const popup = (message: string, durationMs: number = 10000) => {
    (usePopupStore.getState() as any).showPopup(message, durationMs);
};

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

    setDirectory: (dir: string) => set((state: any) => ({
        directory: dir,
        searchQuery: ""
    })),

    getSelectedItem: (dir: string) => {
        (useFileStore.getState() as any).loadFiles();
        const files = (useFileStore.getState() as any).files
        const i = (useFileStore.getState() as any).cursorIndex

        return files[i];
    },

    resetSelectedItem: () => set((state: any) => ({
        cursorIndex: 0,
        multiSelectOffsetIndex: 0
    })),

    loadFiles: () => {
        const directory = (useFileStore.getState() as any).directory
        const searchQuery = ((useFileStore.getState() as any).searchQuery ?? "").toLowerCase();
        
        // Safely read directory
        const content = fs.readdirSync(directory);

        // Strict priority mapping
        const typePriority: Record<FileType, number> = {
            "dir": 0,
            "file": 1,
            "unknown": 2
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

            return { name, type }
        })
        
        // Sort: Directories first, then Files, then alphabetically
        .sort((a, b) => {
            if (typePriority[a.type] !== typePriority[b.type]) {
                return typePriority[a.type] - typePriority[b.type];
            }

            return a.name.localeCompare(b.name, undefined, { 
                numeric: true, 
                sensitivity: 'base' 
            });
        })

        // Assign the visible index after sorting
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
