#!/usr/bin/env node

import { program } from "commander";
import { createServer } from "./server";

async function launchBrowser(url: string) {
    const open = (await import("open")).default;
    await open(url);
}

program
    .name("harbr")
    .description("Local port dashboard — inspect and kill active ports")
    .version("0.1.0")
    .option("-p, --port <number>", "port for the Harbr dashboard", "4444")
    .option("--no-open", "do not open browser automatically")
    .parse(process.argv);

const opts = program.opts();
const dashboardPort = parseInt(opts.port, 10);
const shouldOpen: boolean = opts.open !== false;

const app = createServer();

app.listen(dashboardPort, () => {
    const url = `http://localhost:${dashboardPort}`;
    console.log(`\n  Harbr running at ${url}\n`);
    if (shouldOpen) {
        launchBrowser(url).catch(() => {
            console.log(`   Open your browser at ${url}`);
        });
    }
    console.log("   Press Ctrl+C to stop.\n");
});