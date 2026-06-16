import type { ProxyConfig } from "@/lib/validations/maps";

/**
 * Convert the per-job proxy config into Playwright's launch `proxy` option.
 * A single entry is enough for rotating residential networks — the provider's
 * gateway rotates the egress IP per connection.
 */
export function toPlaywrightProxy(
  proxy?: ProxyConfig | null
): { server: string; username?: string; password?: string } | undefined {
  if (!proxy?.enabled || !proxy.server) return undefined;

  // Playwright wants a bare scheme://host:port; normalize a missing scheme.
  const server = /^\w+:\/\//.test(proxy.server) ? proxy.server : `http://${proxy.server}`;

  return {
    server,
    ...(proxy.username ? { username: proxy.username } : {}),
    ...(proxy.password ? { password: proxy.password } : {}),
  };
}
