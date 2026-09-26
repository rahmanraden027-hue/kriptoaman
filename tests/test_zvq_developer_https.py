import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
from render_zvq_developer_https import DOMAIN_MARKER, MARKER, RATE_ZONE, PAGES, render

IP = """# ZVQ_DOMAIN_RPC_V2_READONLY
server {
 listen 443 ssl default_server;
 server_name 146.190.93.254;
 location = /rpc { return 403; }
 location ^~ /api/ { return 403; }
 location / { return 404; }
}
"""
DOMAIN = """server {
 listen 443 ssl;
 server_name explorer.kriptoaman.com;
 location = /rpc {
   proxy_pass http://127.0.0.1:18446/;
 }
 location ^~ /api/ { return 403; }
 location / { return 404; }
}
"""
BASE = IP + "\n" + DOMAIN_MARKER + "\n" + DOMAIN


class DeveloperTlsRoutesTest(unittest.TestCase):
    def test_preserves_ip_and_rpc_allowlist(self):
        out = render(BASE)
        ip, domain = out.split(DOMAIN_MARKER, 1)
        self.assertEqual(ip, IP + "\n")
        self.assertIn("proxy_pass http://127.0.0.1:18446/;", domain)
        self.assertIn("location ^~ /api/ { return 403; }", domain)
        self.assertEqual(domain.count(MARKER), 1)
        self.assertEqual(domain.count("location / { return 404; }"), 1)
        for path in PAGES:
            self.assertIn("location = " + path + " {", domain)
        self.assertEqual(domain.count("limit_except GET { deny all; }"), len(PAGES))
        self.assertEqual(domain.count("proxy_pass http://127.0.0.1:18447;"), len(PAGES))
        self.assertEqual(domain.count(RATE_ZONE), 1)
        self.assertEqual(domain.count("limit_req zone=zvq_developer burst=12 nodelay;"), len(PAGES))
        self.assertEqual(domain.count("limit_req_status 429;"), len(PAGES))
        self.assertIn(RATE_ZONE + "\nserver {", domain)
        self.assertNotIn("proxy_pass http://127.0.0.1:80;", domain)
        self.assertNotIn("18447", ip)
        self.assertEqual(domain.count("proxy_set_header Host 127.0.0.1;"), len(PAGES))
        self.assertEqual(domain.count('proxy_set_header Authorization "";'), len(PAGES))

    def test_rejects_duplicate_or_unknown_tls_state(self):
        for invalid in (
            render(BASE), BASE.replace(DOMAIN_MARKER, ""),
            BASE.replace("server_name explorer.kriptoaman.com;", "server_name fake;"),
            BASE.replace("proxy_pass http://127.0.0.1:18446/;", "proxy_pass http://127.0.0.1:18446;"),
            BASE.replace("location = /rpc { return 403; }", "", 1),
            BASE.replace("location ^~ /api/ { return 403; }", "", 1),
            BASE.replace("location / { return 404; }", "", 1),
        ):
            with self.subTest(invalid=invalid[:45]), self.assertRaises(ValueError):
                render(invalid)

    def test_only_explicit_public_developer_routes(self):
        rendered = render(BASE).split(DOMAIN_MARKER, 1)[1]
        self.assertNotIn("location /developer", rendered)
        self.assertNotIn("location ^~ /developer", rendered)
        self.assertNotIn("proxy_pass https://rpc.kriptoaman.com", rendered)


    def test_inventory_is_read_only_and_flags_homepage_fallback(self):
        import contextlib
        import io
        import json
        from unittest.mock import patch
        import probe_zvq_developer_routes as probe
        dev = '<main data-kam-developer-version="1.0.0">ZVQ Developer</main>'
        def read(path):
            p = str(path)
            if p.endswith("/default.conf.template"):
                return "location = /developer {"
            if p.endswith("/default.conf"):
                return "# ZVQ_DOMAIN_RPC_V2_READONLY\nproxy_pass http://127.0.0.1:18446/;"
            if p.endswith("/kam-dashboard/index.html"):
                return '<main data-zevaryq-explorer-version="2.0.0">ZVQ</main>'
            if p.endswith("/kam-dashboard/developer.html"):
                return dev
            return ""
        fallback = '<main data-zevaryq-explorer-version="2.0.0">ZVQ</main>'
        with patch.object(probe, "_safe_read", side_effect=read), \
             patch("pathlib.Path.is_file", return_value=True), \
             patch.object(probe, "get", return_value=("200", fallback)) as read_page, \
             contextlib.redirect_stdout(io.StringIO()) as output:
            summary = probe.inventory()
        self.assertEqual(read_page.call_count, len(probe.PAGES))
        self.assertTrue(summary["protected_zvq_home_installed"])
        self.assertTrue(summary["tls_domain_rpc_preserved"])
        self.assertTrue(summary["port80_developer_exact_routes"]["/developer"])
        self.assertFalse(summary["port80_developer_exact_routes"]["/developer/starter"])
        self.assertFalse(summary["tls_developer_patch_present"])
        self.assertTrue(summary["backend"]["/developer"]["explorer_home_fallback"])
        self.assertFalse(summary["backend"]["/developer"]["zvq_content"])
        self.assertTrue(summary["page_files"]["/developer"]["reviewed_zvq_content"])
        self.assertEqual(json.loads(output.getvalue()), summary)
        self.assertNotIn("private", output.getvalue().lower())


