import fs from 'fs'
import settings from "./settings"
import { useFileStore } from "./store"
import { useEffect, useRef } from "react"
import os from "os"

export function Files() {
    const scrollRef = useRef<any>(null);
    const cursorIndex = useFileStore((state: any) => state.cursorIndex);
    const multiSelectOffsetIndex = useFileStore((state: any) => state.multiSelectOffsetIndex);
    const setIndex = useFileStore((state: any) => state.setIndex);
    const directory = useFileStore((state: any) => state.directory);
    const files = useFileStore((state: any) => state.files) as Array<{ name: string, indx: number, type: "dir" | "file" | "unknown" }>;

    // Transform directory path
    const homedir = os.homedir();
    const transformDirectoryPath = (path: string) => {
        if (path.startsWith(homedir)) {
            return path.replace(homedir, "[home]");
        }
        return path;
    };

    const type2iconMap = {
        "dir": "📂",
        "file": "📄",
        "unknown": "?"
    }

    useEffect(() => {
        const selectedEdgeIndex = Math.max(
            0,
            Math.min(files.length - 1, cursorIndex + multiSelectOffsetIndex)
        );

        if (scrollRef.current) {
            scrollRef.current.scrollTo(selectedEdgeIndex);
        }
    }, [cursorIndex, multiSelectOffsetIndex, files.length]);

    const rangeStart = Math.min(cursorIndex, cursorIndex + multiSelectOffsetIndex);
    const rangeEnd = Math.max(cursorIndex, cursorIndex + multiSelectOffsetIndex);

    return (
        <scrollbox focused={true} ref={scrollRef} title={transformDirectoryPath(directory)} id='files' scrollY borderColor={settings.border.color.dimmed} focusedBorderColor={settings.border.color.focus} borderStyle="rounded" flexDirection="row" height="100%" width="100%" paddingRight={0}>
            {files.map((file, idx) => (
                <text fg={file.indx >= rangeStart && file.indx <= rangeEnd ? settings.border.color.bright : settings.border.color.dimmed}>
                    {type2iconMap[file.type]} {file.name}
                </text>
            ))}
        </scrollbox>
    );
}
