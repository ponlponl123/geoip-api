const c = {
  reset: "\x1b[0m",
  dim: "\x1b[90m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
};

export class Logger {
  private readonly isClean: boolean;
  private readonly isVerbose: boolean;
  private readonly modes: Set<string>;

  constructor() {
    const raw = (process.env.LOGGING || "clean").toLowerCase();
    const list = raw.split(",").map((s) => s.trim());
    this.isClean = list.includes("clean") || list.includes("none") || !process.env.LOGGING;
    this.isVerbose = !this.isClean && list.includes("verbose");
    this.modes = new Set(list);
  }

  private isEnabled(type: string): boolean {
    if (this.isClean) return false;
    if (this.isVerbose) return true;
    return this.modes.has(type);
  }

  private time(): string {
    return `${c.dim}${new Date().toLocaleTimeString().padStart(11)}${c.reset}`;
  }

  public traffic(method: string, path: string, status: number, durationMs: number, from?: string): void {
    if (!this.isEnabled("traffic")) return;
    const tag = `${c.cyan}[TRAFFIC] ${c.reset}`;
    const mColor = method === "GET" ? c.green : method === "POST" ? c.yellow : c.magenta;
    const sColor = status < 300 ? c.green : status < 500 ? c.yellow : c.red;
    const m = `${mColor}${method.padEnd(5)}${c.reset}`;
    const s = `${sColor}${String(status).padEnd(4)}${c.reset}`;
    const dur = `${c.dim}${durationMs.toFixed(1).padStart(7)}ms${c.reset}`;
    const f = from ? ` ${c.dim}(${from})${c.reset}` : "";
    console.log(`${this.time()} ${tag} ${m} ${path.padEnd(20)} ${f} ${s} ${dur}`);
  }

  public cache(action: "HIT" | "MISS" | "SET" | "ERROR", key: string, extra?: string): void {
    if (!this.isEnabled("cache")) return;
    const tag = `${c.magenta}[CACHE]   ${c.reset}`;
    const aColor = action === "HIT" ? c.green : action === "SET" ? c.cyan : action === "MISS" ? c.yellow : c.red;
    const act = `${aColor}${action.padEnd(5)}${c.reset}`;
    const detail = extra ? ` ${c.dim}(${extra})${c.reset}` : "";
    console.log(`${this.time()} ${tag} ${act} ${key}${detail}`);
  }

  public outgoing(provider: string, target: string, durationMs?: number, status?: number | string): void {
    if (!this.isEnabled("outgoing") && !this.isEnabled("outgoing request")) return;
    const tag = `${c.blue}[OUTGOING]${c.reset}`;
    const p = `${c.bold}${provider.padEnd(15)}${c.reset}`;
    const isOk = status === 200 || status === "200";
    const stat = status !== undefined ? `${isOk ? c.green : c.red}[${status}]${c.reset} ` : "";
    const dur = durationMs !== undefined ? `${c.dim}${durationMs.toFixed(0).padStart(5)}ms${c.reset}` : "";
    console.log(`${this.time()} ${tag} ${p} -> ${target.padEnd(16)} ${stat}${dur}`);
  }

  public info(msg: string): void {
    if (this.isClean || !this.isVerbose) return;
    const tag = `${c.dim}[INFO]    ${c.reset}`;
    console.log(`${this.time()} ${tag} ${msg}`);
  }

  public error(msg: string, err?: unknown): void {
    if (this.isClean) return;
    const tag = `${c.red}${c.bold}[ERROR]   ${c.reset}`;
    console.error(`${this.time()} ${tag} ${c.red}${msg}${c.reset}`, err ?? "");
  }
}

export const logger = new Logger();
export default Logger;
