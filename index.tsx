import { createCliRenderer, InputRenderable, type KeyEvent } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { popup, useFileStore, useInputStore, useSideMenuStore, useTabsStore } from "./src/store"
import { exec } from 'child_process'
import { App } from './src/App'
import settings from './src/settings'
import { InputRenderableEvents } from "@opentui/core"
import fs from "fs"
import { processCommand } from "./src/CommandService"

declare global {
    var popup: (message: string) => void;
}

globalThis.popup = (message: string) => {
    popup(message, 10000);
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

const keyHandler = renderer.keyInput;

keyHandler.on("keypress", (key: KeyEvent) => {
    const inputBar = renderer.root.findDescendantById("inputbar");
    const fileList = renderer.root.findDescendantById("files");
    const menu = renderer.root.findDescendantById("menu");
    const fileListWasFocused = !!fileList?.focused;
    const menuWasFocused = !!menu?.focused;

    // Escape from input bar
    if (inputBar && fileList && inputBar.focused && key.name == "escape") {
        (useInputStore.getState() as any).setVisible(false);
        (useInputStore.getState() as any).setMode("none");
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
    if (fileListWasFocused || menuWasFocused) {
        if ((key.name == "." || key.name == "period") && inputBar) {
            key.preventDefault();
            key.stopPropagation();
            const returnTarget = menuWasFocused ? menu : fileList;
            (useInputStore.getState() as any).setVisible(true);
            (useInputStore.getState() as any).setMode("command");
            (useInputStore.getState() as any).setValue(".");
            inputBar.focus();
            inputBar.once(InputRenderableEvents.ENTER, (commandInput: string) => {
                (useInputStore.getState() as any).setVisible(false);
                (useInputStore.getState() as any).setMode("none");
                void processCommand(commandInput, renderer);
                returnTarget?.focus();
            });
        }

        // Quit app
        if (key.name == "q") {
            renderer.destroy()
        }
    }

    // Side menu keybinds
    if (menuWasFocused) {
        const shiftJ = key.name == "J" || (key.name == "j" && !!(key as any).shift);
        const shiftK = key.name == "K" || (key.name == "k" && !!(key as any).shift);

        if (key.name == "j" && !shiftJ) {
            (useSideMenuStore.getState() as any).moveDown();
        }

        if (key.name == "k" && !shiftK) {
            (useSideMenuStore.getState() as any).moveUp();
        }

        if (shiftJ) {
            key.preventDefault();
            key.stopPropagation();
            (useSideMenuStore.getState() as any).moveFavoriteDirectoryDown();
        }

        if (shiftK) {
            key.preventDefault();
            key.stopPropagation();
            (useSideMenuStore.getState() as any).moveFavoriteDirectoryUp();
        }

        if (key.name == "delete") {
            key.preventDefault();
            key.stopPropagation();
            const sideMenuStore = useSideMenuStore.getState() as any;
            sideMenuStore.removeFavoriteDirectory(sideMenuStore.cursorIndex);
        }

        if (key.name == "f" && inputBar) {
            key.preventDefault();
            key.stopPropagation();
            const sideMenuStore = useSideMenuStore.getState() as any;
            const selectedFavorite = sideMenuStore.favoriteDirectories[sideMenuStore.cursorIndex];

            if (!selectedFavorite?.dir) {
                return;
            }

            (useInputStore.getState() as any).setVisible(true);
            (useInputStore.getState() as any).setMode("prompt");
            (useInputStore.getState() as any).setValue(selectedFavorite.name ?? "");
            inputBar.focus();
            inputBar.once(InputRenderableEvents.ENTER, (name: string) => {
                const favoriteName = name.trim();
                (useInputStore.getState() as any).setVisible(false);
                (useInputStore.getState() as any).setMode("none");
                (useSideMenuStore.getState() as any).addFavoriteDirectory(
                    favoriteName.length > 0 ? favoriteName : selectedFavorite.name,
                    selectedFavorite.dir
                );
                menu.focus();
            });
        }

        if (key.name == "return" && fileList) {
            key.preventDefault();
            key.stopPropagation();
            const sideMenuStore = useSideMenuStore.getState() as any;
            const selectedFavorite = sideMenuStore.favoriteDirectories[sideMenuStore.cursorIndex];

            if (selectedFavorite?.dir) {
                (useFileStore.getState() as any).setDirectory(selectedFavorite.dir);
                (useFileStore.getState() as any).loadFiles();
                (useFileStore.getState() as any).resetSelectedItem();
                fileList.focus();
            }
        }
    }

    // Filelist keybinds
    if (fileListWasFocused) {
        const shiftJ = key.name == "J" || (key.name == "j" && !!(key as any).shift);
        const shiftK = key.name == "K" || (key.name == "k" && !!(key as any).shift);

        // Moving selection down
        if (key.name == "j" && !shiftJ) {
            (useFileStore.getState() as any).moveDown();
        }
    
        // Moving selection up
        if (key.name == "k" && !shiftK) {
            (useFileStore.getState() as any).moveUp();
        }

        // Extend multiselection down
        if (shiftJ) {
            (useFileStore.getState() as any).extendSelectionDown();
        }

        // Extend multiselection up
        if (shiftK) {
            (useFileStore.getState() as any).extendSelectionUp();
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
            (useInputStore.getState() as any).setMode("prompt");
            (useInputStore.getState() as any).setValue("");
            inputBar.focus();
            inputBar.once(InputRenderableEvents.ENTER, (name: string) => {
                (useInputStore.getState() as any).setVisible(false);
                (useInputStore.getState() as any).setMode("none");
                (useTabsStore.getState() as any).createNewTab(name);
                fileList.focus();
            });
        }

        // Search files/folders in current directory
        if (key.name == "/" && inputBar) {
            key.preventDefault();
            key.stopPropagation();
            const fileStore = useFileStore.getState() as any;
            (useInputStore.getState() as any).setVisible(true);
            (useInputStore.getState() as any).setMode("search");
            (useInputStore.getState() as any).setValue(fileStore.searchQuery ?? "");
            inputBar.focus();
            inputBar.once(InputRenderableEvents.ENTER, () => {
                (useInputStore.getState() as any).setVisible(false);
                (useInputStore.getState() as any).setMode("none");
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
            (useInputStore.getState() as any).setMode("prompt");
            (useInputStore.getState() as any).setValue(defaultName ?? "");
            inputBar.focus();
            inputBar.once(InputRenderableEvents.ENTER, (name: string) => {
                const favoriteName = name.trim();
                (useInputStore.getState() as any).setVisible(false);
                (useInputStore.getState() as any).setMode("none");
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
            (useInputStore.getState() as any).setMode("prompt");
            const oldName = (useFileStore.getState() as any).getSelectedItem();
            (useInputStore.getState() as any).setValue(oldName.name);
            inputBar.focus();
            inputBar.once(InputRenderableEvents.ENTER, (newName: string) => {
                (useInputStore.getState() as any).setVisible(false);
                (useInputStore.getState() as any).setMode("none");
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
            (useInputStore.getState() as any).setMode("prompt");
            (useInputStore.getState() as any).setValue("");
            inputBar.focus();
            inputBar.once(InputRenderableEvents.ENTER, (name: string) => {
                (useInputStore.getState() as any).setVisible(false);
                (useInputStore.getState() as any).setMode("none");
                fileList.focus();
                const dir = (useFileStore.getState() as any).directory;
                fs.writeFileSync(`${dir}/${name}`, '');
                (useFileStore.getState() as any).loadFiles();
            });
        }

        // Delete file
        if (key.name == "delete" || key.name == "d") {
            const fileStore = useFileStore.getState() as any;
            const dir = fileStore.directory ?? "";
            const files = fileStore.files ?? [];
            const cursorIndex = fileStore.cursorIndex ?? 0;
            const offset = fileStore.multiSelectOffsetIndex ?? 0;
            const start = Math.max(0, Math.min(cursorIndex, cursorIndex + offset));
            const end = Math.min(files.length - 1, Math.max(cursorIndex, cursorIndex + offset));
            const deletedCount = Math.max(0, end - start + 1);
            const remainingCount = Math.max(0, files.length - deletedCount);

            for (let i = start; i <= end; i += 1) {
                const target = files[i];
                if (!target?.name) {
                    continue;
                }
                fs.rmSync(`${dir}/${target.name}`);
            }

            (useFileStore.getState() as any).loadFiles();
            const previousSurvivingIndex = Math.max(0, start - 1);
            const nextIndex = remainingCount > 0
                ? Math.min(previousSurvivingIndex, remainingCount - 1)
                : 0;
            (useFileStore.getState() as any).setIndex(nextIndex);
        }
    }
});

(useFileStore.getState() as any).setDirectory(process.cwd());
(useFileStore.getState() as any).loadFiles();
