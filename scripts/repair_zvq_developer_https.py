#!/usr/bin/env python3
"""Manual, fail-closed ZVQ Developer-only static deployment.

No edits to legacy port-80 proxy, existing ZVQ homepage, RPC, Cloudflare,
DNS, chain, validators, keys or balances. The six reviewed static files are
mounted read-only into a dedicated non-root sidecar in the existing Explorer
TLS container network namespace. Seven exact SNI-only TLS paths expose them.
"""
from __future__ import annotations
import argparse
import json
import os
import re
import signal
import shutil
import subprocess
import sys
import time
from pathlib import Path

from render_zvq_developer_https import MARKER, render
from probe_zvq_developer_routes import DOMAIN, IP, PAGES, SOURCE_FILES, get, valid

BASE = Path("/var/lib/zvq-origin-ip-tls")
CONFIG = BASE / "default.conf"
TLS = "zvq-origin-ip-tls"
RPC_GATEWAY = "zvq-explorer-rpc-allowlist-gateway"
DEV_GATEWAY = "zvq-explorer-developer-static"
SOURCE = Path(__file__).resolve().with_name("zvq-developer-static-gateway.mjs")
PUBLIC_ASSETS = Path(__file__).resolve().parent.parent / "explorer-dashboard"
RUN_ID_ENV = "ZVQ_DEV_RUN_ID"
CHAIN_REQUEST = json.dumps({"jsonrpc": "2.0", "id": "zvq-dev-gate",
                             "method": "eth_chainId", "params": []})
BLOCKED = ("eth_sendRawTransaction", "admin_peers", "personal_listAccounts",
           "debug_traceTransaction", "txpool_content",
           "qbft_getValidatorsByBlockNumber")


def cmd(argv, *, capture=False):
    completed = subprocess.run(argv, check=True, text=True,
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.PIPE if capture else None,
        timeout=40)
    return completed.stdout.strip() if capture else ""


def status(url, *, resolve=False, method=None):
    args = ["curl", "--noproxy", "*", "-sS", "--connect-timeout", "4",
            "--max-time", "12", "-o", "/dev/null", "-w", "%{http_code}"]
    if resolve:
        args += ["--resolve", f"{DOMAIN}:443:{IP}"]
    if method:
        body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": []})
        args += ["-H", "Content-Type: application/json", "--data", body]
    return cmd(args + [url], capture=True)


def chain_ok(url, *, resolve=False):
    args = ["curl", "--noproxy", "*", "-fsS", "--connect-timeout", "4",
            "--max-time", "12", "-H", "Content-Type: application/json",
            "--data", CHAIN_REQUEST]
    if resolve:
        args += ["--resolve", f"{DOMAIN}:443:{IP}"]
    try:
        return json.loads(cmd(args + [url], capture=True)).get("result") == "0x560c"
    except (ValueError, subprocess.CalledProcessError, subprocess.TimeoutExpired):
        return False


def validate_sources():
    """Refuse old KAM assets even if the legacy HTML version markers match."""
    if not SOURCE.is_file():
        raise RuntimeError("Reviewed Developer gateway source unavailable")
    resolved = {}
    for url, filename in SOURCE_FILES.items():
        path = PUBLIC_ASSETS / filename
        if not path.is_file() or path.stat().st_size > 1_000_000:
            raise RuntimeError(f"Reviewed static source unavailable: {filename}")
        body = path.read_text(encoding="utf-8")
        if not valid(url, body):
            raise RuntimeError(f"Not verified ZVQ content: {filename}")
        resolved[filename] = path
    # Validate network identity and no public key material using parsed JSON.
    net = json.loads((PUBLIC_ASSETS / "developer-network.json").read_text())
    if (net.get("chainId") != 22028 or net.get("chainIdHex") != "0x560c"
            or net.get("nativeCurrency", {}).get("symbol") != "ZVQ"
            or net.get("security", {}).get("privateKeysRequired") is not False):
        raise RuntimeError("Developer network JSON identity/security mismatch")
    return resolved


