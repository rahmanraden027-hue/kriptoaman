"""Fail-closed, domain-SNI-only ZVQ Explorer browser RPC config renderer.

The independent IP fallback remains read-only, including its explicit /rpc deny.
Rendering is pure and never edits an installed NGINX configuration.
"""
from __future__ import annotations
import sys
from pathlib import Path

MARKER = "# ZVQ_DOMAIN_TLS_V1"
DENY = "location = /rpc { return 403; }"
SENTINEL = "# ZVQ_DOMAIN_RPC_V1"
RATE_ZONE = "limit_req_zone $binary_remote_addr zone=zvq_domain_rpc:1m rate=10r/s;"
DOMAIN_ROUTE = """location = /rpc {
    # Only the Explorer domain listener is changed; IP fallback still denies /rpc.
    # This proxies the existing public RPC, not a new private/admin endpoint.
    limit_except POST { deny all; }
    client_max_body_size 2048;
    limit_req zone=zvq_domain_rpc burst=20 nodelay;
    limit_req_status 429;
    proxy_pass https://rpc.kriptoaman.com/;
    proxy_ssl_server_name on;
    proxy_ssl_name rpc.kriptoaman.com;
    proxy_ssl_verify on;
    proxy_ssl_trusted_certificate /etc/ssl/certs/ca-certificates.crt;
    proxy_ssl_verify_depth 3;
    proxy_set_header Host rpc.kriptoaman.com;
    proxy_set_header Cookie "";
    proxy_set_header Authorization "";
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_connect_timeout 3s;
    proxy_send_timeout 8s;
    proxy_read_timeout 12s;
    proxy_next_upstream off;
    proxy_hide_header Set-Cookie;
    add_header Cache-Control "no-store" always;
}"""


def render(source: str) -> str:
    if SENTINEL in source or RATE_ZONE in source:
        raise ValueError("Already patched; refuse to change previously installed gateway")
    if source.count(MARKER) != 1 or source.count("server {") != 2:
        raise ValueError("Expected exactly one existing IP listener and one domain SNI listener")
    ip, domain = source.split(MARKER, 1)
    if (ip.count(DENY) != 1 or domain.count(DENY) != 1
            or ip.count("server_name 146.190.93.254;") != 1
            or domain.count("server_name explorer.kriptoaman.com;") != 1
            or "location ^~ /api/ { return 403; }" not in ip
            or "location ^~ /api/ { return 403; }" not in domain):
        raise ValueError("Unrecognized HTTPS routing: refuse to patch")
    patched_domain = domain.replace(DENY, DOMAIN_ROUTE, 1).replace(
        "standalone-domain-readonly", "standalone-domain-rpc-scoped", 1
    )
    output = SENTINEL + "\n" + RATE_ZONE + "\n" + ip + MARKER + patched_domain
    if output.count(DENY) != 1 or output.count(DOMAIN_ROUTE) != 1:
        raise ValueError("IP fallback and domain gateway isolation check failed")
    return output


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: render_zvq_domain_rpc.py existing.conf candidate.conf")
    Path(sys.argv[2]).write_text(render(Path(sys.argv[1]).read_text()))
