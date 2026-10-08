"""Sandbox-only coverage for ZEVARYQ Developer HTTPS sidecar asset refresh."""
import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from refresh_zvq_developer_master_v2 import (
    FILES, atomic, approved_assets, digest, restore
)


class MasterV2SidecarRefreshTests(unittest.TestCase):
    def test_reviewed_six_static_sources_have_official_logo(self):
        self.assertEqual(len(FILES), 6)
        self.assertIn("developer-network.json", FILES)
        self.assertIn("developer-starter.html", FILES)
        assets = approved_assets()
        self.assertEqual(set(assets), set(FILES))
        for file in FILES:
            self.assertGreater(len(assets[file]), 20)

    def test_atomic_install_and_exact_hash_rollback(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            stage = root / "existing-sidecar"
            backup = root / "exact-run-backup"
            stage.mkdir()
            backup.mkdir()
            before = {}
            after = {}
            for file in FILES:
                before[file] = ("approved-original-" + file).encode()
                after[file] = ("approved-master-v2-" + file).encode()
                (stage / file).write_bytes(before[file])
                (backup / (file + ".before")).write_bytes(before[file])
            manifest = {
                "run_id": "123456789",
                "stage": str(stage),
                "before": {file: digest(before[file]) for file in FILES},
                "after": {file: digest(after[file]) for file in FILES},
            }
            untouched = stage / "protected-homepage"
            untouched.write_text("DO NOT MODIFY")
            for file in FILES:
                atomic(stage / file, after[file])
            restore(stage, backup, manifest)
            for file in FILES:
                self.assertEqual((stage / file).read_bytes(), before[file])
            self.assertEqual(untouched.read_text(), "DO NOT MODIFY")

    def test_external_edit_blocks_rollback(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            stage = root / "existing-sidecar"
            backup = root / "exact-run-backup"
            stage.mkdir()
            backup.mkdir()
            before = {}
            after = {}
            for file in FILES:
                before[file] = ("old-" + file).encode()
                after[file] = ("new-" + file).encode()
                (stage / file).write_bytes(after[file])
                (backup / (file + ".before")).write_bytes(before[file])
            manifest = {
                "before": {file: digest(before[file]) for file in FILES},
                "after": {file: digest(after[file]) for file in FILES},
            }
            changed = FILES[0]
            (stage / changed).write_text("EXTERNAL CONCURRENT EDIT")
            with self.assertRaisesRegex(RuntimeError, "Concurrent external edit"):
                restore(stage, backup, manifest)
            self.assertEqual((stage / changed).read_text(), "EXTERNAL CONCURRENT EDIT")

    def test_script_never_modifies_tls_proxy_or_chain(self):
        script = (Path(__file__).resolve().parents[1] /
                  "scripts/refresh_zvq_developer_master_v2.py").read_text()
        for text in ["DEV_GATEWAY", "Mounts", 'm.get("RW")', "ZVQ_DEV_ASSET_RUN_ID",
                     "developer-v2-assets-backup-", "assert_network()", "check_responded"]:
            self.assertIn(text, script)
        for forbidden in ["nginx -s reload", "docker compose up", "docker rm -f",
                          "eth_sendRawTransaction", "genesis.json", "private.key"]:
            self.assertNotIn(forbidden, script)


if __name__ == "__main__":
    unittest.main()
