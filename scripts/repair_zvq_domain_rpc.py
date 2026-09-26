#!/usr/bin/env python3
"""Manually gated, rollback-safe domain-only ZVQ Explorer /rpc repair.

Never edits Cloudflare, DNS, validators, the genesis chain or the independent
IP-fallback listener. Preview is the default; --apply requires a CI run ID.
"""
from __future__ import annotations
import argparse
import ipaddress
import json
import os
import re
import shutil
import socket
import subprocess
import sys
import time
from pathlib import Path

from render_zvq_domain_rpc import render

BASE = Path("/var/lib/zvq-origin-ip-tls")
CONFIG = BASE / "default.conf"
CONTAINER = "zvq-origin-ip-tls"
DOMAIN = "explorer.kriptoaman.com"
RPC = "rpc.kriptoaman.com"
IP = "146.190.93.254"
REQUEST = json.dumps({
    "jsonrpc": "2.0", "id": "zvq-domain-rpc-cutover", "method": "eth_chainId", "params": []
})
BLOCKED_METHODS = (
    "eth_sendRawTransaction", "personal_listAccounts", "admin_peers",
    "debug_traceTransaction", "txpool_content", "qbft_getValidatorsByBlockNumber",
)


def cmd(argv: list[str], *, capture: bool = False) -> str:
    result = subprocess.run(
        argv, text=True, check=True,
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.PIPE if capture else None,
    )
    return result.stdout.strip() if capture else ""


def rpc_probe(url: str, *, resolve: bool = False) -> bool:
    args = ["curl", "--noproxy", "*", "-fsS", "--max-time", "12",
            "-H", "Content-Type: application/json", "--data", REQUEST]
    if resolve:
        args += ["--resolve", f"{DOMAIN}:443:{IP}"]
    try:
        result = json.loads(cmd(args + [url], capture=True))
        return result.get("result") == "0x560c"
    except (subprocess.CalledProcessError, ValueError):
        return False


def rpc_status(url: str, method: str) -> str:
    payload = json.dumps({"jsonrpc": "2.0", "id": "zvq-policy-check", "method": method, "params": []})
    return cmd(["curl", "--noproxy", "*", "-sS", "--max-time", "12",
                "-o", "/dev/null", "-w", "%{http_code}",
                "-H", "Content-Type: application/json", "--data", payload, url], capture=True)


def status(url: str) -> str:
    return cmd(["curl", "--noproxy", "*", "-sS", "--max-time", "12",
                "-o", "/dev/null", "-w", "%{http_code}", url], capture=True)


def check_preconditions() -> str:
    if os.geteuid() != 0:
        raise RuntimeError("Root authorization required; no changes made")
    if cmd(["docker", "inspect", "-f", "{{.State.Status}}", CONTAINER], capture=True) != "running":
        raise RuntimeError("Independent TLS container is not running")
    if not CONFIG.is_file():
        raise RuntimeError("Expected mounted domain+IP config unavailable")
    cert = Path("/etc/letsencrypt/live/zvq-explorer-domain/fullchain.pem")
    key = Path("/etc/letsencrypt/live/zvq-explorer-domain/privkey.pem")
    if not (cert.is_file() and key.is_file()):
        raise RuntimeError("Domain certificate or key missing")
    cmd(["openssl", "x509", "-in", str(cert), "-noout", "-checkend", "172800"])
    if not rpc_probe(f"https://{RPC}/"):
        raise RuntimeError("Canonical RPC chain identity unavailable; refuse routing")
    for method in BLOCKED_METHODS:
        if rpc_status(f"https://{RPC}/", method) != "403":
            raise RuntimeError(f"Canonical RPC allowlist failed for {method}; refuse routing")
    ips = {ipaddress.ip_address(row[4][0]) for row in socket.getaddrinfo(RPC, 443)}
    if not ips or ipaddress.ip_address(IP) in ips or any(ip.is_loopback for ip in ips):
        raise RuntimeError("Canonical upstream resolves to Explorer origin/loopback")
    if status(f"https://{IP}/rpc") != "403":
        raise RuntimeError("IP fallback /rpc must already be denied")
    return cmd(["docker", "inspect", "-f", "{{.Config.Image}}", CONTAINER], capture=True)