class DeveloperDeploymentSourceTests(unittest.TestCase):
    def test_rejects_legacy_developer_assets_before_host_modification(self):
        import json
        import tempfile
        from unittest.mock import patch
        from probe_zvq_developer_routes import PAGES, SOURCE_FILES
        import repair_zvq_developer_https as deploy
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            for url, name in SOURCE_FILES.items():
                if name == "developer-network.json":
                    payload = {"chainId": 22028, "chainIdHex": "0x560c",
                               "nativeCurrency": {"symbol": "ZVQ"},
                               "publicDeveloperAccess": True,
                               "security": {"privateKeysRequired": False}}
                    (folder / name).write_text(json.dumps(payload))
                else:
                    # Legacy KAM can include identical version markers but must
                    # never qualify as reviewed ZVQ content.
                    marker = PAGES[url]
                    (folder / name).write_text("<main " + marker + ">KAM old branding</main>")
            with patch.object(deploy, "PUBLIC_ASSETS", folder):
                with self.assertRaisesRegex(RuntimeError, "Not verified ZVQ content"):
                    deploy.validate_sources()
            for url, name in SOURCE_FILES.items():
                if name != "developer-network.json":
                    (folder / name).write_text(
                        '<main ' + PAGES[url] + '>ZVQ Developer</main>')
            with patch.object(deploy, "PUBLIC_ASSETS", folder):
                assets = deploy.validate_sources()
                self.assertEqual(len(assets), 6)


    def test_post_deploy_rollback_restores_exact_original_and_removes_only_our_sidecar(self):
        import tempfile
        from unittest.mock import patch
        import repair_zvq_developer_https as deploy
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            config = root / "default.conf"
            old = BASE.encode()
            config.write_bytes((BASE + "\n# ZVQ_DEVELOPER_HTTPS_V1\n").encode())
            stage = root / "developer-static-12345678"
            stage.mkdir()
            (stage / "developer.html").write_text("ZVQ")
            gateway = root / "developer-static-gateway-12345678.mjs"
            gateway.write_text("approved-gateway")
            actions = []
            with patch.object(deploy, "CONFIG", config), \
                 patch.object(deploy, "owned_sidecar", return_value=True), \
                 patch.object(deploy, "cmd",
                              side_effect=lambda args, **_kw: actions.append(args) or ""), \
                 patch.object(deploy, "chain_ok", return_value=True), \
                 patch.object(deploy, "status", return_value="403"):
                deploy.restore(old, "12345678", stage, gateway)
            self.assertEqual(config.read_bytes(), old)
            self.assertFalse(stage.exists())
            self.assertFalse(gateway.exists())
            self.assertIn(["docker", "rm", "-f", deploy.DEV_GATEWAY], actions)
            self.assertIn(["docker", "exec", deploy.TLS, "nginx", "-t"], actions)
            self.assertIn(["docker", "exec", deploy.TLS, "nginx", "-s", "reload"], actions)

    def test_interrupted_or_partial_tls_update_restores_backup(self):
        source = (Path(__file__).resolve().parent.parent /
                  "scripts/repair_zvq_developer_https.py").read_text()
        self.assertIn("signal.signal(signal.SIGTERM, interrupted)", source)
        self.assertIn("signal.signal(signal.SIGINT, interrupted)", source)
        self.assertIn("finally:\n            if not committed:", source)
        self.assertLess(source.index("changed = True  # partial bind-mounted writes"),
                        source.index('CONFIG.write_bytes(candidate_text.encode("utf-8"))'))

    def test_read_only_rollback_and_namespace_contract(self):
        source = (Path(__file__).resolve().parent.parent /
                  "scripts/repair_zvq_developer_https.py").read_text()
        gateway = (Path(__file__).resolve().parent.parent /
                   "scripts/zvq-developer-static-gateway.mjs").read_text()
        self.assertIn('f"container:{TLS}"', source)
        self.assertIn('"--read-only"', source)
        self.assertIn('"--cap-drop", "ALL"', source)
        self.assertIn('CONFIG.write_bytes(before)', source)
        self.assertIn('"--rollback"', source)
        self.assertIn('immutable_gateway_image()', source)
        self.assertNotIn('docker compose up', source)
        self.assertNotIn('iptables', source)
        self.assertIn("Object.hasOwn(ROUTES, path)", gateway)
        self.assertIn("127.0.0.1", gateway)


if __name__ == "__main__":
    unittest.main()
