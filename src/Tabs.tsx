import settings from "./settings"
import { useTabsStore } from "./store";

export function Tabs() {
    const tabs = useTabsStore((state: any) => state.tabs);
    const currentTabIndex = useTabsStore((state: any) => state.currentTabIndex);
    return (
        <box width="100%" height={3} flexDirection="row">
            { tabs.map((t: string, index: number) => <box borderStyle="rounded" borderColor={index == currentTabIndex ? settings.border.color.bright : settings.border.color.dimmed} width={9} height={3}>
                <text fg={settings.text.color.bright}>
                    &nbsp;{t}&nbsp;
                </text>
            </box>) }

            <box borderStyle="rounded" borderColor={settings.border.color.dimmed} width={5} height={3}>
                <text fg={settings.text.color.dimmed}>
                    &nbsp;+&nbsp;
                </text>
            </box>
        </box>
    );
}