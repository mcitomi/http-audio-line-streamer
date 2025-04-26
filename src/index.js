import Express from "express";
import ffmpeg from "fluent-ffmpeg";
import { spawn } from "child_process";
import { WebSocketServer } from "ws";

import CONFIG from "../config.json" with { type: "json" };

import { logger, LogTypes, createFFmpegLogFile } from "./modules/logger.js";
import { monitorUpdater } from "./modules/resources.js";
import { pushFFmpegLog } from "./modules/screen.js";

const app = Express();

export var clientCount = 0;

export const streamProcess = spawn('ffmpeg', [
    '-f', CONFIG.stream.audio_api,
    '-i', `audio=${CONFIG.stream.audio_line}`,
    '-c:a', CONFIG.stream.codec,
    '-b:a', `${CONFIG.stream.bitrate}k`,
    '-f', CONFIG.stream.format,
    `pipe:1`
]);

if (CONFIG.monitoring.enable_ffmpeg_log) {
    // streamProcess.stdout.on('data', (data) => {
    //     pushFFmpegLog(`stdout: ${data.toString()}`);
    // });

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

monitorUpdater();

app.use(Express.static("src/public"), (req, res) => {
    const clientInfo = `${req.headers['user-agent']} - ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`;
    logger(`Client ${clientInfo} connected: Stream started`, LogTypes.INFO);
});
// app.get('/', (req, res) => {
//     res.setHeader('Content-Type', 'audio/mpeg');
//     res.setHeader('Access-Control-Allow-Origin', '*');

//     clientCount++;
//     const clientInfo = `${req.headers['user-agent']} - ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`;

//     ffmpeg(`udp://${CONFIG.stream.local_url}`)
//         .audioCodec('copy')
//         .format(CONFIG.stream.format)
//         .on('start', () => {
//             logger(`Client ${clientInfo} connected: Stream started`, LogTypes.INFO);  
//         })
//         .on('error', (err) => {
//             err.message.includes("Output stream closed") ? logger(`Client ${clientInfo} disconnected`, LogTypes.DISCONNECT) : logger(`FFmpeg error: ${err.message}`, LogTypes.ERROR);
//             res.end();
//         })
//         .pipe(res, { end: true });

//     res.on('close', () => {
//         clientCount--;
//     });
// });

const server = app.listen(CONFIG.http_port, () => {
    logger("H.A.L. Streamer v.1.3.8. made by: @mcitomi", LogTypes.LOG);
    logger(`Http server listening at http://localhost:${CONFIG.http_port}/`, LogTypes.LOG);
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
    const onData = (chunk) => {
        if (ws.readyState === ws.OPEN) {
            ws.send(chunk);
        }
    };

    streamProcess.stdout.on("data", onData);

    ws.on('close', () => {
        streamProcess.stdout.off("data", onData);
        // logger(`Client ${clientInfo} disconnected`, LogTypes.DISCONNECT)
    });
});
