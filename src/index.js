import Express from "express";
import ffmpeg from "fluent-ffmpeg";
import { spawn } from "child_process";

import CONFIG from "../config.json" with { type: "json" };

import { logger } from "./modules/logger.js";
import { monitorUpdater } from "./modules/resources.js";
import { ffmpegLog } from "./modules/screen.js";

const app = Express();

export var clientCount = 0;

export const streamProcess = spawn('ffmpeg', [
    '-f', CONFIG.audio_api,
    '-i', `audio=${CONFIG.audio_line}`,
    '-c:a', CONFIG.codec,
    '-b:a', `${CONFIG.bitrate}k`,
    '-f', CONFIG.format,
    `udp://${CONFIG.local_stream_url}`
]);

streamProcess.stdout.on('data', (data) => {
    ffmpegLog.log(`stdout: ${data.toString()}`);
});

streamProcess.stderr.on('data', (data) => {
    ffmpegLog.log(`stderr: ${data.toString()}`);
});

streamProcess.on('error', (err) => {
    ffmpegLog.log(`FFmpeg error: ${err.message}`);
});

streamProcess.on('close', (code) => {
    ffmpegLog.log(`FFmpeg stopped, exit code: ${code}`);
});

monitorUpdater();

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');

    clientCount++;
    const clientInfo = `${req.headers['user-agent']} - ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`;

    ffmpeg(`udp://${CONFIG.local_stream_url}`)
        .audioCodec('copy')
        .format(CONFIG.format)
        .on('start', () => {
            logger(`FFmpeg info: Streaming started to ${clientInfo}`, "info");
        })
        .on('error', (err) => {
            err.message.includes("Output stream closed") ? logger(`Client ${clientInfo} disconnected`, "dc") : logger(`FFmpeg error: ${err.message}`, "error");
            res.end();
        })
        .pipe(res, { end: true });

    res.on('close', () => {
        clientCount--;
    });
});

app.listen(CONFIG.http_port, () => {
    logger("HAL Streamer v.1.3.0. made by: @mcitomi", "log");
    logger(`Http server listening at http://localhost:${CONFIG.http_port}/`, "log");
});
