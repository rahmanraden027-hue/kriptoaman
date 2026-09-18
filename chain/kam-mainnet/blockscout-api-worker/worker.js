const ORIGIN = "http://blockscout-origin.kriptoaman.com";

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (!url.pathname.startsWith("/api/v2/")) {
      return new Response("Not found", { status: 404 });
    }

    const upstream = new URL(url.pathname + url.search, ORIGIN);
    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.set("x-forwarded-host", url.host);
    headers.set("x-forwarded-proto", "https");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    try {
      const init = {
        method: request.method,
        headers,
        redirect: "manual",
        signal: controller.signal,
      };

      if (request.method !== "GET" && request.method !== "HEAD") {
        init.body = request.body;
      }

      const response = await fetch(upstream.toString(), init);
      const out = new Headers(response.headers);
      out.set("x-kam-blockscout-origin", "blockscout-01");
      out.set("x-kam-blockscout-edge", "api-v2");
      out.set("cache-control", "no-store");
      out.set("x-content-type-options", "nosniff");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: out,
      });
    } catch (error) {
      const timedOut = error && error.name === "AbortError";
      return new Response(
        JSON.stringify({ error: timedOut ? "upstream_timeout" : "upstream_unavailable" }),
        {
          status: 503,
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
            "x-kam-blockscout-origin": "blockscout-01",
            "x-kam-blockscout-edge": "api-v2",
            "x-content-type-options": "nosniff",
          },
        },
      );
    } finally {
      clearTimeout(timer);
    }
  },
};
