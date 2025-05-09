import { createServer } from "node:https";
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

import CONFIG from "../../config.json" with { type: "json" };

import { app } from "./http.js";
import { logger, LogTypes } from "./logger.js";
import { wss } from "./ws.js";
import { streamProcess } from "./ffmpeg.js";

export function startHttps() {
    try {
        const certFolder = join(import.meta.dirname, "..", "cert");
        if (!existsSync(certFolder)) {
            mkdirSync(certFolder);
        }

        const httpsServer = createServer({
            key: readFileSync(join(import.meta.dirname, "..", "cert", CONFIG.https.keyfile)),
            cert: readFileSync(join(import.meta.dirname, "..", "cert", CONFIG.https.certfile))
        }, app).listen(CONFIG.https.port, () => {
            logger(`HTTPS server listening at http://localhost:${CONFIG.https.port}/`, LogTypes.LOG);
        });

        if (CONFIG.stream.ws_enabled) {
            wss(httpsServer, streamProcess);
        }
    } catch (error) {
        if(error.message.includes(CONFIG.https.keyfile)) {
            logger(`Your keyfile not found! ERR: ${error}`, LogTypes.ERROR);
            return;
        }

        if(error.message.includes(CONFIG.https.certfile)) {
            logger(`Your certfile not found! ERR: ${error}`, LogTypes.ERROR);
            return;
        }

        logger(`HTTPS server ERR: ${error}`, LogTypes.ERROR);
    }
}