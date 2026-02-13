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
    favoriteDirectories: [
        { name: "root", dir: "/" },
        { name: "home", dir: os.homedir() },
        { name: "projects", dir: path.join(os.homedir(), "projects") },
    ],
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
        { name: "new_tab", cwd: process.cwd(), cursorIndex: 0 }
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
            newTabs.push({ name: "new_tab", cwd: process.cwd(), cursorIndex: 0 })
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
                cursorIndex: 0
            }),
        }
    }),
    saveTabData: () => set((state: any) => {
        const newTabs = JSON.parse(JSON.stringify(state.tabs));
        const fileStore = useFileStore.getState() as any;

        newTabs[state.currentTabIndex] = {
            name: state.tabs[state.currentTabIndex].name,
            cwd: fileStore.directory,
            cursorIndex: fileStore.cursorIndex
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
        (useFileStore.getState() as any).setIndex(memory.cursorIndex);

        return {};
    })
}))

export const useInputStore = create((set) => ({
    visible: false,
    value: '',
    setVisible: (visible: boolean) => set({ visible: visible }),
    setValue: (value: string) => set({ value: value }),
}))

export const useFileStore = create((set) => ({
    cursorIndex: 0,
    directory: "/",
    files: [],
  
    moveUp: () => set((state: any) => ({ 
        cursorIndex: Math.max(state.cursorIndex - 1, 0)
    })),

    moveDown: () => set((state: any) => ({ 
        cursorIndex: Math.min(state.cursorIndex + 1, (useFileStore.getState() as any).files.length - 1)
    })),

    setIndex: (index: number) => set({ cursorIndex: index }),

    setDirectory: (dir: string) => set((state: any) => ({
        directory: dir
    })),

    getSelectedItem: (dir: string) => {
        (useFileStore.getState() as any).loadFiles();
        const files = (useFileStore.getState() as any).files
        const i = (useFileStore.getState() as any).cursorIndex

        return files[i];
    },

    resetSelectedItem: () => set((state: any) => ({
        cursorIndex: 0
    })),

    loadFiles: () => {
        const directory = (useFileStore.getState() as any).directory
        
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

        set({ files: sortedFiles });
    },
}));
