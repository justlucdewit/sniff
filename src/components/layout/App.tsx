import { Menu } from "../panels/Menu"
import { Explorer } from "./Explorer"
import { Popup } from "../feedback/Popup"

export function App() {
    return (
        <box flexDirection="row" height="100%">
            <Menu />
            <Explorer />
            <Popup />
        </box>
    )
}
