const express = require('express');
const app = express();
const ffmpeg = require('fluent-ffmpeg');
const { exec } = require('child_process');
const CONFIG = require("./config.json");

function logger(text, type) {
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
    
        default:
            break;
    }
}

exec(`ffmpeg -f ${CONFIG.audio_api} -i audio="${CONFIG.audio_line}" -c:a ${CONFIG.codec} -b:a ${CONFIG.bitrate}k -f ${CONFIG.format} udp://${CONFIG.local_stream_url}`, (error, stdout, stderr) => {
    if (error) {
        logger(`exec error: ${error}`, "error");
        return;
    }
    logger(`stdout: ${stdout}`, "log");
    logger(`stderr: ${stderr}`, "log");
});

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');

    ffmpeg(`udp://${CONFIG.local_stream_url}`)
        .audioCodec('copy')
        .format(CONFIG.format)
        .on('start', () => {
            logger(`FFmpeg info: Streaming started to ${req.headers['user-agent']}`, "info");
        })
        .on('error', (err) => {
            logger(`FFmpeg error/client disconnected: ${err.message}`, "error");
            res.end();
        })
        .pipe(res, { end: true });
});

app.listen(CONFIG.http_port, () => {
    logger(`Stream server listening at http://localhost:${CONFIG.http_port}/`, "log");
});
