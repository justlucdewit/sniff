import type { CliRenderer } from "@opentui/core";
import { popup } from "./store";

const parseCommand = (input: string) => {
    const trimmed = input.trim();
    const [command = "", ...args] = trimmed.split(/\s+/);

    return {
        command,
        args,
    };
};

export const processCommand = (input: string, renderer: CliRenderer) => {
    const { command, args } = parseCommand(input);

    if (command.length === 0) {
        return;
    }

    if (!command.startsWith(".")) {
        popup(`Unknown command: ${command}`);
        return;
    }

    if (command === ".exit") {
        renderer.destroy();
        return;
    }

    if (command === ".prompt") {
        const message = args.join(" ").trim();
        popup(message.length > 0 ? message : "prompt");
        return;
    }

    popup(`Unknown command: ${command}`);
};
