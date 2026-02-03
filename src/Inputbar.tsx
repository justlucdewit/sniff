import settings from "./settings"

export function Inputbar() {
    return (
        <box visible={false} borderColor={settings.border.color.focus} borderStyle="rounded" height={3}>
            <input id="inputbar" placeholder="This is a test...">

            </input>
        </box>
    );
}