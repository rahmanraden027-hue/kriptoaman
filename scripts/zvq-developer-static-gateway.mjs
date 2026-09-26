// Exact, dependency-free GET-only ZVQ Developer static gateway.
// Lives on TLS container loopback; no public port, keys, RPC or admin methods.
import http from 'node:http';
import { open } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

export const ROUTES = Object.freeze({
  '/developer': ['developer.html', 'text/html; charset=utf-8'],
  '/developers': ['developer.html', 'text/html; charset=utf-8'],
  '/developer/docs': ['developer-docs.html', 'text/html; charset=utf-8'],
  '/developer/examples': ['developer-examples.html', 'text/html; charset=utf-8'],
  '/developer/verify': ['developer-verify.html', 'text/html; charset=utf-8'],
  '/developer/starter': ['developer-starter.html', 'text/html; charset=utf-8'],
  '/developer/network.json': ['developer-network.json', 'application/json; charset=utf-8'],
});
const MAX_FILE_BYTES = 1024 * 1024;

export function createDeveloperGateway({ root = '/public' } = {}) {
  const server = http.createServer(async (req, res) => {
    const respond = (code, body = '', contentType = 'text/plain; charset=utf-8') => {
      if (res.headersSent) return res.end();
      const bytes = Buffer.isBuffer(body) ? body : Buffer.from(body);
      res.writeHead(code, {
        'Content-Type': contentType,
        'Content-Length': String(req.method === 'HEAD' ? 0 : bytes.length),
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer',
      });
      return res.end(req.method === 'HEAD' ? undefined : bytes);
    };
    // Exact allowlist. Malformed/encoded paths, doubled slashes and route
    // suffixes never resolve to a generic directory, homepage or proxy.
    const [path] = String(req.url ?? '').split('?', 1);
    if (!Object.hasOwn(ROUTES, path)) return respond(404);
    if (req.method !== 'GET' && req.method !== 'HEAD') return respond(405);
    try {
      const [file, contentType] = ROUTES[path];
      const location = join(root, file);
      // Open once, then validate/read through the SAME file descriptor.
      // Separate stat(path) + readFile(path) permits a TOCTOU substitution.
      const handle = await open(location, 'r');
      try {
        const info = await handle.stat();
        if (!info.isFile() || info.size > MAX_FILE_BYTES) return respond(503);
        return respond(200, await handle.readFile(), contentType);
      } finally {
        await handle.close();
      }
    } catch {
      return respond(503);
    }
  });
  server.maxConnections = 48;
  server.requestTimeout = 12_000;
  server.headersTimeout = 5_000;
  server.keepAliveTimeout = 3_000;
  return server;
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const port = Number(process.env.ZVQ_DEV_GATEWAY_PORT ?? 18447);
  if (port !== 18447 || process.env.ZVQ_DEV_GATEWAY_ROOT !== '/public') {
    throw new Error('Developer gateway requires reviewed loopback port and read-only static mount');
  }
  createDeveloperGateway({ root: '/public' }).listen(port, '127.0.0.1', () => {
    console.log('zvq_developer_gateway=loopback_ready');
  });
}
