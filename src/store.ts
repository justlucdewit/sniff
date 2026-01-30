import fs from 'fs'
import { create } from 'zustand';
import path from "path"

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