import blessed from "blessed";
import { appendFile } from "node:fs";
import { join } from "node:path";

import { streamProcess } from "./ffmpeg.js";
import { getFormattedTime } from "./time.js";
import { logDirPath } from "./logger.js";

import CONFIG from "../../config.json" with { type: "json" };

export const screen = blessed.screen({
    smartCSR: true,
    title: "H.A.L. Streamer v.1.4.0."
});

export const logBox = blessed.log({
    name: "log",
    label: ' Log ',
    top: 1,
    left: 0,
    width: '50%',
    height: '100%-1',
    border: { type: 'line' },
    style: { border: { fg: 'green' } },
    scrollback: CONFIG.monitoring.screen_max_scrollback,
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    mouse: true,
    scrollbar: {
        ch: ' ',
        track: {
            bg: 'grey'
        },
        style: {
            bg: 'green'
        },
        inverse: true
    },
    vi: true,
    tags: true
});

export const ffmpegLog = blessed.list({
    name: "fflog",
    label: ' FFmpeg Log ',
    top: 11,
    left: '50%',
    width: '50%',
    height: '100%-11',
    items: [],
    border: { type: 'line' },
    style: { fg: 'yellow', border: { fg: 'magenta' } },
    scrollback: CONFIG.monitoring.screen_max_scrollback,
    scrollable: true,
    keys: true,
    mouse: true,
    tags: true,
    scrollbar: { ch: ' ', inverse: true }
});

export function pushFFmpegLog(msg) {
    if (CONFIG.monitoring.save_ffmpeg_log) {
        appendFile(join(logDirPath, "ffmpeg-log.txt"), `[${getFormattedTime()}] - ${msg}\n`, (fserr) => {
            if (fserr) {
                logBox.log(`[${timestamp}] - {red-bg}Error creating ffmpeg-log file!{/red-bg}\n`);
            }
        });
    }

    const lines = msg.split('bitrate');

    if (ffmpegLog?.items?.length > CONFIG.monitoring.ffmpeg_log_length) {
        ffmpegLog.shiftItem(1);
        if (lines[1]) ffmpegLog.shiftItem(1);
    };

    ffmpegLog.addItem(lines[0]);
    lines[1] && ffmpegLog.addItem("bitrate" + lines[1]);
    
    screen.focused?.name != "fflog" && ffmpegLog.scrollTo(ffmpegLog.items.length);
    screen.render();
}

export const monitorBox = blessed.box({
    label: ' Resources ',
    top: 1,
    left: '50%',
    width: '50%',
    height: CONFIG.monitoring.enable_ffmpeg_log ? 10 : "100%-1",
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
    content: '{center}{bold} HTTP Audio Line Streamer v.1.4.0.{/bold} - {blue-fg}www.mcitomi.hu{/blue-fg}{/center}',
    style: {
        fg: 'white',
        bg: 'green'
    }
});

screen.append(header);
screen.append(logBox);
CONFIG.monitoring.enable_ffmpeg_log && screen.append(ffmpegLog);
screen.append(monitorBox);

screen.render();

screen.key(['escape', 'q', 'C-c'], () => {
    streamProcess.kill();
    process.exit(0);
});

screen.key('tab', () => {
    if(screen.focused.name == "log"){
        ffmpegLog.focus();
        ffmpegLog.setLabel(" [FFmpeg Log] ")
        logBox.setLabel(" Log ");
       
    } else {
        logBox.focus();
        logBox.setLabel(" [Log] ");
        ffmpegLog.setLabel(" FFmpeg Log ")
    }
});