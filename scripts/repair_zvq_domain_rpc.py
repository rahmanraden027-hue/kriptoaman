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
GATEWAY = "zvq-explorer-rpc-allowlist-gateway"
GATEWAY_SOURCE = Path(__file__).with_name("zvq-rpc-allowlist-gateway.mjs")
GATEWAY_INSTALLED = BASE / "explorer-rpc-gateway.mjs"
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


def rpc_status(url: str, method: str, *, resolve: bool = False) -> str:
    payload = json.dumps({"jsonrpc": "2.0", "id": "zvq-policy-check", "method": method, "params": []})
    args = ["curl", "--noproxy", "*", "-sS", "--max-time", "12",
            "-o", "/dev/null", "-w", "%{http_code}",
            "-H", "Content-Type: application/json", "--data", payload]
    if resolve:
        args += ["--resolve", f"{DOMAIN}:443:{IP}"]
    return cmd(args + [url], capture=True)


def status(url: str, *, resolve: bool = False) -> str:
    args = ["curl", "--noproxy", "*", "-sS", "--max-time", "12",
            "-o", "/dev/null", "-w", "%{http_code}"]
    if resolve:
        args += ["--resolve", f"{DOMAIN}:443:{IP}"]
    return cmd(args + [url], capture=True)


def check_preconditions() -> str:
    if os.geteuid() != 0:
        raise RuntimeError("Root authorization required; no changes made")
    if cmd(["docker", "inspect", "-f", "{{.State.Status}}", CONTAINER], capture=True) != "running":
        raise RuntimeError("Independent TLS container is not running")
    if not CONFIG.is_file() or not GATEWAY_SOURCE.is_file():
        raise RuntimeError("Expected NGINX config or reviewed gateway source unavailable")
    cert = Path("/etc/letsencrypt/live/zvq-explorer-domain/fullchain.pem")
    key = Path("/etc/letsencrypt/live/zvq-explorer-domain/privkey.pem")
    if not (cert.is_file() and key.is_file()):
        raise RuntimeError("Domain certificate or key missing")
    cmd(["openssl", "x509", "-in", str(cert), "-noout", "-checkend", "172800"])
    if not rpc_probe(f"https://{RPC}/"):
        raise RuntimeError("Canonical RPC chain identity unavailable; refuse routing")
    ips = {ipaddress.ip_address(row[4][0]) for row in socket.getaddrinfo(RPC, 443)}
    if not ips or ipaddress.ip_address(IP) in ips or any(ip.is_loopback for ip in ips):
        raise RuntimeError("Canonical upstream resolves to Explorer origin/loopback")
    if status(f"https://{IP}/rpc") != "403":
        raise RuntimeError("IP fallback /rpc must already be denied")
    return cmd(["docker", "inspect", "-f", "{{.Config.Image}}", CONTAINER], capture=True)


def safe_http_status(probe, *args, **kwargs) -> str:
    """Emit bounded, credential-free evidence even if an individual curl fails."""
    try:
        return probe(*args, **kwargs)
    except subprocess.CalledProcessError as exc:
        return f"curl_exit_{exc.returncode}"
    except OSError:
        return "curl_execution_error"


def verify_local() -> bool:
    """Check all four direct-origin routes independently, never short-circuit."""
    results = {
        "domain_rpc": safe_http_status(
            rpc_status, f"https://{DOMAIN}/rpc", "eth_chainId", resolve=True),
        "ip_rpc": safe_http_status(status, f"https://{IP}/rpc"),
        "ip_api_admin": safe_http_status(status, f"https://{IP}/api/admin"),
        "origin_home": safe_http_status(status, f"https://{DOMAIN}/", resolve=True),
    }
    chain_valid = (results["domain_rpc"] == "200"
                   and rpc_probe(f"https://{DOMAIN}/rpc", resolve=True))
    print(json.dumps({"direct_origin_probes": results,
                      "domain_rpc_chain_22028": chain_valid}), flush=True)
    return (results == {"domain_rpc": "200", "ip_rpc": "403",
                        "ip_api_admin": "403", "origin_home": "200"}
            and chain_valid)


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
        if subprocess.run(["docker", "inspect", GATEWAY], stdout=subprocess.DEVNULL,
                          stderr=subprocess.DEVNULL).returncode == 0:
            raise RuntimeError("Explorer RPC gateway container already exists; refuse ambiguous ownership")
        shutil.copy2(CONFIG, backup)
        shutil.copy2(GATEWAY_SOURCE, GATEWAY_INSTALLED)
        GATEWAY_INSTALLED.chmod(0o644)
        gateway_started = False
        modified = False
        committed = False
        try:
            cmd(["docker", "run", "-d", "--name", GATEWAY, "--network", f"container:{CONTAINER}",
                 "--restart", "unless-stopped", "--read-only", "--user", "10001:10001",
                 "--cap-drop", "ALL", "--security-opt", "no-new-privileges",
                 "--memory", "128m", "--pids-limit", "64", "--tmpfs", "/tmp",
                 "--mount", f"type=bind,src={GATEWAY_INSTALLED},dst=/gateway.mjs,readonly",
                 "-e", "ZVQ_UPSTREAM_URL=https://rpc.kriptoaman.com/",
                 "-e", "ZVQ_GATEWAY_PORT=18446", "node:24-alpine", "node", "/gateway.mjs"])
            gateway_started = True
            for _ in range(10):
                time.sleep(1)
                if rpc_probe("http://127.0.0.1:18446/"):
                    break
            else:
                raise RuntimeError("Explorer loopback allowlist gateway did not become ready")
            for method in BLOCKED_METHODS:
                if rpc_status("http://127.0.0.1:18446/", method) != "403":
                    raise RuntimeError(f"Loopback allowlist failed for {method}")
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
            if not committed:
                print("Domain RPC verification failed; restoring original state", file=sys.stderr)
                if modified:
                    CONFIG.write_bytes(before)
                    cmd(["docker", "exec", CONTAINER, "nginx", "-t"])
                    cmd(["docker", "exec", CONTAINER, "nginx", "-s", "reload"])
                if gateway_started:
                    subprocess.run(["docker", "rm", "-f", GATEWAY], check=False)
                    GATEWAY_INSTALLED.unlink(missing_ok=True)
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
