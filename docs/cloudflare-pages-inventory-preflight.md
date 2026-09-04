# Cloudflare Pages inventory preflight

The Cloudflare Pages deployment inventory workflow now performs a read-only project visibility preflight before querying deployments. It lists Pages projects visible to the configured Account ID/API token pair, verifies the `kriptoaman` project exists, captures HTTP status codes, and prints only Cloudflare error metadata on failure. It never issues DELETE requests.
