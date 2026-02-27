import { InputRenderableEvents } from "@opentui/core";
import { useFileStore, useInputStore, useSideMenuStore } from "../../state/store";
import { isShiftJ, isShiftK } from "./utils";
import type { KeyboardContext } from "./types";

export const handleMenuKey = (ctx: KeyboardContext) => {
    const { key, refs } = ctx;
    const { inputBar, fileList, menu, menuWasFocused } = refs;

    if (!menuWasFocused) {
        return;
    }

    const shiftJ = isShiftJ(key as any);
    const shiftK = isShiftK(key as any);

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
};
