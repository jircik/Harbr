import { execSync } from "child_process";

export interface KillResult {
    success: boolean;
    error?: string;
}

export async function killPid(pid: number): Promise<KillResult> {
    if (!pid || pid <= 0) {
        return { success: false, error: "Invalid PID" };
    }

    try {
        execSync(`kill -9 ${pid}`, { stdio: "ignore" });
        return { success: true };
    } catch (err: any) {
        const message = err?.message ?? "Unknown error";
        if (message.includes("No such process")) {
            return { success: false, error: "Process not found" };
        }
        return { success: false, error: message };
    }
}