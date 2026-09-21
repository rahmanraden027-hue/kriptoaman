import { connect } from "cloudflare:sockets";

const ORIGIN_IP = "146.190.93.254";
const ORIGIN_PORT = 80;
const PREFIX = "/zevaryq-assets/";
const MAX_RESPONSE_BYTES = 4 * 1024 * 1024;

function concatChunks(chunks, total) {
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

function findCrlf(bytes, start = 0) {
  for (let i = start; i + 1 < bytes.length; i++) {
    if (bytes[i] === 13 && bytes[i + 1] === 10) return i;
  }
  return -1;
}

function findHeaderEnd(bytes) {
  for (let i = 0; i + 3 < bytes.length; i++) {
    if (
      bytes[i] === 13 && bytes[i + 1] === 10 &&
      bytes[i + 2] === 13 && bytes[i + 3] === 10
    ) return i;
  }
  return -1;
}

function decodeChunked(bytes) {
  const chunks = [];
  let total = 0;
  let pos = 0;
  const decoder = new TextDecoder();

  while (pos < bytes.length) {
    const lineEnd = findCrlf(bytes, pos);
    if (lineEnd < 0) throw new Error("Invalid chunked response");
    const sizeText = decoder.decode(bytes.slice(pos, lineEnd)).split(";", 1)[0].trim();
    const size = Number.parseInt(sizeText, 16);
    if (!Number.isFinite(size)) throw new Error("Invalid chunk size");
    pos = lineEnd + 2;
    if (size === 0) break;
    if (pos + size > bytes.length) throw new Error("Truncated chunked response");
    const part = bytes.slice(pos, pos + size);
    chunks.push(part);
    total += part.byteLength;
    pos += size;
    if (bytes[pos] !== 13 || bytes[pos + 1] !== 10) throw new Error("Invalid chunk terminator");
    pos += 2;
  }

  return concatChunks(chunks, total);
}

async function fetchAsset(request) {
  let socket;
  try {
    const url = new URL(request.url);
    socket = connect({ hostname: ORIGIN_IP, port: ORIGIN_PORT }, { allowHalfOpen: true });

    let head = `${request.method} ${url.pathname}${url.search} HTTP/1.1\r\n`;
    head += `Host: ${ORIGIN_IP}\r\n`;
    head += `Accept: ${request.headers.get("accept") || "*/*"}\r\n`;
    head += "Accept-Encoding: identity\r\n";
    head += "Connection: close\r\n";
    head += "User-Agent: ZEVARYQ-Assets-Edge/1.0\r\n\r\n";

    const writer = socket.writable.getWriter();
    await writer.write(new TextEncoder().encode(head));
    writer.releaseLock();

    const reader = socket.readable.getReader();
    const chunks = [];
    let total = 0;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value?.byteLength) {
        total += value.byteLength;
        if (total > MAX_RESPONSE_BYTES) {
          socket.close();
          throw new Error("Origin response exceeds limit");
        }
        chunks.push(value);
      }
    }

    const raw = concatChunks(chunks, total);
    const headerEnd = findHeaderEnd(raw);
    if (headerEnd < 0) throw new Error("Origin returned invalid HTTP response");

    const decoder = new TextDecoder();
    const headerText = decoder.decode(raw.slice(0, headerEnd));
    const lines = headerText.split("\r\n");
    const statusMatch = /^HTTP\/\d\.\d\s+(\d{3})(?:\s+(.*))?$/.exec(lines.shift() || "");
    if (!statusMatch) throw new Error("Invalid origin status line");

    const status = Number(statusMatch[1]);
    const headers = new Headers();
    for (const line of lines) {
      const idx = line.indexOf(":");
      if (idx <= 0) continue;
      headers.append(line.slice(0, idx).trim(), line.slice(idx + 1).trim());
    }

    let body = raw.slice(headerEnd + 4);
    if ((headers.get("transfer-encoding") || "").toLowerCase().includes("chunked")) {
      body = decodeChunked(body);
    }

    headers.delete("connection");
    headers.delete("transfer-encoding");
    headers.delete("content-length");
    headers.set("cache-control", "public, max-age=14400, immutable");
    headers.set("x-zevaryq-asset-edge", "direct-origin");
    headers.set("x-content-type-options", "nosniff");

    try { socket.close(); } catch {}

    return new Response(request.method === "HEAD" ? null : body, { status, headers });
  } catch (error) {
    try { socket?.close(); } catch {}
    return new Response("ZEVARYQ asset origin unavailable", {
      status: 502,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
        "x-zevaryq-asset-edge": "error",
      },
    });
  }
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (!["GET", "HEAD"].includes(request.method)) {
      return new Response("Method not allowed", { status: 405 });
    }
    if (!url.pathname.startsWith(PREFIX)) {
      return new Response("Not found", { status: 404 });
    }
    return fetchAsset(request);
  },
};
