#!/usr/bin/env python3
"""Guarded static-asset-only refresh for the existing ZEVARYQ Developer HTTPS sidecar.

No sidecar recreation, TLS/NGINX reload, RPC changes, DNS, genesis, keys, wallet
or chain operations. All six files are atomically replaced in an existing bind
mount after a full backup and are restored on any failed verification.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from repair_zvq_developer_https import (
    BASE, CONFIG, TLS, RPC_GATEWAY, DEV_GATEWAY, MARKER,
    validate_sources, chain_ok, status,
)
from probe_zvq_developer_routes import DOMAIN, IP, SOURCE_FILES, get

RUN_ENV = "ZVQ_DEV_ASSET_RUN_ID"
FILES = tuple(sorted(set(SOURCE_FILES.values())))


def run(argv: list[str]) -> str:
    p = subprocess.run(argv, capture_output=True, text=True, check=True, timeout=25)
    return p.stdout.strip()


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def atomic(path: Path, contents: bytes) -> None:
    fd, tmp = tempfile.mkstemp(prefix=".zvq-v2-refresh-", dir=path.parent)
    try:
        with os.fdopen(fd, "wb") as out:
            out.write(contents)
            out.flush()
            os.fsync(out.fileno())
        os.chmod(tmp, 0o644)
        os.replace(tmp, path)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


def owned_stage() -> Path:
    """Verify the installed, original Developer sidecar and its read-only bind."""
    if os.geteuid() != 0:
        raise RuntimeError("Dedicated Explorer host sudo required")
    if not CONFIG.is_file() or MARKER not in CONFIG.read_text(encoding="utf-8"):
        raise RuntimeError("Active isolated Developer HTTPS routing marker absent")
    for name in (TLS, RPC_GATEWAY, DEV_GATEWAY):
        if run(["docker", "inspect", "-f", "{{.State.Status}}", name]) != "running":
            raise RuntimeError("Protected container not running: " + name)
    label = run(["docker", "inspect", "-f",
                 '{{index .Config.Labels "com.kriptoaman.component"}}', DEV_GATEWAY])
    original_run = run(["docker", "inspect", "-f",
                        '{{index .Config.Labels "com.kriptoaman.run_id"}}', DEV_GATEWAY])
    if label != "zvq-developer" or not re.fullmatch(r"[0-9]{7,16}", original_run):
        raise RuntimeError("Developer sidecar identity not approved")
    stage = BASE / f"developer-static-{original_run}"
    if stage.is_symlink() or not stage.is_dir():
        raise RuntimeError("Developer assets mount path invalid")
    mounts = json.loads(run(["docker", "inspect", "-f", "{{json .Mounts}}", DEV_GATEWAY]))
    approved = [m for m in mounts if m.get("Destination") == "/public"]
    if len(approved) != 1 or approved[0].get("Type") != "bind":
        raise RuntimeError("Developer static bind count/type differs")
    m = approved[0]
    if Path(m.get("Source", "")).resolve() != stage.resolve() or bool(m.get("RW")):
        raise RuntimeError("Developer static bind is not the expected read-only mount")
    for filename in FILES:
        path = stage / filename
        if not path.is_file() or path.is_symlink():
            raise RuntimeError("Protected static file missing or symlink: " + filename)
    return stage


def assert_network() -> None:
    if not chain_ok(f"https://{DOMAIN}/rpc", resolve=True):
        raise RuntimeError("Expected read-only ZVQ chain ID 0x560c unavailable")
    if status(f"https://{IP}/rpc") != "403" or status(f"https://{IP}/api/admin") != "403":
        raise RuntimeError("Protected IP/RPC denial has changed")


def approved_assets() -> dict[str, bytes]:
    resolved = validate_sources()
    if set(resolved) != set(FILES):
        raise RuntimeError("Unexpected Developer source allowlist")
    result = {name: path.read_bytes() for name, path in resolved.items()}
    for name, body in result.items():
        if name.endswith(".html"):
            if b"/zevaryq-assets/zevaryq-master-v2.svg?v=20261008-zevaryq-identity-v2" not in body:
                raise RuntimeError("Master V2 emblem missing: " + name)
            if b'class="mark">K' in body or b'https://kriptoaman.com/brand/zevaryq-mark.svg' in body:
                raise RuntimeError("Old logo retained: " + name)
    return result


def check_responded(expected: dict[str, bytes], scope: str) -> None:
    for route, file in SOURCE_FILES.items():
        code, body = get(route, scope)
        if code != "200" or body.encode("utf-8") != expected[file]:
            raise RuntimeError(f"Developer {scope} mismatch: {route} HTTP {code}")


def restore(stage: Path, backup: Path, manifest: dict, verify_hashes=True) -> None:
    for file in FILES:
        before = (backup / (file + ".before")).read_bytes()
        if digest(before) != manifest["before"][file]:
            raise RuntimeError("Backup checksum mismatch: " + file)
        current = digest((stage / file).read_bytes())
        if verify_hashes and current not in (manifest["before"][file], manifest["after"][file]):
            raise RuntimeError("Concurrent external edit; refuse rollback: " + file)
    for file in FILES:
        atomic(stage / file, (backup / (file + ".before")).read_bytes())
    for file in FILES:
        if digest((stage / file).read_bytes()) != manifest["before"][file]:
            raise RuntimeError("Restored checksum mismatch: " + file)
    print("ZVQ_DEVELOPER_ASSETS_ROLLBACK=completed", flush=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--rollback", action="store_true")
    args = parser.parse_args()
    if args.apply and args.rollback:
        raise RuntimeError("Cannot apply and rollback at once")
    run_id = os.environ.get(RUN_ENV, "")
    if not re.fullmatch(r"[0-9]{7,16}", run_id):
        raise RuntimeError("Explicit reviewed numeric GitHub run ID required")
    stage = owned_stage()
    backup = BASE / f"developer-v2-assets-backup-{run_id}"
    if args.rollback:
        if backup.is_symlink() or not backup.is_dir():
            raise RuntimeError("Exact reviewed Developer backup missing")
        manifest = json.loads((backup / "manifest.json").read_text(encoding="utf-8"))
        if manifest.get("run_id") != run_id or manifest.get("stage") != str(stage):
            raise RuntimeError("Developer backup ownership mismatch")
        restore(stage, backup, manifest)
        return
    assert_network()
    desired = approved_assets()
    before = {name: (stage / name).read_bytes() for name in FILES}
    # Fail before any write if the active sidecar is not serving the mounted bytes.
    check_responded(before, "origin")
    if all(before[name] == desired[name] for name in FILES):
        print("ZVQ_DEVELOPER_ASSETS_ALREADY_CURRENT=6/6", flush=True)
        return
    if backup.exists() or backup.is_symlink():
        raise RuntimeError("A previous backup exists for this run ID")
    if not args.apply:
        print("ZVQ_DEVELOPER_ASSETS_PREFLIGHT=ready files=6 sidecar=preserved", flush=True)
        return
    backup.mkdir(mode=0o700)
    manifest = {
        "run_id": run_id, "stage": str(stage),
        "before": {n: digest(before[n]) for n in FILES},
        "after": {n: digest(desired[n]) for n in FILES},
    }
    for name in FILES:
        (backup / (name + ".before")).write_bytes(before[name])
    (backup / "manifest.json").write_text(json.dumps(manifest, sort_keys=True), encoding="utf-8")
    modified = False
    try:
        for name in FILES:
            modified = True
            atomic(stage / name, desired[name])
        for name in FILES:
            if digest((stage / name).read_bytes()) != manifest["after"][name]:
                raise RuntimeError("Applied checksum mismatch: " + name)
        check_responded(desired, "origin")
        check_responded(desired, "public")
        assert_network()
    except BaseException:
        if modified:
            restore(stage, backup, manifest)
        raise
    print(f"ZVQ_DEVELOPER_ASSETS_DEPLOY_RUN_ID={run_id}", flush=True)
    print("ZVQ_DEVELOPER_ASSETS_PUBLIC=7/7 master_v2=verified tls=unchanged rpc=preserved", flush=True)


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, OSError, subprocess.CalledProcessError,
            subprocess.TimeoutExpired, ValueError, UnicodeError, KeyError) as exc:
        print("ZVQ Developer assets refresh stopped: " + str(exc), file=sys.stderr)
        sys.exit(1)