def verify_origin():
    """Do not short circuit; report every exact direct-origin Developer route."""
    results = {}
    for url in PAGES:
        http, body = get(url, "origin")
        results[url] = {"http": http, "zvq_content": http == "200" and valid(url, body)}
    rpc = chain_ok(f"https://{DOMAIN}/rpc", resolve=True)
    ip_rpc = status(f"https://{IP}/rpc")
    ip_admin = status(f"https://{IP}/api/admin")
    home_http = status(f"https://{DOMAIN}/", resolve=True)
    print(json.dumps({"developer_origin": results, "rpc_chain22028": rpc,
                      "ip_rpc": ip_rpc, "ip_api_admin": ip_admin,
                      "origin_home": home_http}), flush=True)
    return (all(v == {"http": "200", "zvq_content": True} for v in results.values())
            and rpc and ip_rpc == "403" and ip_admin == "403" and home_http == "200")


def verify_public():
    results = {}
    for url in PAGES:
        http, body = get(url, "public")
        results[url] = {"http": http, "zvq_content": http == "200" and valid(url, body)}
    rpc = chain_ok(f"https://{DOMAIN}/rpc")
    print(json.dumps({"developer_public": results, "rpc_chain22028": rpc}), flush=True)
    return all(v == {"http": "200", "zvq_content": True} for v in results.values()) and rpc


def immutable_gateway_image():
    if cmd(["docker", "inspect", "-f", "{{.State.Status}}", TLS], capture=True) != "running":
        raise RuntimeError("Protected TLS container not running")
    if cmd(["docker", "inspect", "-f", "{{.State.Status}}", RPC_GATEWAY], capture=True) != "running":
        raise RuntimeError("Previously approved RPC allowlist gateway unavailable")
    image_id = cmd(["docker", "inspect", "-f", "{{.Image}}", RPC_GATEWAY], capture=True)
    if not image_id.startswith("sha256:"):
        raise RuntimeError("Existing approved Node image not resolvable")
    cmd(["docker", "image", "inspect", image_id, "--format", "{{.Id}}"], capture=True)
    return image_id


def preflight():
    if os.geteuid() != 0:
        raise RuntimeError("Root-only reviewed production preflight")
    if not CONFIG.is_file():
        raise RuntimeError("Existing bind-mounted Explorer TLS configuration unavailable")
    cert = Path("/etc/letsencrypt/live/zvq-explorer-domain/fullchain.pem")
    key = Path("/etc/letsencrypt/live/zvq-explorer-domain/privkey.pem")
    if not (cert.is_file() and key.is_file()):
        raise RuntimeError("Reviewed domain TLS cert/key unavailable")
    cmd(["openssl", "x509", "-in", str(cert), "-noout", "-checkend", "172800"])
    sans = cmd(["openssl", "x509", "-in", str(cert),
                "-noout", "-ext", "subjectAltName"], capture=True)
    if f"DNS:{DOMAIN}" not in sans:
        raise RuntimeError("TLS certificate not valid for Explorer SNI")
    node_image = immutable_gateway_image()
    assets = validate_sources()
    if not chain_ok(f"https://{DOMAIN}/rpc", resolve=True):
        raise RuntimeError("Previously healthy direct-origin read-only RPC unavailable")
    if status(f"https://{IP}/rpc") != "403" or status(f"https://{IP}/api/admin") != "403":
        raise RuntimeError("Protected independent IP fallback deny changed")
    if status(f"https://{DOMAIN}/", resolve=True) != "200":
        raise RuntimeError("Protected ZEVARYQ homepage unavailable")
    if status(f"https://{DOMAIN}/developer", resolve=True) != "404":
        raise RuntimeError("Developer origin no longer baseline 404; inspect new state")
    if subprocess.run(["docker", "inspect", DEV_GATEWAY], stdout=subprocess.DEVNULL,
                      stderr=subprocess.DEVNULL).returncode == 0:
        raise RuntimeError("Developer sidecar exists; refuse ambiguous ownership")
    return node_image, assets


