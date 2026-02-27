import settings from "../../config/settings"
import { useFileStore } from "../../state/store"
import { useEffect, useRef } from "react"
import os from "os"

export function Files() {
    const scrollRef = useRef<any>(null);
    const cursorIndex = useFileStore((state: any) => state.cursorIndex);
    const multiSelectOffsetIndex = useFileStore((state: any) => state.multiSelectOffsetIndex);
    const setIndex = useFileStore((state: any) => state.setIndex);
    const directory = useFileStore((state: any) => state.directory);
    const files = useFileStore((state: any) => state.files) as Array<{ name: string, indx: number, type: "dir" | "file" | "unknown", size: number }>;

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

    const formatSize = (bytes: number, type: "dir" | "file" | "unknown") => {
        if (type === "dir") {
            return "-";
        }

        if (!Number.isFinite(bytes) || bytes < 0) {
            return "0b";
        }

        if (bytes < 1024) {
            return `${bytes}b`;
        }

        const units = ["Kb", "Mb", "Gb"];
        let value = bytes / 1024;
        let unitIndex = 0;

        while (value >= 1024 && unitIndex < units.length - 1) {
            value /= 1024;
            unitIndex++;
        }

        const rounded = value >= 10 ? value.toFixed(0) : value.toFixed(1);
        return `${rounded.replace(/\.0$/, "")}${units[unitIndex]}`;
    };

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
            {files.map((file) => {
                const isSelected = file.indx >= rangeStart && file.indx <= rangeEnd;
                const rowColor = isSelected ? settings.border.color.bright : settings.border.color.dimmed;

                return (
                <box key={file.name} width="100%" height={1} flexDirection="row" justifyContent="space-between">
                    <text fg={rowColor}>
                        {type2iconMap[file.type]} {file.name}
                    </text>
                    <text fg={rowColor}>
                        {formatSize(file.size, file.type)}
                    </text>
                </box>
                );
            })}
        </scrollbox>
    );
}
