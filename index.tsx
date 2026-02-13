import { createCliRenderer, InputRenderable, type KeyEvent } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { useFileStore, useInputStore, useSideMenuStore, useTabsStore } from "./src/store"
import { exec } from 'child_process'
import { App } from './src/App'
import settings from './src/settings'
import { InputRenderableEvents } from "@opentui/core"
import fs from "fs"

const renderer = await createCliRenderer();
createRoot(renderer).render(<App />);

(useSideMenuStore.getState() as any).loadFavoriteDirectories();
useSideMenuStore.subscribe((state: any, prevState: any) => {
    if (state.favoriteDirectories !== prevState.favoriteDirectories) {
        (useSideMenuStore.getState() as any).saveFavoriteDirectories();
    }
});

const keyHandler = renderer.keyInput;

keyHandler.on("keypress", (key: KeyEvent) => {
    const inputBar = renderer.root.findDescendantById("inputbar");
    const fileList = renderer.root.findDescendantById("files");
    const menu = renderer.root.findDescendantById("menu");

    // Escape from input bar
    if (inputBar && fileList && inputBar.focused && key.name == "escape") {
        (useInputStore.getState() as any).setVisible(false);
        fileList.focus();
    }

    // Switching to different panels
    if (key.name == "tab" && menu && inputBar && fileList && !inputBar.focused) {
        if (menu.focused) {
            fileList.focus();
        }

        else if (fileList.focused) {
            menu.focus();
        }
    }

    // Keybinds in both menu and filelist
    if (fileList?.focused || menu?.focused) {
        // Quit app
        if (key.name == "q") {
            renderer.destroy()
        }
    }

    // Filelist keybinds
    if (fileList?.focused) {

        // Moving selection down
        if (key.name == "j") {
            (useFileStore.getState() as any).moveDown();
        }
    
        // Moving selection up
        if (key.name == "k") {
            (useFileStore.getState() as any).moveUp();
        }

        // Close current tab
        if (key.name == "x") {
            (useTabsStore.getState() as any).closeTab();
            (useTabsStore.getState() as any).loadTabData();
            (useFileStore.getState() as any).loadFiles();
        }

        // Next tab
        if (key.name == "]") {
            (useTabsStore.getState() as any).saveTabData();
            (useTabsStore.getState() as any).nextTab();
            (useTabsStore.getState() as any).loadTabData();
            (useFileStore.getState() as any).loadFiles();
        }

        // Previous tab
        if (key.name == "[") {
            (useTabsStore.getState() as any).saveTabData();
            (useTabsStore.getState() as any).previousTab();
            (useTabsStore.getState() as any).loadTabData();
            (useFileStore.getState() as any).loadFiles();
        }

        // Previous tab
        if (key.name == "t" && inputBar) {
            key.preventDefault();
            key.stopPropagation();
            (useInputStore.getState() as any).setVisible(true);
            (useInputStore.getState() as any).setValue("");
            inputBar.focus();
            inputBar.once(InputRenderableEvents.ENTER, (name: string) => {
                (useInputStore.getState() as any).setVisible(false);
                (useTabsStore.getState() as any).createNewTab(name);
                fileList.focus();
            });
        }

        // Add current directory to favorites
        if (key.name == "f" && inputBar) {
            key.preventDefault();
            key.stopPropagation();
            const cwd = (useFileStore.getState() as any).directory ?? process.cwd();
            const defaultName = cwd == "/" ? "root" : cwd.split("/").filter(Boolean).pop();

            (useInputStore.getState() as any).setVisible(true);
            (useInputStore.getState() as any).setValue(defaultName ?? "");
            inputBar.focus();
            inputBar.once(InputRenderableEvents.ENTER, (name: string) => {
                const favoriteName = name.trim();
                (useInputStore.getState() as any).setVisible(false);
                (useSideMenuStore.getState() as any).addFavoriteDirectory(
                    favoriteName.length > 0 ? favoriteName : (defaultName ?? cwd),
                    cwd
                );
                fileList.focus();
            });
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
            key.preventDefault();
            key.stopPropagation();
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
            key.preventDefault();
            key.stopPropagation();
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
            const dir = (useFileStore.getState() as any).directory;
            fs.rmSync(`${dir}/${target.name}`);
            (useFileStore.getState() as any).loadFiles();
        }
    }
});

(useFileStore.getState() as any).setDirectory(process.cwd());
(useFileStore.getState() as any).loadFiles();