def nginx_test(candidate, image):
    cmd(["docker", "run", "--rm", "--network", "none", "--read-only",
         "--tmpfs", "/var/cache/nginx", "--tmpfs", "/var/run", "--tmpfs", "/tmp",
         "--mount", f"type=bind,src={candidate},dst=/etc/nginx/conf.d/default.conf,readonly",
         "--mount", "type=bind,src=/etc/letsencrypt,dst=/etc/letsencrypt,readonly",
         image, "nginx", "-t"])


def stage_and_start(assets, image, stage, installed_script, run_id):
    stage.mkdir(mode=0o755)
    for name, source in assets.items():
        target = stage / name
        shutil.copyfile(source, target)
        target.chmod(0o644)
    shutil.copyfile(SOURCE, installed_script)
    installed_script.chmod(0o644)
    cmd(["docker", "run", "-d", "--name", DEV_GATEWAY,
         "--label", "com.kriptoaman.component=zvq-developer",
         "--label", f"com.kriptoaman.run_id={run_id}",
         "--network", f"container:{TLS}", "--restart", "unless-stopped",
         "--read-only", "--user", "10001:10001", "--cap-drop", "ALL",
         "--security-opt", "no-new-privileges", "--memory", "96m",
         "--pids-limit", "48", "--tmpfs", "/tmp",
         "--mount", f"type=bind,src={stage},dst=/public,readonly",
         "--mount", f"type=bind,src={installed_script},dst=/gateway.mjs,readonly",
         "-e", "ZVQ_DEV_GATEWAY_ROOT=/public",
         "-e", "ZVQ_DEV_GATEWAY_PORT=18447",
         image, "node", "/gateway.mjs"])
    # One bounded local request from inside the existing TLS namespace.
    probe_js = ("fetch('http://127.0.0.1:18447/developer')"
                ".then(async r => {let s=await r.text();"
                "if(r.status!==200 || !s.includes('ZVQ')) process.exit(1)})"
                ".catch(()=>process.exit(1))")
    for _ in range(10):
        time.sleep(1)
        try:
            cmd(["docker", "run", "--rm", "--network", f"container:{TLS}",
                 "--read-only", "--user", "10001:10001", "--cap-drop", "ALL",
                 image, "node", "-e", probe_js])
            return
        except subprocess.CalledProcessError:
            continue
    raise RuntimeError("Private Developer sidecar failed readiness")


def owned_sidecar(run_id):
    if subprocess.run(["docker", "inspect", DEV_GATEWAY], stdout=subprocess.DEVNULL,
                      stderr=subprocess.DEVNULL).returncode:
        return False
    label = cmd(["docker", "inspect", "-f",
                 "{{index .Config.Labels \"com.kriptoaman.run_id\"}}",
                 DEV_GATEWAY], capture=True)
    if label != run_id:
        raise RuntimeError("Existing sidecar ownership mismatch; manual inspection required")
    return True


