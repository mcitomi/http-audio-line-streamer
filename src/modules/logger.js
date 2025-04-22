import { logBox } from "./screen.js";
import { getFormattedTime } from "./time.js";
export function logger(text, type) {
    const timestamp = getFormattedTime();
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