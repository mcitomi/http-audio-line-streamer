import blessed from "blessed";
import { streamProcess } from "../index.js";
import CONFIG from "../../config.json" with { type: "json" };

export const screen = blessed.screen({
    smartCSR: true,
    title: "H.A.L. Streamer v.1.3.3."
});

export const logBox = blessed.log({
    label: ' Log ',
    top: 1,
    left: 0,
    width: '50%',
    height: '100%-1',
    border: { type: 'line' },
    style: {
        border: { fg: 'green' },
        scrollbar: {
            bg: 'green'
        }
    },
    scrollback: 1000,
    alwaysScroll: true,
    keys: true,
    mouse: true,
    scrollbar: {
        ch: ' ',
        track: {
            bg: 'grey'
        },
        style: {
            inverse: true
        }
    },
    vi: true,
    tags: true
});

export const ffmpegLog = blessed.list({
    label: ' FFmpeg Log ',
    top: 11,
    left: '50%',
    width: '50%',
    height: '100%-11',
    items: [],
    border: { type: 'line' },
    style: { fg: 'yellow', border: { fg: 'magenta' } },
    scrollback: 1000,
    alwaysScroll: true,
    keys: true,
    mouse: true,
    tags: true,
    scrollbar: { ch: ' ', inverse: true }
});

export function pushFFmpegLog(msg) {
    if (ffmpegLog?.items?.length > 50) ffmpegLog.shiftItem(1);
    ffmpegLog.addItem(msg);
    ffmpegLog.scrollTo(ffmpegLog.items.length);
    screen.render();
}

export const monitorBox = blessed.box({
    label: ' Resources ',
    top: 1,
    left: '50%',
    width: '50%',
    height: CONFIG.enable_ffmpeg_log ? 10 : "100%-1",
    border: { type: 'line' },
    style: { border: { fg: 'cyan' } },
    content: 'Loading...',
    tags: true
});

const header = blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: 1,
    tags: true,
    content: '{center}{bold} HTTP Audio Line Streamer v.1.3.3.{/bold} - {blue-fg}www.mcitomi.hu{/blue-fg}{/center}',
    style: {
        fg: 'white',
        bg: 'green'
    }
});

screen.append(header);
screen.append(logBox);
CONFIG.enable_ffmpeg_log && screen.append(ffmpegLog);
screen.append(monitorBox);
screen.render();

screen.key(['escape', 'q', 'C-c'], () => {
    streamProcess.kill();
    process.exit(0);
});