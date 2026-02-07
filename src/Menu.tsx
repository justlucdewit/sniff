import settings from "./settings"
import { useSideMenuStore } from "./store"

export function Menu() {
    const favDirs = useSideMenuStore((state: any) => state.favoriteDirectories);

    return (
        <box width="20%" minWidth={20} height="100%" borderStyle="rounded" borderColor={settings.border.color.dimmed} overflow="hidden">
            <text>
                &nbsp;Favorites
            </text>

            {favDirs.map((dir: any, index: number) => <box width="100%" height={1}>
                <text>&nbsp;-&nbsp;{dir.name}</text>
            </box>)}
        </box>
    );
}