import { createCliRenderer } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { popup, useFileStore, useInputStore, useSideMenuStore } from "./src/state/store"
import { App } from './src/components/layout/App'
import fs from "fs"
import os from "os"
import path from "path"
import { attachKeyboardHandlers } from "./src/input/keyboard/attachKeyboardHandlers"

declare global {
    var popup: (message: string) => void;
}

globalThis.popup = (message: string) => {
    popup(message, 10000);
};

const lastDirectoryFilePath = path.join(os.homedir(), ".sniff-last-dir");

const persistLastDirectory = (dir: string) => {
    if (!dir || typeof dir !== "string") {
        return;
    }

    try {
        fs.writeFileSync(lastDirectoryFilePath, `${dir}\n`, "utf-8");
    }
    catch {
        // Ignore persistence errors so navigation keeps working.
    }
};

const renderer = await createCliRenderer();
createRoot(renderer).render(<App />);

(useSideMenuStore.getState() as any).loadFavoriteDirectories();
useSideMenuStore.subscribe((state: any, prevState: any) => {
    if (state.favoriteDirectories !== prevState.favoriteDirectories) {
        (useSideMenuStore.getState() as any).saveFavoriteDirectories();
    }
});
useInputStore.subscribe((state: any, prevState: any) => {
    if (!state.visible || state.mode !== "search" || state.value === prevState.value) {
        return;
    }

    (useFileStore.getState() as any).setSearchQuery(state.value, false);
    (useFileStore.getState() as any).loadFiles();
});
useFileStore.subscribe((state: any, prevState: any) => {
    if (state.directory !== prevState.directory) {
        persistLastDirectory(state.directory);
    }
});

process.on("exit", () => {
    const dir = (useFileStore.getState() as any).directory;
    persistLastDirectory(dir);
});

attachKeyboardHandlers(renderer);

(useFileStore.getState() as any).setDirectory(process.cwd());
(useFileStore.getState() as any).loadFiles();
persistLastDirectory((useFileStore.getState() as any).directory);
