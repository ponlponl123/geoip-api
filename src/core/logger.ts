import betterConsole, {
  tsflag,
  s,
  Card,
  rgb,
  type Color,
} from "ts-better-console";

export class Logger {
  private readonly isClean: boolean;
  private readonly isVerbose: boolean;
  private readonly modes: Set<string>;

  constructor() {
    const raw = ((typeof process !== "undefined" ? process.env.LOGGING : Bun.env.LOGGING) || "clean").toLowerCase();
    const list = raw.split(",").map((item: string) => item.trim());
    const hasEnv = typeof process !== "undefined" ? Boolean(process.env.LOGGING) : Boolean(Bun.env.LOGGING);
    this.isClean = list.includes("clean") || list.includes("none") || !hasEnv;
    this.isVerbose = !this.isClean && list.includes("verbose");
    this.modes = new Set(list);
  }

  private isEnabled(type: string): boolean {
    if (this.isClean) return false;
    if (this.isVerbose) return true;
    return this.modes.has(type);
  }

  public trafficPending(method: string, path: string, from?: string): void {
    if (!this.isEnabled("traffic")) return;
    const mColor: Color = method === "GET" ? "green" : method === "POST" ? "yellow" : "magenta";
    const m = s(method.padEnd(5), { color: mColor, styles: ["bold"] });
    const p = path.padEnd(20);
    const st = s("PENDING", { color: "yellow", styles: ["bold"] });
    const f = from ? s(` (${from})`, { color: "gray" }) : "";

    betterConsole.log(tsflag("info", true, `${m} ${p}${f} ${st}`));
  }

  public traffic(method: string, path: string, status: number, durationMs: number, from?: string): void {
    if (!this.isEnabled("traffic")) return;
    const mColor: Color = method === "GET" ? "green" : method === "POST" ? "yellow" : "magenta";
    const sColor: Color = status < 300 ? "green" : status < 500 ? "yellow" : "red";

    const m = s(method.padEnd(5), { color: mColor, styles: ["bold"] });
    const p = path.padEnd(20);
    const st = s(String(status).padEnd(4), { color: sColor });
    const dur = s(`${durationMs.toFixed(1).padStart(7)}ms`, { color: "gray" });
    const f = from ? s(` (${from})`, { color: "gray" }) : "";

    betterConsole.log(tsflag("info", true, `${m} ${p}${f} ${st} ${dur}`));
  }

  public cache(action: "HIT" | "MISS" | "SET" | "ERROR", key: string, extra?: string): void {
    if (!this.isEnabled("cache")) return;
    const aColor: Color = action === "HIT" ? "green" : action === "SET" ? "cyan" : action === "MISS" ? "yellow" : "red";
    const act = s(action.padEnd(5), { color: aColor, styles: ["bold"] });
    const detail = extra ? s(` (${extra})`, { color: "gray" }) : "";
    const prefix = s("[CACHE]", { color: "magenta" });

    betterConsole.log(tsflag("info", true, `${prefix} ${act} ${key}${detail}`));
  }

  public outgoing(provider: string, target: string, durationMs?: number, status?: number | string): void {
    if (!this.isEnabled("outgoing") && !this.isEnabled("outgoing request")) return;
    const prefix = s("[OUTGOING]", { color: "blue" });
    const p = s(provider.padEnd(15), { styles: ["bold"] });
    const isOk = status === 200 || status === "200";
    const stat = status !== undefined ? s(`[${status}] `, { color: isOk ? "green" : "red" }) : "";
    const dur = durationMs !== undefined ? s(`${durationMs.toFixed(0).padStart(5)}ms`, { color: "gray" }) : "";

    betterConsole.log(tsflag("info", true, `${prefix} ${p} -> ${target.padEnd(16)} ${stat}${dur}`));
  }

  public info(msg: string): void {
    if (this.isClean || !this.isVerbose) return;
    betterConsole.log(tsflag("info", true, msg));
  }

  public warn(msg: string): void {
    if (this.isClean) return;
    betterConsole.warn(tsflag("warn", true, s(msg, { color: "yellow" })));
  }

  public error(msg: string, err?: unknown): void {
    if (this.isClean) return;
    betterConsole.error(tsflag("error", true, s(msg, { color: "red" })), err ?? "");
  }

  public card(content: string, color = rgb(59, 130, 246)): void {
    new Card(content, undefined, {
      border: {
        style: { color },
        symbols: { style: "round" },
      },
    })
      .render()
      .split("\n")
      .forEach((line) => betterConsole.log(line));
  }
}

export const logger = new Logger();
export default Logger;
