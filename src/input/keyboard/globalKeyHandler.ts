import { InputRenderableEvents, type CliRenderer } from "@opentui/core";
import { processCommand } from "../../services/CommandService";
import { useInputStore } from "../../state/store";
import type { KeyboardContext } from "./types";

export const handleGlobalKey = (renderer: CliRenderer, ctx: KeyboardContext) => {
    const { key, refs } = ctx;
    const { inputBar, fileList, menu, fileListWasFocused, menuWasFocused } = refs;

    if (inputBar && fileList && inputBar.focused && key.name == "escape") {
        (useInputStore.getState() as any).setVisible(false);
        (useInputStore.getState() as any).setMode("none");
        fileList.focus();
    }

    if (key.name == "tab" && menu && inputBar && fileList && !inputBar.focused) {
        if (menu.focused) {
            fileList.focus();
        } else if (fileList.focused) {
            menu.focus();
        }
    }

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

        if (key.name == "q") {
            renderer.destroy();
        }
    }
};
