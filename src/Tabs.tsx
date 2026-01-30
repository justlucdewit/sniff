import settings from "./settings"

export function Tabs() {
    return (
        <box width="100%" height={3} flexDirection="row">
            
            
            {/* Render the tabs */}
            <box borderStyle="rounded" borderColor={settings.border.color.bright} width={9} height={3}>
                <text fg={settings.text.color.bright}>
                    &nbsp;tab_1&nbsp;
                </text>
            </box>

            <box borderStyle="rounded" borderColor={settings.border.color.dimmed} width={5} height={3}>
                <text fg={settings.text.color.dimmed}>
                    &nbsp;+&nbsp;
                </text>
            </box>
        </box>
    );
}