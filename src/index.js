import Express from "express";
import ffmpeg from "fluent-ffmpeg";
import { spawn } from "child_process";

import CONFIG from "../config.json" with { type: "json" };

import { logger } from "./modules/logger.js";
import { monitorUpdater } from "./modules/resources.js";
import { pushFFmpegLog } from "./modules/screen.js";

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

if(CONFIG.enable_ffmpeg_log) {
    streamProcess.stdout.on('data', (data) => {
        pushFFmpegLog(`stdout: ${data.toString()}`);
    });
    
    streamProcess.stderr.on('data', (data) => {
        pushFFmpegLog(`stderr: ${data.toString()}`);
    });
    
    streamProcess.on('error', (err) => {
        pushFFmpegLog(`FFmpeg error: ${err.message}`);
    });
    
    streamProcess.on('close', (code) => {
        pushFFmpegLog(`FFmpeg stopped, exit code: ${code}`);
    });
}

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
            logger(`Client ${clientInfo} connected: Stream started`, "info");
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
    logger("H.A.L. Streamer v.1.3.4. made by: @mcitomi", "log");
    logger(`Http server listening at http://localhost:${CONFIG.http_port}/`, "log");
});
