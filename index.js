const express = require('express');
const app = express();
const ffmpeg = require('fluent-ffmpeg');
const { exec } = require('child_process');
const CONFIG = require("./config.json");

var clientCount = 0;

function logger(text, type, logClients = false) {
    const timestamp = new Date().toISOString().split('.')[0].replace('T', ' ');
    switch (type) {
        case "log":
            console.log(`[${timestamp}] ⚪ ${text}`);
            break;
        case "error":
            console.error(`[${timestamp}] 🔴 ${text}`);
            break;

        case "info":
            console.info(`[${timestamp}] 🔵 ${text}`);
            break;

        case "dc":
            console.info(`[${timestamp}] 🛑 ${text}`);
            break;
        default:
            break;
    }

    logClients && console.info(`[${timestamp}] 🔌 Clients: ${clientCount}`);
}

exec(`ffmpeg -f ${CONFIG.audio_api} -i audio="${CONFIG.audio_line}" -c:a ${CONFIG.codec} -b:a ${CONFIG.bitrate}k -f ${CONFIG.format} udp://${CONFIG.local_stream_url}`, (error, stdout, stderr) => {
    if (error) {
        logger(`Unable to start FFmpeg stream, error: ${error}`, "error");
        return;
    }
    logger(`stdout: ${stdout}`, "log");
    logger(`stderr: ${stderr}`, "error");
});

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');

    clientCount++;
    const clientInfo = `${req.headers['user-agent']} - ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`;

    ffmpeg(`udp://${CONFIG.local_stream_url}`)
        .audioCodec('copy')
        .format(CONFIG.format)
        .on('start', () => {
            logger(`FFmpeg info: Streaming started to ${clientInfo}`, "info", true);
        })
        .on('error', (err) => {
            err.message.includes("Output stream closed") ? logger(`Client ${clientInfo} disconnected`, "dc", true) : logger(`FFmpeg error: ${err.message}`, "error", true);
            res.end();
        })
        .pipe(res, { end: true });

    res.on('close', () => {
        clientCount--;
    });
});

app.listen(CONFIG.http_port, () => {
    logger("HAL Streamer v.1.1. by.: @mcitomi", "log");
    logger(`Http server listening at http://localhost:${CONFIG.http_port}/`, "log");
});
