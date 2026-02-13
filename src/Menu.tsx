import settings from "./settings"
import { useSideMenuStore } from "./store"

export function Menu() {
    const favDirs = useSideMenuStore((state: any) => state.favoriteDirectories);
    const cursorIndex = useSideMenuStore((state: any) => state.cursorIndex);

    return (
        <scrollbox focused={false} id="menu" focusedBorderColor={settings.border.color.focus} width="20%" minWidth={20} height="100%" borderStyle="rounded" borderColor={settings.border.color.dimmed} overflow="hidden">
            <text>
                &nbsp;Favorites
            </text>

            {favDirs.map((dir: any, index: number) =>
                <box width="100%" height={1}>
                    <text fg={index == cursorIndex ? settings.text.color.bright : settings.text.color.dimmed}>
                        &nbsp;{index == cursorIndex ? ">" : "-"}&nbsp;{dir.name}
                    </text>
                </box>)
            }
        </scrollbox>
    );
}
