import fs from 'fs'
import settings from "./settings"
import { useFileStore } from "./store"
import { useEffect, useRef } from "react"

export function Files() {
    const scrollRef = useRef<any>(null);
    const cursorIndex = useFileStore((state: any) => state.cursorIndex);
    const setIndex = useFileStore((state: any) => state.setIndex);
    const directory = useFileStore((state: any) => state.directory);
    const files = useFileStore((state: any) => state.files) as Array<{ name: string, indx: number, type: "dir" | "file" | "unknown" }>;

    const type2iconMap = {
        "dir": "📂",
        "file": "📄",
        "unknown": "?"
    }

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo(cursorIndex); 
        }
    }, [cursorIndex]);

    return (
        <scrollbox focused={true} ref={scrollRef} title={directory} id='files' scrollY borderColor={settings.border.color.dimmed} focusedBorderColor={settings.border.color.focus} borderStyle="rounded" flexDirection="row" height="100%" width="100%" paddingRight={0}>
            {files.map((file, idx) => (
                <text fg={file.indx == cursorIndex ? settings.border.color.bright : settings.border.color.dimmed}>
                    {type2iconMap[file.type]} {file.name}
                </text>
            ))}
        </scrollbox>
    );
}