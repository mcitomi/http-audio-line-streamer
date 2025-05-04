import { writeFile, appendFile, existsSync, mkdirSync, mkdir } from "node:fs";
import { join } from "node:path";
import { logBox, ffmpegLog } from "./screen.js";
import { getFormattedTime } from "./time.js";

import CONFIG from "../../config.json" with { type: "json" };

export const LogTypes = {
    ERROR: "error",
    LOG: "log",
    INFO: "info",
    DISCONNECT: "dc"
}

export const logDirPath = join(import.meta.dirname, "..", "..", "logs");

if(!existsSync(logDirPath)) {
    mkdirSync(logDirPath);
}

export function logger(text, type) {
    const timestamp = getFormattedTime();
    if (CONFIG.monitoring.save_main_log) {
        appendFile(join(logDirPath, "log.txt"), `[${getFormattedTime()}] - ${text}\n`, (fserr) => {
            if (fserr) {
                logBox.log(`[${timestamp}] - {red-bg}Error creating log file!{/red-bg} ${fserr.message}\n`);
            }
        });
    }

    switch (type) {
        case "log":
            logBox.log(`[${timestamp}] - ${text}\n`);
            break;
        case "error":
            logBox.log(`[${timestamp}] - {red-bg}${text}{/red-bg}\n`);
            break;

        case "info":
            logBox.log(`[${timestamp}] - {cyan-fg}${text}{/cyan-fg}\n`);
            break;

        case "dc":
            logBox.log(`[${timestamp}] - {red-fg}${text}{/red-fg}\n`);
            break;
        default:
            break;
    }
}

export function createFFmpegLogFile() {
    writeFile(join(process.cwd(), "logs", `ffmpeg-crash-log-${Date.now()}.txt`), `${getFormattedTime()} FFmpeg process crashed!\n${JSON.stringify(ffmpegLog.items.map(item => item.getText()), null, 4)}`, (fserr) => {
        if (fserr) {
            logger("FFmpeg process crashed! Error creating log file!", LogTypes.ERROR);
        }
    });
}