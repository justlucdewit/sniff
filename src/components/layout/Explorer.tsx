import { Tabs } from "../panels/Tabs"
import { Files } from "../panels/Files"
import { Inputbar } from "../panels/Inputbar";
import { Preview } from "../panels/Preview";

export function Explorer() {
    return (
        <box flexDirection="column" height="100%" width="100%">
            <Tabs />
            <box flexDirection="row" height="100%" width="100%">
                <box flexGrow={1} height="100%">
                    <Files />
                </box>
                <box width="30%" maxWidth={80} height="100%">
                    <Preview />
                </box>
            </box>
            <Inputbar />
        </box>
    );
}
