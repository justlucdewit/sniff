import { InputRenderableEvents } from "@opentui/core";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import settings from "../../config/settings";
import { popup, useFileStore, useInputStore, useSideMenuStore, useTabsStore } from "../../state/store";
import type { ClipboardEntry, KeyboardContext } from "./types";
import { getSelectionRange, getUniquePastePath, isShiftJ, isShiftK } from "./utils";

export const handleFileListKey = (ctx: KeyboardContext, clipboardEntries: ClipboardEntry[]) => {
    const { key, refs } = ctx;
    const { inputBar, fileListWasFocused } = refs;

    if (!fileListWasFocused) {
        return;
    }

    const shiftJ = isShiftJ(key as any);
    const shiftK = isShiftK(key as any);

    if (key.name == "j" && !shiftJ) {
        (useFileStore.getState() as any).moveDown();
    }

    if (key.name == "k" && !shiftK) {
        (useFileStore.getState() as any).moveUp();
    }

    if (shiftJ) {
        (useFileStore.getState() as any).extendSelectionDown();
    }

    if (shiftK) {
        (useFileStore.getState() as any).extendSelectionUp();
    }

    if (key.name == "x") {
        (useTabsStore.getState() as any).closeTab();
        (useTabsStore.getState() as any).loadTabData();
        (useFileStore.getState() as any).loadFiles();
    }

    if (key.name == "]") {
        (useTabsStore.getState() as any).saveTabData();
        (useTabsStore.getState() as any).nextTab();
        (useTabsStore.getState() as any).loadTabData();
        (useFileStore.getState() as any).loadFiles();
    }

    if (key.name == "[") {
        (useTabsStore.getState() as any).saveTabData();
        (useTabsStore.getState() as any).previousTab();
        (useTabsStore.getState() as any).loadTabData();
        (useFileStore.getState() as any).loadFiles();
    }

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
            refs.fileList.focus();
        });
    }

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
            refs.fileList.focus();
        });
    }

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
            refs.fileList.focus();
        });
    }

    if (key.name == "return") {
        const dir = (useFileStore.getState() as any).directory ?? "";
        const sel = (useFileStore.getState() as any).getSelectedItem();
        const newDir = (dir + "/" + sel.name).replaceAll("//", "/");

        if (fs.lstatSync(newDir).isDirectory()) {
            (useFileStore.getState() as any).setDirectory(newDir);
            (useFileStore.getState() as any).loadFiles();
            (useFileStore.getState() as any).resetSelectedItem();
        }
    }

    if (key.name == "backspace") {
        const dir = (useFileStore.getState() as any).directory;
        let parDir = dir.split("/").slice(0, -1).join("/");
        if (parDir.length == 0) {
            parDir = "/";
        }
        (useFileStore.getState() as any).setDirectory(parDir);
        (useFileStore.getState() as any).loadFiles();
        (useFileStore.getState() as any).resetSelectedItem();
    }

    if (key.name == "e") {
        const dir = (useFileStore.getState() as any).directory ?? "";
        const sel = (useFileStore.getState() as any).getSelectedItem();
        const newDir = (dir + "/" + sel.name).replaceAll("//", "/");

        exec(`${settings.editor} ${newDir}`);
    }

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
            refs.fileList.focus();
            const dir = (useFileStore.getState() as any).directory;
            fs.renameSync(`${dir}/${oldName.name}`, `${dir}/${newName}`);
            (useFileStore.getState() as any).loadFiles();
        });
    }

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
            refs.fileList.focus();
            const dir = (useFileStore.getState() as any).directory;
            fs.writeFileSync(`${dir}/${name}`, "");
            (useFileStore.getState() as any).loadFiles();
        });
    }

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

    if (key.name == "c") {
        const fileStore = useFileStore.getState() as any;
        const dir = fileStore.directory ?? "";
        const { files, start, end } = getSelectionRange(fileStore);
        const selected = files.slice(start, end + 1).filter((item: any) => !!item?.name);

        if (selected.length === 0) {
            popup("Nothing selected to copy");
            return;
        }

        clipboardEntries.splice(0, clipboardEntries.length, ...selected.map((item: any) => ({
            sourcePath: path.join(dir, item.name),
            name: item.name
        })));
        popup(`Copied ${clipboardEntries.length} item(s)`);
    }

    if (key.name == "v") {
        if (clipboardEntries.length === 0) {
            popup("Clipboard is empty");
            return;
        }

        const fileStore = useFileStore.getState() as any;
        const targetDir = fileStore.directory ?? "";
        let pastedCount = 0;
        let failedCount = 0;

        for (const entry of clipboardEntries) {
            try {
                const destinationPath = getUniquePastePath(targetDir, entry.name);
                const sourceStats = fs.lstatSync(entry.sourcePath);

                if (sourceStats.isDirectory()) {
                    fs.cpSync(entry.sourcePath, destinationPath, { recursive: true });
                } else {
                    fs.copyFileSync(entry.sourcePath, destinationPath);
                }

                pastedCount += 1;
            }
            catch {
                failedCount += 1;
            }
        }

        fileStore.loadFiles();
        if (pastedCount > 0 && failedCount > 0) {
            popup(`Pasted ${pastedCount} item(s), ${failedCount} failed`);
        } else if (pastedCount > 0) {
            popup(`Pasted ${pastedCount} item(s)`);
        } else {
            popup("Paste failed");
        }
    }
};
