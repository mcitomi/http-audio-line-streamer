import { spawn } from "child_process";
import CONFIG from "../../config.json" with { type: "json" };

import { logger, LogTypes, createFFmpegLogFile } from "./logger.js";
import { pushFFmpegLog } from "./screen.js";

export const streamProcess = spawn('ffmpeg', [
    '-f', CONFIG.stream.audio_api,
    '-i', `audio=${CONFIG.stream.audio_line}`,
    '-c:a', CONFIG.stream.codec,
    '-b:a', `${CONFIG.stream.bitrate}k`,
    '-f', CONFIG.stream.format,
    `pipe:1`
]);

if (CONFIG.monitoring.enable_ffmpeg_log) {
    streamProcess.stderr.on('data', (data) => {
        pushFFmpegLog(`stderr: ${data.toString()}`);
    });

    streamProcess.on('error', (err) => {
        pushFFmpegLog(`FFmpeg error: ${err.message}`);
        createFFmpegLogFile();
    });

    streamProcess.on('close', (code) => {
        pushFFmpegLog(`FFmpeg stopped, exit code: ${code}`);
        createFFmpegLogFile();
    });
}

streamProcess.stdout.on('error', (err) => {
    logger(`FFmpeg stdout error: ${err.message}`, LogTypes.ERROR);
    CONFIG.monitoring.enable_ffmpeg_log && createFFmpegLogFile();
});

streamProcess.stdout.on('close', () => {
    logger(`FFmpeg stdout closed`, LogTypes.ERROR);
    CONFIG.monitoring.enable_ffmpeg_log && createFFmpegLogFile();
});

// Dummy data reader
streamProcess.stdout.on('data', () => { });