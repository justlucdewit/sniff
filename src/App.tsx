import { Menu } from "./Menu"
import { Explorer } from "./Explorer"

export function App() {
    return (
        <box flexDirection="row" height="100%">
            <Menu />
            <Explorer />
        </box>
    )
}