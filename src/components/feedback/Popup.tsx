import settings from "../../config/settings";
import { usePopupStore } from "../../state/store";

export function Popup() {
    const activePopup = usePopupStore((state: any) => state.activePopup) as null | { id: number, message: string };

    if (!activePopup) {
        return null;
    }

    return (
        <box
            position="absolute"
            bottom={1}
            right={2}
            zIndex={999}
            borderStyle="rounded"
            borderColor={settings.border.color.focus}
            paddingLeft={1}
            paddingRight={1}
        >
            <text fg={settings.text.color.bright}>
                {activePopup.message}
            </text>
        </box>
    );
}
