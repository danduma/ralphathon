import { networkInterfaces } from "node:os";
import type { IncomingMessage } from "node:http";

export interface JoinUrlResponse {
  url: string;
  urls: string[];
  host: string;
}

function isPrivateIpv4(address: string): boolean {
  return /^10\./.test(address) || /^192\.168\./.test(address) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(address);
}

export function getLanIpv4Addresses(): string[] {
  const addresses: string[] = [];
  for (const entries of Object.values(networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family === "IPv4" && !entry.internal && isPrivateIpv4(entry.address)) {
        addresses.push(entry.address);
      }
    }
  }
  return addresses;
}

export function buildJoinUrlResponse(req: IncomingMessage, appPort: string, appProtocol = "http:"): JoinUrlResponse {
  const requestHost = req.headers.host?.split(":")[0] ?? "localhost";
  const isLocalRequest = requestHost === "localhost" || requestHost === "127.0.0.1";
  const candidateHosts = isLocalRequest ? getLanIpv4Addresses() : [requestHost, ...getLanIpv4Addresses()];
  const host = candidateHosts[0] ?? requestHost;
  const protocol = appProtocol === "https:" ? "https" : "http";
  const portSuffix = appPort ? `:${appPort}` : "";
  const urls = candidateHosts.map((candidate) => `${protocol}://${candidate}${portSuffix}/phone`);
  const url = `${protocol}://${host}${portSuffix}/phone`;
  return {
    url,
    urls: urls.length > 0 ? urls : [url],
    host
  };
}
