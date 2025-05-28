import Express from "express";
import { join } from "path";
import { existsSync, writeFileSync } from "fs";

import CONFIG from "../../config.json" with { type: "json" };

import { wss } from "./ws.js";
import { LogTypes, logger } from "./logger.js";
import { streamProcess } from "./ffmpeg.js";
import { newClient } from "./clients.js";
import { startHttps } from "./https.js";

export const app = Express();

app.use(Express.json());

app.get("/", (req, res) => {
    if (!req.headers['user-agent'].toLowerCase().includes("vlc") && CONFIG.stream.ws_enabled) {
        res.redirect("/webplayer");
        return;
    }

    if (!CONFIG.stream.http_enabled) {
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
    logger("H.A.L. Streamer v.1.4.5. made by: @mcitomi", LogTypes.LOG);
    logger(`HTTP server listening at http://localhost:${CONFIG.http_port}/`, LogTypes.LOG);
});

if (CONFIG.https.enabled) {
    startHttps();
}

if (CONFIG.stream.ws_enabled) {
    app.use("/webplayer", Express.static("frontend/build"));

    wss(server, streamProcess);
}

if (CONFIG.meta_infos.static.enabled) {
    const matadatafile = join(process.cwd(), "frontend", "build", "metadata.json");
    writeFileSync(matadatafile, JSON.stringify({
        "songname": "H.A.L. Streamer",
        "author": "mcitomi"
    }, null, 4), { encoding: "utf-8" });

    if (CONFIG.meta_infos.static.writeable) {
        app.post("/meta/update", async (req, res) => {
            try {
                const pwd = req.headers.authorization?.split(" ")[1].trim();
                if (pwd != CONFIG.meta_infos.static.pwd) {
                    throw new Error("Invalid password");
                }
                const body = await req.body;

                writeFileSync(matadatafile, JSON.stringify(body, null, 4), { encoding: "utf-8" });

                res.status(200).json({ message: "updated" });
            } catch (error) {
                res.status(500).json({ message: error.message });
                console.log(error);
            }
        });
    }
}