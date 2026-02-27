import { Tabs } from "../panels/Tabs"
import { Files } from "../panels/Files"
import { Inputbar } from "../panels/Inputbar";

export function Explorer() {
    return (
        <box flexDirection="column" height="100%" width="100%">
            <Tabs />
            <Files />
            <Inputbar />
        </box>
    );
}
