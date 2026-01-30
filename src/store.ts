import fs from 'fs'
import { create } from 'zustand';

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

    loadFiles: () => set((state: any) => {
        const content = fs.readdirSync(state.directory);

        let indx = 0;

        return {
            files: content.map(c => ({
                name: c,
                type: determineContentType(state.directory + "/" + c),
                indx: indx++
            }))
        }
    }),
}));