import type { KeyEvent } from "@opentui/core";

export type ClipboardEntry = {
    sourcePath: string;
    name: string;
};

export type KeyboardRefs = {
    inputBar: any;
    fileList: any;
    menu: any;
    fileListWasFocused: boolean;
    menuWasFocused: boolean;
};

export type KeyboardContext = {
    key: KeyEvent;
    refs: KeyboardRefs;
};
