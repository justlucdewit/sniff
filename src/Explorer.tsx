import { Tabs } from "./Tabs"
import { Files } from "./Files"
import { Inputbar } from "./Inputbar";

export function Explorer() {
    return (
        <box flexDirection="column" height="100%" width="100%">
            <Tabs />
            <Files />
            <Inputbar />
        </box>
    );
}