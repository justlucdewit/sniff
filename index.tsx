import { createCliRenderer, InputRenderable, type KeyEvent } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { useFileStore, useInputStore } from "./src/store"
import { exec } from 'child_process'
import { App } from './src/App'
import settings from './src/settings'
import { InputRenderableEvents } from "@opentui/core"
import fs from "fs"

const renderer = await createCliRenderer();
createRoot(renderer).render(<App />)

const keyHandler = renderer.keyInput;

keyHandler.on("keypress", (key: KeyEvent) => {
    const inputBar = renderer.root.findDescendantById("inputbar");
    const fileList = renderer.root.findDescendantById("files");

    if (key.name == "tab") {
        // if (fileList?.focused)
        //     inputBar?.focus();
        // else if (inputBar?.focused)
        //     fileList?.focus();
    }

    // File list keybinds
    if (fileList?.focused) {
        // Quit app
        if (key.name == "q") {
            renderer.destroy()
        }

        // Moving selection down
        if (key.name == "j") {
            (useFileStore.getState() as any).moveDown();
        }
    
        // Moving selection up
        if (key.name == "k") {
            (useFileStore.getState() as any).moveUp();
        }

        // Enter a directory
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

        // Go up a directory
        if (key.name == "backspace") {
            const dir = (useFileStore.getState() as any).directory;
            let par_dir = dir.split("/").slice(0, -1).join("/");
            if (par_dir.length == 0)
                par_dir = "/";
            (useFileStore.getState() as any).setDirectory(par_dir);
            (useFileStore.getState() as any).loadFiles();
            (useFileStore.getState() as any).resetSelectedItem();
        }

        // Open in editor
        if (key.name == "e") {
            const dir = (useFileStore.getState() as any).directory ?? "";
            const sel = (useFileStore.getState() as any).getSelectedItem();
            const new_dir = (dir + "/" + sel.name).replaceAll("//", "/");
    
            exec(`${settings.editor} ${new_dir}`);
        }

        // Rename file
        if (key.name == "r" && inputBar) {
            (useInputStore.getState() as any).setVisible(true);
            const oldName = (useFileStore.getState() as any).getSelectedItem();
            (useInputStore.getState() as any).setValue(oldName.name);
            inputBar.focus();
            inputBar.once(InputRenderableEvents.ENTER, (newName: string) => {
                (useInputStore.getState() as any).setVisible(false);
                fileList.focus();
                const dir = (useFileStore.getState() as any).directory;
                fs.renameSync(`${dir}/${oldName.name}`, `${dir}/${newName}`);
                (useFileStore.getState() as any).loadFiles();
            });
        }

        // New file
        if (key.name == "n" && inputBar) {
            (useInputStore.getState() as any).setVisible(true);
            (useInputStore.getState() as any).setValue("");
            inputBar.focus();
            inputBar.once(InputRenderableEvents.ENTER, (name: string) => {
                (useInputStore.getState() as any).setVisible(false);
                fileList.focus();
                const dir = (useFileStore.getState() as any).directory;
                fs.writeFileSync(`${dir}/${name}`, '');
                (useFileStore.getState() as any).loadFiles();
            });
        }

        // Delete file
        if (key.name == "delete" || key.name == "d") {
            const target = (useFileStore.getState() as any).getSelectedItem();
            fs.rmSync(target.name);
            (useFileStore.getState() as any).loadFiles();
        }
    }
});

(useFileStore.getState() as any).setDirectory(process.cwd());
(useFileStore.getState() as any).loadFiles();