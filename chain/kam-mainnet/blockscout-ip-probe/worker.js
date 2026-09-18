import { connect } from "cloudflare:sockets";

export default {
  async fetch() {
    try {
      const socket = connect({ hostname: "146.190.93.254", port: 80 }, { allowHalfOpen: true });
      const writer = socket.writable.getWriter();
      await writer.write(new TextEncoder().encode(
        "GET /api/v2/blocks HTTP/1.0\r\n" +
        "Host: 146.190.93.254\r\n" +
        "Accept: application/json\r\n" +
        "Connection: close\r\n\r\n"
      ));
      await writer.close();

      const raw = await new Response(socket.readable).text();
      return Response.json({
        socket_ok: true,
        prefix: raw.slice(0, 1000),
      });
    } catch (e) {
      return Response.json({
        socket_ok: false,
        error: String(e),
        name: e?.name || null,
      });
    }
  }
};