def verify_local() -> bool:
    return (
        rpc_probe(f"https://{DOMAIN}/rpc", resolve=True)
        and status(f"https://{IP}/rpc") == "403"
        and status(f"https://{IP}/api/admin") == "403"
        and status(f"https://{DOMAIN}/") == "200"
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Requires ZVQ_RPC_RUN_ID and manual approval")
    args = parser.parse_args()
    run_id = os.getenv("ZVQ_RPC_RUN_ID", "")
    if args.apply and not re.fullmatch(r"[0-9]{7,16}", run_id):
        raise RuntimeError("Explicit authorized GitHub run ID required for --apply")
    image = check_preconditions()
    before = CONFIG.read_bytes()
    candidate_text = render(before.decode("utf-8"))
    suffix = run_id or "preview"
    candidate = BASE / f"candidate-domain-rpc-{suffix}.conf"
    backup = BASE / f"default.conf.domain-rpc-{suffix}.bak"
    if candidate.exists() or backup.exists():
        raise RuntimeError("Refusing to overwrite an existing candidate or backup")
    candidate.write_text(candidate_text)
    candidate.chmod(0o600)
    # Validate isolated candidate in the already installed NGINX image.
    # No container reload, proxy edit or firewall change during preview.
    try:
        cmd(["docker", "run", "--rm", "--network", "host",
             "--read-only", "--tmpfs", "/var/cache/nginx", "--tmpfs", "/var/run",
             "--tmpfs", "/tmp", "--mount",
             f"type=bind,src={candidate},dst=/etc/nginx/conf.d/default.conf,readonly",
             "--mount", "type=bind,src=/etc/letsencrypt,dst=/etc/letsencrypt,readonly",
             image, "nginx", "-t"])
        if not args.apply:
            print(json.dumps({"preview": "syntax-pass", "domain_only": True,
                              "ip_fallback_rpc": "still-denied", "applied": False}))
            return
        shutil.copy2(CONFIG, backup)
        modified = False
        committed = False
        try:
            CONFIG.write_bytes(candidate_text.encode("utf-8"))  # preserve bind-mounted inode
            modified = True
            cmd(["docker", "exec", CONTAINER, "nginx", "-t"])
            loaded = cmd(["docker", "exec", CONTAINER, "nginx", "-T"], capture=True)
            if "# ZVQ_DOMAIN_RPC_V2_READONLY" not in loaded or "server_name explorer.kriptoaman.com;" not in loaded:
                raise RuntimeError("Active container did not load reviewed domain route")
            cmd(["docker", "exec", CONTAINER, "nginx", "-s", "reload"])
            ok = False
            for _ in range(12):
                time.sleep(1)
                if verify_local():
                    ok = True
                    break
            if not ok:
                raise RuntimeError("Direct origin domain RPC/independent IP fallback verification failed")
            if not rpc_probe(f"https://{DOMAIN}/rpc"):
                raise RuntimeError("Public-domain browser RPC verification failed")
            committed = True
            print(json.dumps({"applied": True, "domain_rpc": "0x560c",
                              "ip_fallback_rpc": "403", "backup": str(backup)}))
        finally:
            if modified and not committed:
                print("Domain RPC verification failed; restoring original config", file=sys.stderr)
                CONFIG.write_bytes(before)
                cmd(["docker", "exec", CONTAINER, "nginx", "-t"])
                cmd(["docker", "exec", CONTAINER, "nginx", "-s", "reload"])
                if status(f"https://{IP}/rpc") != "403":
                    raise RuntimeError("Emergency: IP fallback /rpc deny must be restored")
                print("Rollback completed", file=sys.stderr)
    finally:
        candidate.unlink(missing_ok=True)


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, OSError, subprocess.CalledProcessError, UnicodeError, ValueError) as exc:
        print(f"ZVQ domain RPC repair stopped: {exc}", file=sys.stderr)
        sys.exit(1)
