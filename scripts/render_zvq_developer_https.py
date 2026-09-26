"""Render exact GET-only ZVQ Developer Center routes onto the *existing* TLS listener.

Never modifies the independent IP fallback, JSON-RPC gateway, or Blockscout.
The reviewed static pages are served only by a separate loopback-only
Developer sidecar in the existing TLS network namespace; never trust legacy
port-80 Developer routes or overwrite the ZEVARYQ homepage.
"""
from __future__ import annotations
import sys
from pathlib import Path

DOMAIN_MARKER = "# ZVQ_DOMAIN_TLS_V1"
RPC_MARKER = "# ZVQ_DOMAIN_RPC_V2_READONLY"
MARKER = "# ZVQ_DEVELOPER_HTTPS_V1"
RATE_ZONE = "limit_req_zone $binary_remote_addr zone=zvq_developer:1m rate=5r/s;"
CATCHALL = "location / { return 404; }"
PAGES = (
    "/developer",
    "/developers",
    "/developer/docs",
    "/developer/examples",
    "/developer/verify",
    "/developer/starter",
    "/developer/network.json",
)


def render(source: str) -> str:
    if MARKER in source or RATE_ZONE in source:
        raise ValueError("Developer HTTPS already applied; refusing a second patch")
    if (source.count(DOMAIN_MARKER) != 1 or source.count(RPC_MARKER) != 1
            or source.count("server {") != 2):
        raise ValueError("Expected exactly one previously reviewed domain RPC listener")
    ip, domain = source.split(DOMAIN_MARKER, 1)
    if (ip.count("server_name 146.190.93.254;") != 1
            or domain.count("server_name explorer.kriptoaman.com;") != 1
            or ip.count(CATCHALL) != 1 or domain.count(CATCHALL) != 1
            or ip.count("location = /rpc { return 403; }") != 1
            or domain.count("location = /rpc {") != 1
            or "proxy_pass http://127.0.0.1:18446/;" not in domain
            or "location ^~ /api/ { return 403; }" not in ip
            or "location ^~ /api/ { return 403; }" not in domain):
        raise ValueError("Unrecognized existing TLS/RPC security boundary")

    for path in PAGES:
        if ("location = " + path + " {") in domain:
            raise ValueError("Conflicting Developer route: " + path)

    routes = [f"    {MARKER}"]
    for path in PAGES:
        routes.append(f"""    location = {path} {{
        limit_except GET {{ deny all; }}
        limit_req zone=zvq_developer burst=12 nodelay;
        limit_req_status 429;
        client_max_body_size 1024;
        proxy_pass http://127.0.0.1:18447;
        proxy_set_header Host 127.0.0.1;
        proxy_set_header Authorization "";
        proxy_set_header Cookie "";
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_connect_timeout 3s;
        proxy_read_timeout 5s;
        proxy_next_upstream off;
        proxy_hide_header Set-Cookie;
        add_header Cache-Control "no-store" always;
        add_header X-Content-Type-Options "nosniff" always;
    }}""")
    # The independent IP block is byte-for-byte unchanged; zone is scoped to
    # the existing HTTP context immediately before the domain SNI listener.
    domain = domain.replace('server {', RATE_ZONE + '\\nserver {', 1)
    patched_domain = domain.replace(CATCHALL, "\n".join(routes) + "\n    " + CATCHALL, 1)
    rendered = ip + DOMAIN_MARKER + patched_domain
    old_ip, new_domain = rendered.split(DOMAIN_MARKER, 1)
    if (old_ip != ip or new_domain.count(MARKER) != 1
            or new_domain.count(RATE_ZONE) != 1
            or new_domain.count("proxy_pass http://127.0.0.1:18446/;") != 1
            or rendered.count("location = /rpc { return 403; }") != 1):
        raise ValueError("Route isolation check failed")
    return rendered


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: render_zvq_developer_https.py existing.conf candidate.conf")
    Path(sys.argv[2]).write_text(render(Path(sys.argv[1]).read_text()))
