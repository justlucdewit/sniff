import fs from "fs";
import os from "os";
import path from "path";
import { create } from "zustand";

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

        if (existing) {
            return {
                favoriteDirectories: state.favoriteDirectories.map((item: any) =>
                    item.dir === dir ? { ...item, name } : item
                )
            };
        }

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
}));
