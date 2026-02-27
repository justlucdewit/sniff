import fs from "fs";
import path from "path";

export const getSelectionRange = (fileStore: any) => {
    const files = fileStore.files ?? [];
    const cursorIndex = fileStore.cursorIndex ?? 0;
    const offset = fileStore.multiSelectOffsetIndex ?? 0;
    const start = Math.max(0, Math.min(cursorIndex, cursorIndex + offset));
    const end = Math.min(files.length - 1, Math.max(cursorIndex, cursorIndex + offset));

    return { files, start, end };
};

export const getUniquePastePath = (targetDir: string, originalName: string) => {
    let candidateName = originalName;
    let candidatePath = path.join(targetDir, candidateName);
    let attempt = 1;

    while (fs.existsSync(candidatePath)) {
        const parsed = path.parse(originalName);
        const suffix = attempt === 1 ? "copy" : `copy${attempt}`;
        candidateName = `${parsed.name}-${suffix}${parsed.ext}`;
        candidatePath = path.join(targetDir, candidateName);
        attempt += 1;
    }

    return candidatePath;
};

export const isShiftJ = (key: any) => key.name == "J" || (key.name == "j" && !!key.shift);
export const isShiftK = (key: any) => key.name == "K" || (key.name == "k" && !!key.shift);
