#!/usr/bin/env python3
"""Manual, fail-closed ZVQ Developer-only static + origin TLS deployment.

Do not deploy or replace the protected ZEVARYQ homepage. Never touch DNS,
Cloudflare, genesis, validators, wallets, native balances or the RPC gateway.
A successful preview is mandatory before the reviewed manual apply workflow.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

from render_zvq_developer_https import render
from probe_zvq_developer_routes import PAGES, SOURCE_FILES, get, valid, report
from repair_zvq_domain_rpc import check_preconditions, rpc_probe, status

DOMAIN = "explorer.kriptoaman.com"
IP = "146.190.93.254"
PROXY = Path("/opt/blockscout/docker-compose/proxy")
TEMPLATE = PROXY / "default.conf.template"
DASHBOARD = PROXY / "kam-dashboard"
TLS = Path("/var/lib/zvq-origin-ip-tls/default.conf")
SOURCES = Path("explorer-dashboard")
BACKUP_ROOT = Path("/var/lib/zvq-developer-releases")
TLS_CONTAINER = "zvq-origin-ip-tls"
STARTER = "developer-starter.html"
MARKER = "# ZVQ_DEVELOPER_STARTER_V1"

# Explicit route only; no broad proxy pass, admin access or SPA fallback.
STARTER_ROUTE = """    # ZVQ_DEVELOPER_STARTER_V1
    location = /developer/starter {
        limit_except GET { deny all; }
        root /etc/nginx/templates;
        try_files /kam-dashboard/developer-starter.html =404;
        default_type text/html;
        add_header Cache-Control "no-store" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'self'" always;
    }
