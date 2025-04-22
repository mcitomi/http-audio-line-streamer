import pidusage from "pidusage";
import { monitorBox, screen } from "./screen.js";
import { streamProcess, clientCount } from "../index.js";
import { getFormattedTime } from "./time.js";

import CONFIG from "../../config.json" with { type: "json" };

export function monitorUpdater() {
    const cpuMonitor = startCpuMonitor();
    checkStats(cpuMonitor);
    setInterval(() => {
        checkStats(cpuMonitor);
    }, CONFIG.monitor_interval * 1000);
}

async function checkStats(cpuMonitor) {
    try {
        const mem = process.memoryUsage();
        const childStats = await pidusage(streamProcess.pid, {usePs: CONFIG.use_ps_fetch});

        monitorBox.setContent(
            `{magenta-bg}Main process and HTTP server{/magenta-bg} (PID ${process.pid})\n` +
            `CPU: ${cpuMonitor.getCpuPercent()}%  | Memory: ${(mem.rss / 1024 / 1024).toFixed(2)} MB | Heap: ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB / ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB\n\n` +
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

// https://github.com/nodejs/help/issues/283
function startCpuMonitor(intervalMs = 5000) {
    let latestCpuPercent = 0;

    const measure = async () => {
        while (true) {
            const startUsage = process.cpuUsage();
            const startTime = process.hrtime();

            await new Promise((r) => setTimeout(r, intervalMs));

            const elapsedUsage = process.cpuUsage(startUsage);
            const elapsedTime = process.hrtime(startTime);

            const elapsedMicros = (elapsedTime[0] * 1e6) + (elapsedTime[1] / 1e3);
            const usedMicros = elapsedUsage.user + elapsedUsage.system;

            latestCpuPercent = (usedMicros / elapsedMicros) * 100;
        }
    };

    measure();
    return {
        getCpuPercent: () => latestCpuPercent.toFixed(2),
    };
}
