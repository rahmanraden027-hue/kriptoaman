import { connect } from "cloudflare:sockets";

export default {
  async fetch() {
    let socket;
    try {
      socket = connect(
        { hostname: "146.190.93.254", port: 80 },
        { allowHalfOpen: true }
      );

      const writer = socket.writable.getWriter();
      await writer.write(new TextEncoder().encode(
        "GET /api/v2/blocks HTTP/1.1\r\n" +
        "Host: 146.190.93.254\r\n" +
        "Accept: application/json\r\n" +
        "Accept-Encoding: identity\r\n" +
        "Connection: close\r\n\r\n"
      ));
      writer.releaseLock();

      const reader = socket.readable.getReader();
      const timeout = new Promise(resolve =>
        setTimeout(() => resolve({ timeout: true }), 5000)
      );
      const first = await Promise.race([reader.read(), timeout]);

      if (first?.timeout) {
        socket.close();
        return Response.json({ socket_ok: true, read_timeout: true });
      }

      const prefix = first?.value
        ? new TextDecoder().decode(first.value).slice(0, 1500)
        : "";

      socket.close();
      return Response.json({
        socket_ok: true,
        done: !!first?.done,
        bytes: first?.value?.byteLength || 0,
        prefix,
      });
    } catch (e) {
      try { socket?.close(); } catch {}
      return Response.json({
        socket_ok: false,
        error: String(e),
        name: e?.name || null,
      });
    }
  }
};
