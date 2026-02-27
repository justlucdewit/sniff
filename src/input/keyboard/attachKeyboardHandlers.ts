import type { CliRenderer, KeyEvent } from "@opentui/core";
import { handleFileListKey } from "./fileListKeyHandler";
import { handleGlobalKey } from "./globalKeyHandler";
import { handleMenuKey } from "./menuKeyHandler";
import type { ClipboardEntry, KeyboardRefs } from "./types";

export const attachKeyboardHandlers = (renderer: CliRenderer) => {
    const clipboardEntries: ClipboardEntry[] = [];

    const keyHandler = renderer.keyInput;

    keyHandler.on("keypress", (key: KeyEvent) => {
        const inputBar = renderer.root.findDescendantById("inputbar");
        const fileList = renderer.root.findDescendantById("files");
        const menu = renderer.root.findDescendantById("menu");

        const refs: KeyboardRefs = {
            inputBar,
            fileList,
            menu,
            fileListWasFocused: !!fileList?.focused,
            menuWasFocused: !!menu?.focused,
        };

        const ctx = { key, refs };

        handleGlobalKey(renderer, ctx);
        handleMenuKey(ctx);
        handleFileListKey(ctx, clipboardEntries);
    });
};
