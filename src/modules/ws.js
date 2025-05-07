import { WebSocketServer } from "ws";
import { newClient } from "./clients.js";
import { logger, LogTypes } from "./logger.js";

import CONFIG from "../../config.json" with { type: "json" };

var metaDatas = {
    title: "H.A.L. Stream",
    author: "www.mcitomi.hu",
    img: "/webplayer/assets/blank.jpg",
    playedAt: Date.now(),
    url: "https://mcitomi.hu/",
    artistUrl: "https://mcitomi.hu/",
    durationMs: 0,
    progressMs: 0
};

const history = [];
let lastTitle = null;
const metadataClients = new Set();

export function wss(server, streamProcess) {
    const wss = new WebSocketServer({ server });

    if(CONFIG.meta_infos.enabled) {
        setInterval(updateMeta, CONFIG.meta_infos.refresh_interval * 1000);
    }
   
    wss.on("connection", async (ws, req) => {
        switch (req.url) {
            case "/ws-stream":
                const onData = (chunk) => {
                    if (ws.readyState === ws.OPEN) {
                        ws.send(chunk);
                    }
                };

                const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress);
                newClient(true);

                logger(`Client ${req.headers['user-agent']} - ${ip} connected`, LogTypes.INFO);

                streamProcess.stdout.on("data", onData);

                ws.on('close', () => {
                    streamProcess.stdout.off("data", onData);
                    logger(`Client ${req.headers['user-agent']} - ${ip} disconnected`, LogTypes.DISCONNECT);
                    newClient(false);
                });
                break;

            case "/metadata":
                if(!CONFIG.meta_infos.enabled) {
                    ws.close(1008, "Invalid WebSocket endpoint.");
                    break;
                }
                metadataClients.add(ws);

                ws.send(JSON.stringify({metaDatas, history, connectionDate: Date.now()}));

                ws.on("close", () => {
                    metadataClients.delete(ws);
                });
                break;

            default:
                ws.close(1008, "Invalid WebSocket endpoint.");
                break;
        }
    });
}

async function updateMeta() {
    try {
        const response = await fetch(CONFIG.meta_infos.api_url);

        if(response.status == 404) {
            if(lastTitle) {
                logger("Not playing anything at the moment", LogTypes.INFO);
                lastTitle = null;
            }
            return;
        }

        if (!response.ok) throw new Error("Invalid response");

        const body = await response.json();

        const newTitle = getByPath(body, CONFIG.meta_infos.title_path);
        if (newTitle !== lastTitle) {
            lastTitle = newTitle;

            if (history.length >= CONFIG.meta_infos.max_history_length) {
                history.pop();
            }
            history.unshift({ ...metaDatas });

            metaDatas.title = newTitle;
            metaDatas.author = getByPath(body, CONFIG.meta_infos.author_path);
            metaDatas.img = getByPath(body, CONFIG.meta_infos.album_pic_path);
            metaDatas.playedAt = Date.now();
            metaDatas.url = getByPath(body, CONFIG.meta_infos.song_urL_path);
            metaDatas.artistUrl = getByPath(body, CONFIG.meta_infos.artist_url_path);
            metaDatas.durationMs = getByPath(body, CONFIG.meta_infos.song_duration_path);
            metaDatas.progressMs = getByPath(body, CONFIG.meta_infos.song_progress_path);

            broadcastMetadata();
        }
    } catch (error) {
        logger(`Unable to get meta infos`, LogTypes.ERROR);
    }
}

function broadcastMetadata() {
    for (const client of metadataClients) {
        if (client.readyState === client.OPEN) {
            client.send(JSON.stringify({metaDatas, history, connectionDate: Date.now()}));
        }
    }
}

function getByPath(obj, path) {
    return path.split('.').reduce((acc, key) => {
        if (!acc) return undefined;

        const arrayMatch = key.match(/^([^\[\]]+)\[(\d+)\]$/);
        if (arrayMatch) {
            const [, arrayKey, index] = arrayMatch;
            return acc[arrayKey]?.[parseInt(index, 10)];
        }

        return acc[key];
    }, obj);
}
