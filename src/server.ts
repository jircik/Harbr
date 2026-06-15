import express, { Request, Response } from "express";
import { getActivePorts } from "./ports";
import { killPid } from "./kill";
import { getDashboardHtml } from "./ui";

export function createServer() {
    const app = express();
    app.use(express.json());

    app.get("/", (_req: Request, res: Response) => {
        res.setHeader("Content-Type", "text/html");
        res.send(getDashboardHtml());
    });

    app.get("/api/ports", (_req: Request, res: Response) => {
        res.json(getActivePorts());
    });

    app.delete("/api/ports/:pid", async (req: Request, res: Response) => {
        const pid = parseInt(req.params.pid, 10);
        if (isNaN(pid)) {
            res.status(400).json({ success: false, error: "Invalid PID" });
            return;
        }
        const result = await killPid(pid);
        res.status(result.success ? 200 : 500).json(result);
    });

    return app;
}