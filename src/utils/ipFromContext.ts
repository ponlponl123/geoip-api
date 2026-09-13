import type { Context } from "hono";
import { getConnInfo } from "hono/bun";

export function ipFromContext(c: Context) {
    let remote: string | undefined;
    try {
        remote = getConnInfo(c)?.remote?.address;
    } catch {}

    return remote ??
        c.req.header("cf-connecting-ip") ??
        c.req.header("x-forwarded-for") ??
        c.req.header("true-client-ip") ??
        c.req.header("x-real-ip") ??
        c.req.header("remote-addr") ??
        c.req.header("x-client-ip") ??
        c.req.header("x-forwarded") ??
        c.req.header("forwarded") ??
        c.req.header("x-cluster-client-ip") ??
        c.req.header("WL-Proxy-Client-IP") ??
        c.req.header("HTTP_X_FORWARDED_FOR") ??
        c.req.header("HTTP_CLIENT_IP") ??
        c.req.header("HTTP_X_FORWARDED") ??
        c.req.header("HTTP_FORWARDED") ??
        c.req.header("HTTP_X_CLUSTER_CLIENT_IP") ??
        c.req.header("HTTP_WL_PROXY_CLIENT_IP") ??
        null;
}