import { parseIP } from "./ipParser";

const samples = [
    "127.0.0.1",
    "192.168.1.1",
    "8.8.8.8",
    "255.255.255.255",
    "0.0.0.0",
    "169.254.1.1",
    "1.2.3.4:8080",
    "::1",
    "fe80::1",
    "2607:f8b0:4005:805::200e",
    "::ffff:192.168.1.1",
    "invalid.ip",
];

// Warmup
for (let i = 0; i < 50_000; i++) {
    for (const ip of samples) parseIP(ip);
}

const ITERATIONS = 200_000;
const totalCalls = ITERATIONS * samples.length;

const start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    for (const ip of samples) parseIP(ip);
}
const elapsedMs = performance.now() - start;
const opsPerSec = (totalCalls / (elapsedMs / 1000)).toLocaleString(undefined, { maximumFractionDigits: 0 });

console.log(`\n⚡ Benchmark Results:`);
console.log(`- Samples       : ${samples.length} patterns`);
console.log(`- Total calls   : ${totalCalls.toLocaleString()}`);
console.log(`- Time elapsed  : ${elapsedMs.toFixed(2)}ms`);
console.log(`- Throughput    : ${opsPerSec} ops/sec\n`);
