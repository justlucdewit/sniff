import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { useEffect, useState } from "react";
import sharp from "sharp";
import ffprobeStatic from "ffprobe-static";
import settings from "../../config/settings";
import { useFileStore } from "../../state/store";

type FileListEntry = {
    name: string;
    indx: number;
    type: "dir" | "file" | "unknown";
    size: number;
};

const MAX_PREVIEW_CHARS = 20_000;
const BINARY_SAMPLE_SIZE = 1_024;
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".tiff", ".tif", ".avif", ".heic", ".heif"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".mkv", ".webm", ".avi", ".m4v", ".wmv", ".flv", ".mpg", ".mpeg"]);

type MediaInfo = {
    kind: "image" | "video";
    format: string | null;
    dimensions: string | null;
    aspectRatio: string | null;
    bitrate: string | null;
    metadataJson: string | null;
};

const isLikelyBinary = (buffer: Buffer) => {
    const sample = buffer.subarray(0, Math.min(BINARY_SAMPLE_SIZE, buffer.length));
    let suspicious = 0;

    for (const byte of sample) {
        if (byte === 0) {
            return true;
        }

        const isControl = byte < 32 && byte !== 9 && byte !== 10 && byte !== 13;
        if (isControl) {
            suspicious += 1;
        }
    }

    if (sample.length === 0) {
        return false;
    }

    return suspicious / sample.length > 0.1;
};

const formatDimensions = (width?: number, height?: number) => {
    if (!width || !height) {
        return null;
    }
    return `${width} x ${height}`;
};

const greatestCommonDivisor = (a: number, b: number): number => {
    let x = Math.abs(a);
    let y = Math.abs(b);

    while (y !== 0) {
        const temp = y;
        y = x % y;
        x = temp;
    }

    return x === 0 ? 1 : x;
};

const formatAspectRatio = (width?: number, height?: number) => {
    if (!width || !height) {
        return null;
    }

    const gcd = greatestCommonDivisor(width, height);
    return `${Math.round(width / gcd)}:${Math.round(height / gcd)}`;
};

const formatDate = (date: Date) => {
    return Number.isNaN(date.getTime()) ? "unavailable" : date.toISOString();
};

const toPrettyJson = (value: unknown) => {
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return null;
    }
};

const formatBitrate = (value?: string | number) => {
    if (value === undefined || value === null) {
        return null;
    }

    const bitsPerSecond = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(bitsPerSecond) || bitsPerSecond <= 0) {
        return null;
    }

    if (bitsPerSecond >= 1_000_000) {
        return `${(bitsPerSecond / 1_000_000).toFixed(2).replace(/\.00$/, "")} Mbps`;
    }

    return `${(bitsPerSecond / 1_000).toFixed(0)} kbps`;
};

const getVideoInfo = (fullPath: string): MediaInfo | null => {
    try {
        const ffprobePath = typeof ffprobeStatic === "string"
            ? ffprobeStatic
            : ffprobeStatic.path;
        if (!ffprobePath) {
            return null;
        }

        const result = spawnSync(
            ffprobePath,
            [
                "-v", "error",
                "-print_format", "json",
                "-show_streams",
                "-show_format",
                fullPath
            ],
            { encoding: "utf-8" }
        );

        if (result.status !== 0) {
            return null;
        }

        const parsed = JSON.parse(result.stdout) as {
            streams?: Array<{ codec_type?: string; width?: number; height?: number; codec_name?: string; bit_rate?: string | number }>;
            format?: { format_name?: string; bit_rate?: string | number };
        };

        const videoStream = (parsed.streams ?? []).find((stream) => stream.codec_type === "video");
        const width = videoStream?.width;
        const height = videoStream?.height;
        const format = parsed.format?.format_name ?? videoStream?.codec_name ?? null;
        const bitrate = formatBitrate(parsed.format?.bit_rate ?? videoStream?.bit_rate);

        return {
            kind: "video",
            format,
            dimensions: formatDimensions(width, height),
            aspectRatio: formatAspectRatio(width, height),
            bitrate,
            metadataJson: toPrettyJson(parsed)
        };
    } catch {
        return null;
    }
};

const getImageInfo = async (fullPath: string): Promise<MediaInfo | null> => {
    try {
        const metadata = await sharp(fullPath).metadata();
        return {
            kind: "image",
            format: metadata.format ? metadata.format.toUpperCase() : null,
            dimensions: formatDimensions(metadata.width, metadata.height),
            aspectRatio: formatAspectRatio(metadata.width, metadata.height),
            bitrate: null,
            metadataJson: toPrettyJson(metadata)
        };
    } catch {
        return null;
    }
};

