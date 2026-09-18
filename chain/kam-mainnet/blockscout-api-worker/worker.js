import { connect } from "cloudflare:sockets";

const ORIGIN_IP = "146.190.93.254";
const ORIGIN_PORT = 80;
const MAX_RESPONSE_BYTES = 16 * 1024 * 1024;

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
    if (bytes[pos] !== 13 || bytes[pos + 1] !== 10) {
      throw new Error("Invalid chunk terminator");
    }
    pos += 2;
  }

  return concatChunks(chunks, total);
}

async function originRequest(request) {
  let socket;
  try {
    const url = new URL(request.url);
    socket = connect(
      { hostname: ORIGIN_IP, port: ORIGIN_PORT },
      { allowHalfOpen: true }
    );

    const headers = new Headers();
    headers.set("Host", ORIGIN_IP);
    headers.set("Accept", request.headers.get("accept") || "application/json");
    headers.set("Accept-Encoding", "identity");
    headers.set("Connection", "close");
    headers.set("User-Agent", "KAM-Blockscout-Edge/1.0");

    for (const name of ["content-type", "authorization", "x-api-key"]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }

    let body = new Uint8Array();
    if (request.method !== "GET" && request.method !== "HEAD") {
      body = new Uint8Array(await request.arrayBuffer());
      headers.set("Content-Length", String(body.byteLength));
    }

    let head = `${request.method} ${url.pathname}${url.search} HTTP/1.1\r\n`;
    for (const [name, value] of headers) head += `${name}: ${value}\r\n`;
    head += "\r\n";

    const writer = socket.writable.getWriter();
    await writer.write(new TextEncoder().encode(head));
    if (body.byteLength) await writer.write(body);
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
    const match = /^HTTP\/\d\.\d\s+(\d{3})(?:\s+(.*))?$/.exec(lines.shift() || "");
    if (!match) throw new Error("Invalid origin status line");

    const status = Number(match[1]);
    const responseHeaders = new Headers();

    for (const line of lines) {
      const idx = line.indexOf(":");
      if (idx <= 0) continue;
      responseHeaders.append(line.slice(0, idx).trim(), line.slice(idx + 1).trim());
    }

    let responseBody = raw.slice(headerEnd + 4);
    if ((responseHeaders.get("transfer-encoding") || "").toLowerCase().includes("chunked")) {
      responseBody = decodeChunked(responseBody);
    }

    responseHeaders.delete("connection");
    responseHeaders.delete("transfer-encoding");
    responseHeaders.delete("content-length");
    responseHeaders.set("cache-control", "no-store");
    responseHeaders.set("x-kam-blockscout-origin", "blockscout-01");
    responseHeaders.set("x-kam-blockscout-edge", "api-v2");
    responseHeaders.set("x-kam-blockscout-transport", "tcp-socket");

    try { socket.close(); } catch {}

    return new Response(request.method === "HEAD" ? null : responseBody, {
      status,
      headers: responseHeaders,
    });
  } catch (error) {
    try { socket?.close(); } catch {}
    throw error;
  }
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (!url.pathname.startsWith("/api/v2/")) {
      return new Response("Not found", { status: 404 });
    }

    try {
      return await originRequest(request);
    } catch (error) {
      return Response.json(
        { error: "Blockscout origin unavailable", detail: String(error) },
        {
          status: 502,
          headers: {
            "cache-control": "no-store",
            "x-kam-blockscout-edge": "api-v2",
            "x-kam-blockscout-transport": "tcp-socket",
          },
        }
      );
    }
  },
};
