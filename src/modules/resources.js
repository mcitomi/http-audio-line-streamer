import pidusage from "pidusage";
import { monitorBox, screen } from "./screen.js";
import { streamProcess, clientCount } from "../index.js";
import { getFormattedTime } from "./time.js";

import CONFIG from "../../config.json" with { type: "json" };

export function monitorUpdater() {
    checkStats();
    setInterval(() => {
        checkStats();
    }, CONFIG.monitor_interval * 1000);
}

async function checkStats() {
    try {
        const stats = await pidusage([process.pid, streamProcess.pid]);
        const mainStats = stats[process.pid];
        const childStats = stats[streamProcess.pid];
        
        monitorBox.setContent(
            `{magenta-bg}Main process and HTTP server{/magenta-bg} (PID ${process.pid})\n` +
            `CPU: ${mainStats.cpu.toFixed(2)}%  | Memory: ${(mainStats.memory / 1024 / 1024).toFixed(2)} MB\n\n` +
            `{magenta-bg}FFmpeg Stream{/magenta-bg} (PID ${streamProcess.pid})\n` +
            `CPU: ${childStats.cpu.toFixed(2)}%  | Memory: ${(childStats.memory / 1024 / 1024).toFixed(2)} MB\n` +
            `\n{cyan-fg}Connected clients:{/cyan-fg} ${clientCount}\n` +
            `{green-fg}Last check:{/green-fg} ${getFormattedTime()}\n`
        );
    } catch (err) {
        monitorBox.setContent('Monitor error:\n' + err.message);
    }
    screen.render();
}