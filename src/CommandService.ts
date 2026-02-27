import type { CliRenderer } from "@opentui/core";
import path from "path";
import sharp from "sharp";
import { popup, useFileStore } from "./store";

const parseCommand = (input: string) => {
    const trimmed = input.trim();
    const [command = "", ...args] = trimmed.split(/\s+/);

    return {
        command,
        args,
    };
};

const handleConvertCommand = async (args: string[]) => {
    const requestedFormat = (args[0] ?? "").toLowerCase().replace(/^\./, "");
    const formatAliases: Record<string, "webp" | "png" | "jpeg"> = {
        webp: "webp",
        png: "png",
        jpg: "jpeg",
        jpeg: "jpeg",
    };
    const targetFormat = formatAliases[requestedFormat];
    const outputExtension = targetFormat === "jpeg" ? "jpg" : targetFormat;

    if (requestedFormat.length === 0) {
        popup("Usage: .convert <format>");
        return;
    }

    if (!targetFormat) {
        popup(`Unsupported format: ${requestedFormat}`);
        return;
    }

    const fileStore = useFileStore.getState() as any;
    const directory = fileStore.directory ?? process.cwd();
    const files = fileStore.files ?? [];
    const cursorIndex = fileStore.cursorIndex ?? 0;
    const offset = fileStore.multiSelectOffsetIndex ?? 0;
    const rangeStart = Math.max(0, Math.min(cursorIndex, cursorIndex + offset));
    const rangeEnd = Math.min(files.length - 1, Math.max(cursorIndex, cursorIndex + offset));
    const selectedItems = files.slice(rangeStart, rangeEnd + 1);

    if (selectedItems.length === 0) {
        popup("No file selected");
        return;
    }

    try {
        let convertedCount = 0;
        let skippedCount = 0;

        for (const item of selectedItems) {
            if (!item?.name || item.type !== "file") {
                skippedCount += 1;
                continue;
            }

            const inputPath = path.join(directory, item.name);
            const baseName = item.name.replace(/\.[^/.]+$/, "");
            let outputPath = path.join(directory, `${baseName}.${outputExtension}`);

            if (outputPath === inputPath) {
                outputPath = path.join(directory, `${baseName}.converted.${outputExtension}`);
            }

            await sharp(inputPath).toFormat(targetFormat).toFile(outputPath);
            convertedCount += 1;
        }

        fileStore.loadFiles();

        if (convertedCount === 0) {
            popup("No files converted");
            return;
        }

        if (skippedCount > 0) {
            popup(`Converted ${convertedCount} file(s), skipped ${skippedCount}`);
            return;
        }

        popup(`Converted ${convertedCount} file(s)`);
    }
    catch (error: any) {
        const errorMessage = error?.message ?? "Unknown conversion error";
        popup(`Convert failed: ${errorMessage}`);
    }
};

export const processCommand = async (input: string, renderer: CliRenderer) => {
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

    if (command === ".convert") {
        await handleConvertCommand(args);
        return;
    }

    popup(`Unknown command: ${command}`);
};
