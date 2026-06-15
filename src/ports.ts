import { execSync } from "child_process";

export interface PortEntry {
    port: number;
    protocol: string;
    pid: number;
    processName: string;
    localAddress: string;
    label: string;
}

const KNOWN_PORTS: Record<number, string> = {
    80: "HTTP",
    443: "HTTPS",
    3306: "MySQL",
    5432: "PostgreSQL",
    6379: "Redis",
    8080: "HTTP Alt",
    8443: "HTTPS Alt",
    27017: "MongoDB",
    5672: "RabbitMQ",
    9200: "Elasticsearch",
};

export function parseSsOutput(raw: string): PortEntry[] {
    if (!raw.trim()) return [];

    const results: PortEntry[] = [];

    for (const line of raw.split("\n")) {
        const userMatch = line.match(/users:\(\("([^"]+)",pid=(\d+)/);
        if (!userMatch) continue;

        const processName = userMatch[1];
        const pid = parseInt(userMatch[2], 10);

        const tokens = line.trim().split(/\s+/);
        if (tokens.length < 5) continue;

        const protocol = tokens[0].toLowerCase();
        const addrPort = tokens[4];
        const lastColon = addrPort.lastIndexOf(":");
        if (lastColon === -1) continue;

        const localAddress = addrPort.substring(0, lastColon);
        const port = parseInt(addrPort.substring(lastColon + 1), 10);
        if (isNaN(port)) continue;

        const label = KNOWN_PORTS[port] ?? "";

        results.push({ port, protocol, pid, processName, localAddress, label });
    }

    return results;
}

export function getActivePorts(): PortEntry[] {
    try {
        const raw = execSync("ss -tulnp", { encoding: "utf-8" });
        return parseSsOutput(raw);
    } catch {
        return [];
    }
}