import { WebSocketServer } from "ws";
import { newClient } from "./clients.js";
import { logger, LogTypes } from "./logger.js";

export function wss(server, streamProcess) {
    const wss = new WebSocketServer({ server });

    wss.on("connection", (ws, req) => {
        const onData = (chunk) => {
            if (ws.readyState === ws.OPEN) {
                ws.send(chunk);
            }
        };
    
        const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress);
        newClient(true);
    
        streamProcess.stdout.on("data", onData);
    
        ws.on('close', () => {
            streamProcess.stdout.off("data", onData);
            logger(`Client ${req.headers['user-agent']} - ${ip} disconnected`, LogTypes.DISCONNECT);
            newClient(false);
        });
    });
}