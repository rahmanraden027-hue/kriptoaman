export default {
  async fetch() {
    try {
      const r = await fetch("http://146.190.93.254/api/v2/blocks", {
        headers: { "accept": "application/json", "user-agent": "kam-blockscout-ip-probe/1.0" },
        redirect: "manual",
      });
      const body = await r.text();
      return Response.json({
        upstream_status: r.status,
        upstream_status_text: r.statusText,
        content_type: r.headers.get("content-type"),
        server: r.headers.get("server"),
        body_prefix: body.slice(0, 500),
      });
    } catch (e) {
      return Response.json({ error: String(e), name: e?.name || null }, { status: 200 });
    }
  }
};