"""


def cmd(argv, *, cwd=None, capture=False):
    result = subprocess.run(
        argv, check=True, text=True, cwd=cwd,
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.PIPE if capture else None,
    )
    return result.stdout.strip() if capture else ""


def render_backend(template: str) -> str:
    if template.count("# KAM_EXPLORER_V2_BEGIN") != 1 or template.count(
        "# KAM_EXPLORER_V2_END"
    ) != 1:
        raise ValueError("Expected the existing bounded V2 static routes")
    for path in PAGES:
        count = template.count("location = " + path + " {")
        if count != (0 if path == "/developer/starter" else 1):
            raise ValueError(f"Unexpected existing backend route count: {path}={count}")
    if MARKER in template or "location = /developer/starter {" in template:
        raise ValueError("Starter route already exists; refuse to reapply")
    needle = "    # KAM_EXPLORER_V2_END\n"
    if template.count(needle) != 1:
        raise ValueError("V2 block end is not unique")
    # Only add the previously missing exact GET-only route. Never change root /.
    candidate = template.replace(needle, STARTER_ROUTE + needle, 1)
    if (candidate.count(MARKER) != 1
            or "data-zevaryq-explorer-version" in candidate):
        raise ValueError("Unexpected template mutation")
    return candidate


def check_sources():
    result = {}
    for path, filename in SOURCE_FILES.items():
        source = SOURCES / filename
        if not source.is_file() or source.stat().st_size > 2_000_000:
            raise RuntimeError(f"Reviewed Developer source missing/oversized: {filename}")
        body = source.read_text(encoding="utf-8")
        if not valid(path, body):
            raise RuntimeError(f"Reviewed ZVQ Developer marker invalid: {filename}")
        result[path] = filename
    logo = (SOURCES / "developer.html").read_text(encoding="utf-8")
    if "/zevaryq-assets/zevaryq-emblem.webp" not in logo:
        raise RuntimeError("Official ZVQ emblem is missing from Developer Center")
    network = json.loads((SOURCES / "developer-network.json").read_text())
    if network["nativeCurrency"]["symbol"] != "ZVQ" or network["chainId"] != 22028:
        raise RuntimeError("Only verified ZVQ Chain ID 22028 is accepted")
    return result


def preflight():
    if os.geteuid() != 0:
        raise RuntimeError("Authorized root runner required")
    if not TEMPLATE.is_file() or not TLS.is_file():
        raise RuntimeError("Known port-80 template or standalone TLS config missing")
    check_preconditions()  # Certificate, live gateway, canonical RPC and IP fallback.
    home = (DASHBOARD / "index.html").read_text(encoding="utf-8")
    if 'data-zevaryq-explorer-version' not in home:
        raise RuntimeError("Protected approved ZEVARYQ production homepage missing")
    sources = check_sources()
    backend_before = TEMPLATE.read_text(encoding="utf-8")
    tls_before = TLS.read_text(encoding="utf-8")
    backend_candidate = render_backend(backend_before)
    tls_candidate = render(tls_before)
    if (status(f"https://{IP}/rpc") != "403"
            or status(f"https://{IP}/api/admin") != "403"
            or not rpc_probe(f"https://{DOMAIN}/rpc", resolve=True)
            or not rpc_probe(f"https://{DOMAIN}/rpc")):
        raise RuntimeError("Live RPC or independent IP fallback baseline failed")
    # This repair must not modify the reviewed independent listener or /rpc route.
    marker = "# ZVQ_DOMAIN_TLS_V1"
    if tls_candidate.split(marker, 1)[0] != tls_before.split(marker, 1)[0]:
        raise RuntimeError("Independent IP listener changed in candidate")
    if (tls_candidate.count("proxy_pass http://127.0.0.1:18446/;") != 1
            or backend_candidate.count("location = /developer/starter {") != 1):
        raise RuntimeError("Backend/TLS isolation check failed")
    return sources, backend_before, backend_candidate, tls_before, tls_candidate


def validate_tls_candidate(candidate: str):
    image = cmd(
        ["docker", "inspect", "-f", "{{.Config.Image}}", TLS_CONTAINER],
        capture=True,
    )
    # Temporary candidate is readable only by root. NGINX -t never reloads prod.
    with tempfile.NamedTemporaryFile(
        mode="w", prefix=".zvq-dev-preview-", suffix=".conf",
        dir=TLS.parent, encoding="utf-8", delete=False,
    ) as f:
        path = Path(f.name)
        f.write(candidate)
    path.chmod(0o600)
    try:
        cmd([
            "docker", "run", "--rm", "--network", "none", "--read-only",
            "--tmpfs", "/var/cache/nginx", "--tmpfs", "/var/run",
            "--tmpfs", "/tmp",
            "--mount", f"type=bind,src={path},dst=/etc/nginx/conf.d/default.conf,readonly",
            "--mount", "type=bind,src=/etc/letsencrypt,dst=/etc/letsencrypt,readonly",
            image, "nginx", "-t",
        ])
    finally:
        path.unlink(missing_ok=True)


def verify(scope: str):
    results = report(scope)
    if not all(info["zvq_content"] for info in results.values()):
        raise RuntimeError(f"Developer pages invalid at {scope}")
    return results


def verify_mainnet():
    if not rpc_probe("https://rpc.kriptoaman.com/"):
        raise RuntimeError("Canonical chain ID changed or canonical RPC unavailable")
    if not rpc_probe(f"https://{DOMAIN}/rpc", resolve=True):
        raise RuntimeError("Origin RPC read-only gateway invalid")
    if not rpc_probe(f"https://{DOMAIN}/rpc"):
        raise RuntimeError("Public Explorer RPC invalid")
    if status(f"https://{IP}/rpc") != "403" or status(f"https://{IP}/api/admin") != "403":
        raise RuntimeError("Protected independent IP fallback drift")
    for scope in ("origin", "public"):
        code, body = get("/", scope)
        if code != "200" or "data-zevaryq-explorer-version" not in body:
            raise RuntimeError(f"Protected homepage changed or unavailable at {scope}")
    # Exactly one bounded indexed API read, not a traffic-generating poll.
    data = json.loads(cmd([
        "curl", "--noproxy", "*", "-fsS", "--max-time", "12",
        "https://explorer.kriptoaman.com/api/v2/blocks",
    ], capture=True))
    if not isinstance(data.get("items"), list) or not data["items"]:
        raise RuntimeError("Blockscout indexed blocks are unavailable")


def apply(run_id: str, state):
    sources, backend_before, backend_candidate, tls_before, tls_candidate = state
    backup = BACKUP_ROOT / run_id
    if backup.exists():
        raise RuntimeError("Refusing to overwrite an existing release backup")
    backup.mkdir(mode=0o700, parents=True)
    old_files = {}
    for filename in set(sources.values()):
        dst = DASHBOARD / filename
        old_files[filename] = dst.is_file()
        if old_files[filename]:
            shutil.copy2(dst, backup / (filename + ".bak"))
        elif dst.exists():
            raise RuntimeError(f"Refusing unusual backend path: {filename}")
    shutil.copy2(TEMPLATE, backup / "port80-template.bak")
    shutil.copy2(TLS, backup / "standalone-tls.bak")
    (backup / "manifest.json").write_text(
        json.dumps({"files_preexisted": old_files, "run_id": run_id},
                   sort_keys=True), encoding="utf-8",
    )
    changed_files = []
    template_changed = False
    tls_changed = False
    committed = False
    try:
        for filename in sorted(set(sources.values())):
            dst = DASHBOARD / filename
            dst.write_bytes((SOURCES / filename).read_bytes())
            dst.chmod(0o644)
            changed_files.append(filename)
        TEMPLATE.write_text(backend_candidate, encoding="utf-8")
        template_changed = True
        cmd(["docker", "compose", "up", "-d", "--force-recreate",
             "--no-deps", "proxy"], cwd=str(PROXY.parent))
        cmd(["docker", "compose", "exec", "-T", "proxy", "nginx", "-t"],
            cwd=str(PROXY.parent))
        for attempt in range(12):
            try:
                verify("backend")
                break
            except RuntimeError:
                if attempt == 11:
                    raise
                time.sleep(1)
        TLS.write_text(tls_candidate, encoding="utf-8")  # preserve bind-mounted inode
        tls_changed = True
        cmd(["docker", "exec", TLS_CONTAINER, "nginx", "-t"])
        cmd(["docker", "exec", TLS_CONTAINER, "nginx", "-s", "reload"])
        for attempt in range(12):
            try:
                verify("origin")
                break
            except RuntimeError:
                if attempt == 11:
                    raise
                time.sleep(1)
        verify("public")
        verify_mainnet()
        committed = True
        print(json.dumps({
            "deployed": True, "developer_routes": sorted(PAGES),
            "chain_id": 22028, "rpc_allowlist_unchanged": True,
            "independent_ip_rpc": 403, "backup": str(backup),
            "protected_homepage_untouched": True,
        }, sort_keys=True), flush=True)
    finally:
        if not committed:
            print("Developer release verification failed: restoring prior state", file=sys.stderr)
            if tls_changed:
                TLS.write_bytes(tls_before.encode("utf-8"))
                cmd(["docker", "exec", TLS_CONTAINER, "nginx", "-t"])
                cmd(["docker", "exec", TLS_CONTAINER, "nginx", "-s", "reload"])
            for filename in changed_files:
                dst = DASHBOARD / filename
                if old_files[filename]:
                    shutil.copy2(backup / (filename + ".bak"), dst)
                else:
                    dst.unlink(missing_ok=True)
            if template_changed:
                TEMPLATE.write_text(backend_before, encoding="utf-8")
                cmd(["docker", "compose", "up", "-d", "--force-recreate",
                     "--no-deps", "proxy"], cwd=str(PROXY.parent))
            # Do not suppress rollback verification failures.
            if (status(f"https://{IP}/rpc") != "403"
                    or status(f"https://{IP}/api/admin") != "403"
                    or not rpc_probe(f"https://{DOMAIN}/rpc", resolve=True)):
                raise RuntimeError("Emergency: baseline RPC/fallback not restored")
            print("Developer-only rollback completed; backup retained", file=sys.stderr)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    run_id = os.getenv("ZVQ_DEV_RUN_ID", "")
    if args.apply and not re.fullmatch(r"[0-9]{7,16}", run_id):
        raise RuntimeError("An explicit authorized GitHub run ID is required")
    state = preflight()
    validate_tls_candidate(state[4])
    if not args.apply:
        print(json.dumps({
            "preview": "syntax-pass", "backend_routes": "one scoped addition",
            "developer_sources": len(state[0]), "applied": False,
            "rpc_allowlist_unchanged": True,
        }, sort_keys=True))
        return
    apply(run_id, state)


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, ValueError, OSError, subprocess.CalledProcessError,
            UnicodeError, KeyError) as exc:
        print(f"ZVQ Developer-only release stopped: {exc}", file=sys.stderr)
        sys.exit(1)
