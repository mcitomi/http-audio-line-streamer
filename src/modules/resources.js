import pidusage from "pidusage";
import { monitorBox, screen } from "./screen.js";
import { streamProcess, clientCount } from "../index.js";
import CONFIG from "../../config.json" with { type: "json" };

export function monitorUpdater() {
    setInterval(async () => {
        try {
            let mainStats = await pidusage(process.pid);
            let childStats = await pidusage(streamProcess.pid);
            monitorBox.setContent(
                `{magenta-bg}Main process and HTTP server{/magenta-bg} (PID ${process.pid})\n` +
                `CPU: ${mainStats.cpu.toFixed(2)}%  | Memory: ${(mainStats.memory / 1024 / 1024).toFixed(2)} MB\n\n` +
                `{magenta-bg}FFmpeg Stream{/magenta-bg} (PID ${streamProcess.pid})\n` +
                `CPU: ${childStats.cpu.toFixed(2)}%  | Memory: ${(childStats.memory / 1024 / 1024).toFixed(2)} MB\n` +
                `\n{cyan-fg}Connected clients:{/cyan-fg} ${clientCount}\n`+
                `{green-fg}Updated:{/green-fg} ${new Date().toISOString().split('.')[0].replace('T', ' ')}\n`
            );
        } catch (err) {
            monitorBox.setContent('Monitor error:\n' + err.message);
        }
        screen.render();
    }, CONFIG.monitor_interval * 1000);
}