def restore(before, run_id, stage, installed_script):
    if before is not None:
        CONFIG.write_bytes(before)  # preserve bind-mounted config inode
        cmd(["docker", "exec", TLS, "nginx", "-t"])
        cmd(["docker", "exec", TLS, "nginx", "-s", "reload"])
    if owned_sidecar(run_id):
        cmd(["docker", "rm", "-f", DEV_GATEWAY])
    if stage.exists():
        shutil.rmtree(stage)
    installed_script.unlink(missing_ok=True)
    # Fail closed; do not silently report rollback if the old RPC is damaged.
    if (not chain_ok(f"https://{DOMAIN}/rpc", resolve=True)
            or status(f"https://{IP}/rpc") != "403"):
        raise RuntimeError("Emergency: original RPC/fallback not healthy after rollback")
    print(json.dumps({"developer_rollback": True, "rpc_preserved": True}), flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--rollback", action="store_true")
    args = parser.parse_args()
    run_id = os.getenv(RUN_ID_ENV, "")
    if (args.apply or args.rollback) and not re.fullmatch(r"[0-9]{7,16}", run_id):
        raise RuntimeError("Explicit numeric authorized GitHub run ID required")
    if args.apply and args.rollback:
        raise RuntimeError("Choose apply or rollback")
    if args.apply:
        def interrupted(signum, _frame):
            raise RuntimeError(f"Production rollout interrupted by signal {signum}; restoring backups")
        signal.signal(signal.SIGTERM, interrupted)
        signal.signal(signal.SIGINT, interrupted)
    stage = BASE / f"developer-static-{run_id}"
    installed = BASE / f"developer-static-gateway-{run_id}.mjs"
    backup = BASE / f"default.conf.developer-{run_id}.bak"
    if args.rollback:
        if os.geteuid() != 0 or not backup.is_file() or MARKER not in CONFIG.read_text():
            raise RuntimeError("No known installed Developer patch to roll back")
        before = backup.read_bytes()
        if MARKER in before.decode("utf-8") or "# ZVQ_DOMAIN_RPC_V2_READONLY" not in before.decode("utf-8"):
            raise RuntimeError("Developer backup does not match reviewed original RPC config")
        restore(before, run_id, stage, installed)
        return
    node_image, assets = preflight()
    before = CONFIG.read_bytes()
    candidate_text = render(before.decode("utf-8"))
    nginx_image = cmd(["docker", "inspect", "-f", "{{.Image}}", TLS], capture=True)
    if not nginx_image.startswith("sha256:"):
        raise RuntimeError("Running TLS image unavailable")
    suffix = run_id or "preview"
    candidate = BASE / f"candidate-developer-{suffix}.conf"
    if candidate.exists() or backup.exists() or stage.exists() or installed.exists():
        raise RuntimeError("Refusing to overwrite an existing Developer release/backup")
    candidate.write_text(candidate_text)
    candidate.chmod(0o600)
    try:
        nginx_test(candidate, nginx_image)
        if not args.apply:
            print(json.dumps({"preview": "syntax-pass", "pages": len(PAGES),
                              "origin_get_paths_only": True, "applied": False}))
            return
        shutil.copy2(CONFIG, backup)
        changed = False
        committed = False
        try:
            stage_and_start(assets, node_image, stage, installed, run_id)
            changed = True  # partial bind-mounted writes must also trigger restoration
            CONFIG.write_bytes(candidate_text.encode("utf-8"))
            cmd(["docker", "exec", TLS, "nginx", "-t"])
            loaded = cmd(["docker", "exec", TLS, "nginx", "-T"], capture=True)
            if (loaded.count(MARKER) != 1
                    or "proxy_pass http://127.0.0.1:18446/;" not in loaded):
                raise RuntimeError("Active NGINX did not load isolated Developer/RPC routes")
            cmd(["docker", "exec", TLS, "nginx", "-s", "reload"])
            good = False
            for _ in range(5):
                time.sleep(1)
                if verify_origin():
                    good = True
                    break
            if not good:
                raise RuntimeError("Developer origin validation failed")
            for method in BLOCKED:
                if status(f"https://{DOMAIN}/rpc", resolve=True, method=method) != "403":
                    raise RuntimeError("Previously denied RPC namespace altered: " + method)
            if not verify_public():
                raise RuntimeError("Developer public edge verification failed")
            committed = True
            print(json.dumps({"developer_deployed": True, "pages": len(PAGES),
                              "rpc_preserved": True, "backup": str(backup)}))
        finally:
            if not committed:
                print("Developer cutover failed; restoring original domain TLS config", file=sys.stderr)
                restore(before if changed else None, run_id, stage, installed)
    finally:
        candidate.unlink(missing_ok=True)


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, OSError, subprocess.CalledProcessError,
            subprocess.TimeoutExpired, ValueError, UnicodeError) as exc:
        print(f"ZVQ Developer repair stopped: {exc}", file=sys.stderr)
        sys.exit(1)
