#!/usr/bin/env python3
"""Bounded read-only Developer Center and RPC availability diagnostic.

Public probes run on GitHub-hosted PR checks. Protected port-80 and direct
origin checks run on the existing Explorer runner only after reviewed merge.
No NGINX reload, DNS changes, secrets, or chain write methods.
"""
import argparse
import json
import subprocess

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


def report(scope):
    result = {}
    for path in PAGES:
        status, body = get(path, scope)
        result[path] = {"http": status, "zvq_content": status == "200" and valid(path, body)}
    print(json.dumps({"scope": scope, "routes": result}, sort_keys=True), flush=True)
    return result


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--scope", choices=("public", "backend", "origin", "fallback"),
                   default="public")
    p.add_argument("--require-ready", action="store_true")
    args = p.parse_args()
    actual = report(args.scope)
    if args.require_ready and not all(x["zvq_content"] for x in actual.values()):
        raise SystemExit("Developer pages not ready at requested read-only scope")