export function Preview() {
    const directory = useFileStore((state: any) => state.directory) as string;
    const files = useFileStore((state: any) => state.files) as FileListEntry[];
    const cursorIndex = useFileStore((state: any) => state.cursorIndex) as number;
    const multiSelectOffsetIndex = useFileStore((state: any) => state.multiSelectOffsetIndex) as number;

    const selectedIndex = Math.max(
        0,
        Math.min(files.length - 1, cursorIndex + multiSelectOffsetIndex)
    );
    const selected = files[selectedIndex];
    const [mediaInfo, setMediaInfo] = useState<MediaInfo | null>(null);

    useEffect(() => {
        let cancelled = false;
        setMediaInfo(null);

        if (!selected || selected.type !== "file") {
            return;
        }

        const extension = path.extname(selected.name).toLowerCase();
        const fullPath = path.join(directory, selected.name);

        if (IMAGE_EXTENSIONS.has(extension)) {
            getImageInfo(fullPath)
                .then((info) => {
                    if (cancelled) {
                        return;
                    }
                    setMediaInfo(info);
                })
                .catch(() => {
                    if (!cancelled) {
                        setMediaInfo(null);
                    }
                });
            return () => {
                cancelled = true;
            };
        }

        if (VIDEO_EXTENSIONS.has(extension)) {
            if (!cancelled) {
                setMediaInfo(getVideoInfo(fullPath));
            }
        }

        return () => {
            cancelled = true;
        };
    }, [directory, selected?.name, selected?.type]);

    let title = "Preview";
    let content = "No files available.";

    if (selected) {
        title = `Preview: ${selected.name}`;
        const fullPath = path.join(directory, selected.name);
        const extension = path.extname(selected.name).toLowerCase();
        const isImage = IMAGE_EXTENSIONS.has(extension);
        const isVideo = VIDEO_EXTENSIONS.has(extension);
        let createdAt = "unavailable";
        let lastModified = "unavailable";

        if (mediaInfo?.dimensions) {
            title = `Preview: ${selected.name} (${mediaInfo.dimensions})`;
        }

        if (selected.type !== "file") {
            content = selected.type === "dir"
                ? "Selected item is a directory."
                : "Selected item cannot be previewed.";
        } else {
            try {
                const stats = fs.statSync(fullPath);
                createdAt = formatDate(stats.birthtime);
                lastModified = formatDate(stats.mtime);
            } catch {
                // Keep unavailable fallback.
            }
        }

        if (selected.type === "file" && (isImage || isVideo)) {
            const typeLabel = mediaInfo?.kind === "video" ? "Video" : "Image";
            content = [
                `${typeLabel} file`,
                `Format: ${mediaInfo?.format ?? "unavailable"}`,
                `Dimensions: ${mediaInfo?.dimensions ?? "unavailable"}`,
                `Aspect ratio: ${mediaInfo?.aspectRatio ?? "unavailable"}`,
                `Bitrate: ${mediaInfo?.kind === "video" ? (mediaInfo.bitrate ?? "unavailable") : "n/a"}`,
                `Created at: ${createdAt}`,
                `Last modified: ${lastModified}`,
                "",
                "Metadata:",
                mediaInfo?.metadataJson ?? "unavailable"
            ].join("\n");
        } else if (selected.type === "file") {
            try {
                const buffer = fs.readFileSync(fullPath);
                const header = [
                    `Created at: ${createdAt}`,
                    `Last modified: ${lastModified}`,
                    ""
                ].join("\n");

                if (isLikelyBinary(buffer)) {
                    content = `${header}Binary file preview is not supported.`;
                } else {
                    const text = buffer.toString("utf-8");
                    if (text.length > MAX_PREVIEW_CHARS) {
                        content = `${header}${text.slice(0, MAX_PREVIEW_CHARS)}\n\n[Preview truncated]`;
                    } else {
                        content = `${header}${text}`;
                    }
                }
            } catch (error) {
                content = `Unable to read file: ${error instanceof Error ? error.message : "Unknown error"}`;
            }
        }
    }

    return (
        <scrollbox
            title={title}
            scrollY
            borderStyle="rounded"
            borderColor={settings.border.color.dimmed}
            focusedBorderColor={settings.border.color.focus}
            width="100%"
            height="100%"
            paddingLeft={1}
            paddingRight={1}
        >
            <text fg={settings.text.color.bright}>
                {content.length > 0 ? content : "(empty file)"}
            </text>
        </scrollbox>
    );
}
