import { Menu } from "./Menu"
import { Explorer } from "./Explorer"
import { Popup } from "./Popup"

export function App() {
    return (
        <box flexDirection="row" height="100%">
            <Menu />
            <Explorer />
            <Popup />
        </box>
    )
}
