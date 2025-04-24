import pidusage from "pidusage";
import { appendFile } from "node:fs";
import { join } from "node:path";

import { monitorBox, screen } from "./screen.js";
import { streamProcess, clientCount } from "../index.js";
import { getFormattedTime } from "./time.js";
import { logger, LogTypes } from "./logger.js";

import CONFIG from "../../config.json" with { type: "json" };

export function monitorUpdater() {
    const cpuMonitor = startCpuMonitor();
    checkStats(cpuMonitor);
    setInterval(() => {
        checkStats(cpuMonitor);
    }, CONFIG.monitoring.refresh_interval * 1000);
}

async function checkStats(cpuMonitor) {
    try {
        const mem = process.memoryUsage();
        const childStats = await pidusage(streamProcess.pid, { usePs: CONFIG.monitoring.use_ps_fetch }).catch(() => {
            return {
                cpu: 0,
                memory: 0,
                failed: true
            }
        });

        monitorBox.setContent(
            `{magenta-bg}Main process and HTTP server{/magenta-bg} (PID ${process.pid})\n` +
            `CPU: ${cpuMonitor.getCpuPercent()}% | Memory: ${(mem.rss / 1024 / 1024).toFixed(2)} MB | Heap: ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB / ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB\n\n` +
            `{${childStats.failed ? "red-bg" : "magenta-bg"}}FFmpeg Stream{/${childStats.failed ? "red-bg" : "magenta-bg"}} (${childStats.failed ? "STOPPED" : `PID ${streamProcess.pid}`})\n` +
            `CPU: ${childStats.cpu.toFixed(2)}% | Memory: ${(childStats.memory / 1024 / 1024).toFixed(2)} MB\n\n` +
            `{cyan-fg}Connected clients:{/cyan-fg} ${clientCount}\n` +
            `{green-fg}Last check:{/green-fg} ${getFormattedTime()}\n`
        );

        if (CONFIG.monitoring.save_resource_log) {
            appendFile(join(process.cwd(), "logs", `resource-log.txt`), `\n[${getFormattedTime()}]\n` +
                `Main process and HTTP server (PID ${process.pid})\n` +
                `CPU: ${cpuMonitor.getCpuPercent()}% | Memory: ${(mem.rss / 1024 / 1024).toFixed(2)} MB | Heap: ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB / ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB\n\n` +
                `FFmpeg Stream (${childStats.failed ? "STOPPED" : `PID ${streamProcess.pid}`})\n` +
                `CPU: ${childStats.cpu.toFixed(2)}% | Memory: ${(childStats.memory / 1024 / 1024).toFixed(2)} MB\n\n` +
                `Connected clients: ${clientCount}\n\n`,
                (fserr) => {
                    if (fserr) {
                        logger(`Error creating resource-log file!`, LogTypes.ERROR);
                    }
                });
        }
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
