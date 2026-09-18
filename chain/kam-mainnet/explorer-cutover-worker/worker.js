const ORIGIN_HOST = "explorer-new.kriptoaman.com";
const PUBLIC_HOST = "explorer.kriptoaman.com";

export default {
  async fetch(request) {
    const upstreamUrl = new URL(request.url);
    upstreamUrl.protocol = "https:";
    upstreamUrl.hostname = ORIGIN_HOST;
    upstreamUrl.port = "";

    const headers = new Headers(request.headers);
    headers.set("x-forwarded-host", PUBLIC_HOST);
    headers.set("x-forwarded-proto", "https");

    const init = {
      method: request.method,
      headers,
      redirect: "manual",
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = request.body;
    }

    const upstreamResponse = await fetch(new Request(upstreamUrl.toString(), init));
    const responseHeaders = new Headers(upstreamResponse.headers);

    const location = responseHeaders.get("location");
    if (location) {
      try {
        const redirectUrl = new URL(location, upstreamUrl);
        if (redirectUrl.hostname === ORIGIN_HOST) {
          redirectUrl.hostname = PUBLIC_HOST;
          responseHeaders.set("location", redirectUrl.toString());
        }
      } catch {
        // Preserve non-URL Location values unchanged.
      }
    }

    responseHeaders.set("x-kam-explorer-cutover", "explorer-new");
    responseHeaders.set("x-kam-explorer-origin", ORIGIN_HOST);

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  },
};
