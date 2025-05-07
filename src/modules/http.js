import Express from "express";

import CONFIG from "../../config.json" with { type: "json" };

import { wss } from "./ws.js";
import { LogTypes, logger } from "./logger.js";
import { streamProcess } from "./ffmpeg.js";
import { newClient } from "./clients.js";

const app = Express();

app.get("/", (req, res) => {
    if (!req.headers['user-agent'].toLowerCase().includes("vlc") && CONFIG.stream.ws_enabled) {
        res.redirect("/webplayer");
        return;
    }

    if(!CONFIG.stream.http_enabled) {
        req.destroy();
        return;
    }

    const clientInfo = `${req.headers['user-agent']} - ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`;

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Access-Control-Allow-Origin", "*");

    newClient(true);
    logger(`Client ${clientInfo} connected`, LogTypes.INFO);

    const onData = (chunk) => {
        if (!res.writableEnded) {
            try {
                res.write(chunk);
            } catch (err) {
                logger(`Write error: ${err.message}`, LogTypes.ERROR);
            }
        }
    };

    streamProcess.stdout.on("data", onData);

    res.on("close", () => {
        streamProcess.stdout.off("data", onData);
        newClient(false);
        logger(`Client ${clientInfo} disconnected`, LogTypes.DISCONNECT);
    });
})

const server = app.listen(CONFIG.http_port, () => {
    logger("H.A.L. Streamer v.1.4.3. made by: @mcitomi", LogTypes.LOG);
    logger(`HTTP server listening at http://localhost:${CONFIG.http_port}/`, LogTypes.LOG);
});

if(CONFIG.stream.ws_enabled) {
    app.use("/webplayer", Express.static("frontend/build"));

    wss(server, streamProcess);
}