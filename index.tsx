import { createCliRenderer, type KeyEvent } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { useFileStore } from "./src/store"
import { exec } from 'child_process'
import { App } from './src/App'
import settings from './src/settings'
import fs from "fs"

const renderer = await createCliRenderer();
createRoot(renderer).render(<App />)

const keyHandler = renderer.keyInput;

keyHandler.on("keypress", (key: KeyEvent) => {
    const inputBar = renderer.root.findDescendantById("inputbar");
    const fileList = renderer.root.findDescendantById("files");

    // Global keybinds
    if (key.name == "q") {
        renderer.destroy()
    }

    if (key.name == "?") {
        renderer.toggleDebugOverlay()
    }

    if (key.name == "tab") {
        // if (fileList?.focused)
        //     inputBar?.focus();
        // else if (inputBar?.focused)
        //     fileList?.focus();
    }

    // File list keybinds
    if (fileList?.focused) {
        // Moving selection down
        if (key.name == "j") {
            (useFileStore.getState() as any).moveDown();
        }
    
        // Moving selection up
        if (key.name == "k") {
            (useFileStore.getState() as any).moveUp();
        }

        if (key.name == "return") {
            // Open and load directory
            const dir = (useFileStore.getState() as any).directory ?? "";
            const sel = (useFileStore.getState() as any).getSelectedItem();
            const new_dir = (dir + "/" + sel.name).replaceAll("//", "/");
    
            // Open if directory
            if (fs.lstatSync(new_dir).isDirectory()) {
                (useFileStore.getState() as any).setDirectory(new_dir);
                (useFileStore.getState() as any).loadFiles();
                (useFileStore.getState() as any).resetSelectedItem();
            }
        }

        if (key.name == "backspace") {
            const dir = (useFileStore.getState() as any).directory;
            let par_dir = dir.split("/").slice(0, -1).join("/");
            if (par_dir.length == 0)
                par_dir = "/";
            (useFileStore.getState() as any).setDirectory(par_dir);
            (useFileStore.getState() as any).loadFiles();
            (useFileStore.getState() as any).resetSelectedItem();
        }

        if (key.name == "e") {
            const dir = (useFileStore.getState() as any).directory ?? "";
            const sel = (useFileStore.getState() as any).getSelectedItem();
            const new_dir = (dir + "/" + sel.name).replaceAll("//", "/");
    
            exec(`${settings.editor} ${new_dir}`);
        }
    }

    // Inputbar keybinds
    if (inputBar?.focused) {

    }
});

(useFileStore.getState() as any).setDirectory(process.cwd());
(useFileStore.getState() as any).loadFiles();