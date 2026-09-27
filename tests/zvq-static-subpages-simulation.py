"""Sandbox-only exercise of exact-page ZVQ deploy, failure rollback and explicit rollback.

The production script is run with temporary sandbox paths and a fake public HTTP
transport; it NEVER touches a real VPS, RPC, wallet, or external endpoint.
"""
from pathlib import Path
import os
import re
import subprocess
import tempfile

SOURCE = (Path(__file__).resolve().parents[1] / "scripts/deploy-zvq-static-subpages.sh").read_text()

def scenario(fail_after=False, explicit_rollback=False):
    with tempfile.TemporaryDirectory(prefix="zvq-subpages-simulation-") as folder:
        base = Path(folder)
        host = base / "proxy"
        dash = host / "kam-dashboard"
        dash.mkdir(parents=True)
        backups = base / "backups"
        sources = base / "explorer-dashboard"
        sources.mkdir()
        bindir = base / "bin"
        bindir.mkdir()
        (dash / "index.html").write_text('<html data-zevaryq-explorer-version="2.0.0"></html>')
        old = {
            "blocks.html": b"<html>KAM NETWORK <strong>KAM Explorer</strong> old blocks</html>",
            "transactions.html": b"<html>KAM NETWORK <strong>KAM Explorer</strong> old txs</html>",
        }
        new = {
            "blocks.html": b'<html data-zvq-public-brand="1.0.0"><strong>ZEVARYQ Explorer</strong> blocks</html>',
            "transactions.html": b'<html data-zvq-public-brand="1.0.0"><strong>ZEVARYQ Explorer</strong> txs</html>',
        }
        for name in old:
            (dash / name).write_bytes(old[name])
            (sources / name).write_bytes(new[name])
        (host / "default.conf.template").write_text(
            "location = /blocks { try_files /kam-dashboard/blocks.html =404; }\n"
            "location = /txs { try_files /kam-dashboard/transactions.html =404; }"
        )
        curl = bindir / "curl"
        curl.write_text("""#!/usr/bin/env bash
out=""; url=""; prev=""
for arg in "$@"; do
  if [[ "$prev" == -o ]]; then out="$arg"; prev=""; continue; fi
  if [[ "$arg" == -o ]]; then prev=-o; continue; fi
  if [[ "$arg" == https://* ]]; then url="$arg"; fi
done
if [[ "$url" == */rpc ]]; then echo '{"jsonrpc":"2.0","result":"0x560c"}'; exit 0; fi
if [[ "$url" == */api/v2/blocks ]]; then echo '{"items":[{"height":42}]}'; exit 0; fi
if [[ "$url" == *'/blocks?'* ]]; then source="$MOCK_D/blocks.html";
elif [[ "$url" == *'/txs?'* ]]; then source="$MOCK_D/transactions.html";
else echo "Unexpected URL $url" >&2; exit 22; fi
if [[ "$FAIL_AFTER" == 1 && "$url" == *'after'* ]]; then
  echo 'Simulated post-deployment public proof failure' >&2
  exit 22
fi
cp "$source" "$out"
""")
        curl.chmod(0o755)
        hostname = bindir / "hostname"
        hostname.write_text("#!/bin/sh\necho kam-explorer-blockscout-01\n")
        hostname.chmod(0o755)

        patched = SOURCE
        for previous, new_line in [
            ("D=/opt/blockscout/docker-compose/proxy/kam-dashboard", f"D={dash}"),
            ("TEMPLATE=/opt/blockscout/docker-compose/proxy/default.conf.template", f"TEMPLATE={host / 'default.conf.template'}"),
            ("BACKUPS=/var/backups/kriptoaman/zvq-static-subpages", f"BACKUPS={backups}"),
        ]:
            assert previous in patched, f"Production boundary changed: {previous}"
            patched = patched.replace(previous, new_line, 1)
        script = base / "deploy.sh"
        script.write_text(patched)
        env = dict(os.environ, PATH=str(bindir) + os.pathsep + os.environ["PATH"],
                   MOCK_D=str(dash), FAIL_AFTER="1" if fail_after else "0")
        proc = subprocess.run(["bash", str(script)], cwd=base, env=env,
                              capture_output=True, text=True, check=False)
        evidence = proc.stdout + "\n" + proc.stderr
        if fail_after:
            assert proc.returncode != 0, "Simulated public failure must block release: " + evidence
            for name in old:
                assert (dash / name).read_bytes() == old[name], "Rollback failed for " + name
            assert "ROLLBACK=completed" in evidence, evidence
            return
        assert proc.returncode == 0, evidence
        for name in new:
            assert (dash / name).read_bytes() == new[name], "Wrong deployed content: " + name
        assert (dash / "index.html").read_text().find("data-zevaryq-explorer-version") >= 0
        assert len(list(backups.rglob("*.second-copy"))) == 2
        if explicit_rollback:
            stamp = re.search(r"ZVQ_SUBPAGES_DEPLOY_STAMP=(\w+)", proc.stdout)
            assert stamp, evidence
            restored = subprocess.run(["bash", str(script), "--rollback", stamp.group(1)],
                                      cwd=base, env=env, capture_output=True, text=True, check=False)
            assert restored.returncode == 0, restored.stdout + restored.stderr
            for name in old:
                assert (dash / name).read_bytes() == old[name], "Explicit rollback failed: " + name

if __name__ == "__main__":
    scenario()
    print("PASS: exact two-page publish with unchanged homepage and double backup")
    scenario(fail_after=True)
    print("PASS: simulated public proof failure restores both original pages")
    scenario(explicit_rollback=True)
    print("PASS: explicit rollback restores both original pages")
