import settings from "./settings"
import { useInputStore } from "./store";

export function Inputbar() {
    const visible = useInputStore((state: any) => state.visible);
    const value = useInputStore((state: any) => state.value);

    return (
        <box visible={visible} borderColor={settings.border.color.focus} borderStyle="rounded" height={3}>
            <input id="inputbar" value={value}>

            </input>
        </box>
    );
}