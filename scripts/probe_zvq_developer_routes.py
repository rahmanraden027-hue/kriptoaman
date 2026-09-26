#!/usr/bin/env python3
"""Bounded read-only Developer Center and RPC availability diagnostic.

Public probes run on GitHub-hosted PR checks. Protected port-80 and direct
origin checks run on the existing Explorer runner only after reviewed merge.
No NGINX reload, DNS changes, secrets, or chain write methods.
"""
import argparse
import json
import subprocess
from pathlib import Path

DOMAIN = "explorer.kriptoaman.com"
IP = "146.190.93.254"
PAGES = {
    "/developer": 'data-kam-developer-version="1.0.0"',
    "/developers": 'data-kam-developer-version="1.0.0"',
    "/developer/docs": 'data-kam-developer-docs-version="1.0.0"',
    "/developer/examples": 'data-kam-developer-examples-version="1.0.0"',
    "/developer/verify": 'data-kam-developer-verify-version="1.0.0"',
    "/developer/starter": 'data-kam-developer-starter-version="1.0.0"',
    "/developer/network.json": "",
}


def get(path, scope):
    if scope == "backend":
        url = "http://127.0.0.1:80" + path
        extra = ["-H", "Host: " + DOMAIN]
    elif scope == "origin":
        url = "https://" + DOMAIN + path
        extra = ["--resolve", f"{DOMAIN}:443:{IP}"]
    elif scope == "fallback":
        url = "https://" + IP + path
        extra = []
    elif scope == "public":
        url = "https://" + DOMAIN + path
        extra = []
    else:
        raise ValueError("unknown probe scope")
    try:
        p = subprocess.run(
            ["curl", "--noproxy", "*", "-sS", "--connect-timeout", "4",
             "--max-time", "12", "--max-filesize", "1048576",
             "-w", "\n%{http_code}", *extra, url],
            text=True, capture_output=True, timeout=15, check=False)
        if p.returncode != 0:
            return f"curl_exit_{p.returncode}", ""
        body, status = p.stdout.rsplit("\n", 1)
        return status, body
    except (OSError, subprocess.TimeoutExpired, ValueError):
        return "unavailable", ""


def valid(path, body):
    if path == "/developer/network.json":
        try:
            d = json.loads(body)
            return (d["chainId"] == 22028 and d["chainIdHex"] == "0x560c"
                    and d["nativeCurrency"]["symbol"] == "ZVQ"
                    and d["publicDeveloperAccess"] is True)
        except (ValueError, KeyError, TypeError):
            return False
    return PAGES[path] in body and "ZVQ" in body.upper()



BACKEND_DIR = Path("/opt/blockscout/docker-compose/proxy")
TLS_CONFIG = Path("/var/lib/zvq-origin-ip-tls/default.conf")
SOURCE_FILES = {
    "/developer": "developer.html",
    "/developers": "developer.html",
    "/developer/docs": "developer-docs.html",
    "/developer/examples": "developer-examples.html",
    "/developer/verify": "developer-verify.html",
    "/developer/starter": "developer-starter.html",
    "/developer/network.json": "developer-network.json",
}


def _safe_read(path):
    """Public static pages/config only. Never print their contents or read secrets."""
    try:
        if path.stat().st_size > 2_000_000:
            return ""
        return path.read_text(encoding="utf-8")
    except (OSError, UnicodeError):
        return ""


def inventory():
    """No writes: diagnose missing static assets, routes and HTML fallback separately."""
    page_files = {}
    for url, filename in SOURCE_FILES.items():
        source = BACKEND_DIR / "kam-dashboard" / filename
        body = _safe_read(source)
        page_files[url] = {
            "exists": source.is_file(),
            "reviewed_zvq_content": valid(url, body),
        }
    home = _safe_read(BACKEND_DIR / "kam-dashboard" / "index.html")
    template = _safe_read(BACKEND_DIR / "default.conf.template")
    tls = _safe_read(TLS_CONFIG)
    backend = {}
    for url in PAGES:
        http, body = get(url, "backend")
        backend[url] = {
            "http": http,
            "expected_marker": PAGES[url] in body if PAGES[url] else False,
            "zvq_content": http == "200" and valid(url, body),
            "explorer_home_fallback": "data-zevaryq-explorer-version" in body,
            "spa_fallback": '<div id="root"' in body or '<div id="app"' in body,
        }
    report = {
        "scope": "backend_inventory",
        "page_files": page_files,
        "protected_zvq_home_installed": "data-zevaryq-explorer-version" in home,
        "port80_template_exists": bool(template),
        "port80_developer_exact_routes": {
            path: ("location = " + path + " {") in template
            for path in SOURCE_FILES
        },
        "port80_legacy_v2_route_marker": "KAM_EXPLORER_V2_BEGIN" in template,
        "tls_config_exists": bool(tls),
        "tls_domain_rpc_preserved": (
            "ZVQ_DOMAIN_RPC_V2_READONLY" in tls
            and "proxy_pass http://127.0.0.1:18446/;" in tls
        ),
        "tls_developer_patch_present": "ZVQ_DEVELOPER_HTTPS_V1" in tls,
        "backend": backend,
    }
    print(json.dumps(report, sort_keys=True), flush=True)
    return report


def report(scope):
    result = {}
    for path in PAGES:
        status, body = get(path, scope)
        result[path] = {"http": status, "zvq_content": status == "200" and valid(path, body)}
    print(json.dumps({"scope": scope, "routes": result}, sort_keys=True), flush=True)
    return result


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--scope", choices=("public", "backend", "origin", "fallback", "inventory"),
                   default="public")
    p.add_argument("--require-ready", action="store_true")
    args = p.parse_args()
    actual = inventory() if args.scope == "inventory" else report(args.scope)
    if args.require_ready and not all(x["zvq_content"] for x in actual.values()):
        raise SystemExit("Developer pages not ready at requested read-only scope")
