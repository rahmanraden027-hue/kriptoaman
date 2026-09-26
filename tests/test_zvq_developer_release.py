import inspect
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
from deploy_zvq_developer_only import MARKER, PAGES, STARTER_ROUTE, render_backend, check_sources
from render_zvq_developer_https import DOMAIN_MARKER, render as render_tls

SIX = tuple(p for p in PAGES if p != "/developer/starter")
TEMPLATE = (
    "server {\n"
    "    # KAM_EXPLORER_V2_BEGIN\n"
    + "".join("    location = " + path + " {\n        limit_except GET { deny all; }\n    }\n" for path in SIX)
    + "    # KAM_EXPLORER_V2_END\n"
    "    location / {\n        proxy_pass http://frontend;\n    }\n"
    "}\n"
)
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
TLS = IP + "\n" + DOMAIN_MARKER + "\n" + DOMAIN


class DeveloperOnlyReleaseContract(unittest.TestCase):
    def test_adds_exact_starter_without_replacing_protected_home(self):
        result = render_backend(TEMPLATE)
        self.assertIn("location = /developer/starter {", result)
        self.assertIn("try_files /kam-dashboard/developer-starter.html =404;", result)
        self.assertIn("limit_except GET { deny all; }", result)
        self.assertEqual(result.count(MARKER), 1)
        self.assertEqual(result.count("location / {"), 1)
        for path in SIX:
            self.assertEqual(result.count("location = " + path + " {"), 1)
        self.assertEqual(result.replace(STARTER_ROUTE, ""), TEMPLATE)

    def test_refuses_ambiguous_route_layout_or_second_apply(self):
        for invalid in (
            render_backend(TEMPLATE),
            TEMPLATE.replace("# KAM_EXPLORER_V2_BEGIN", ""),
            TEMPLATE.replace("# KAM_EXPLORER_V2_END", ""),
            TEMPLATE.replace("location = /developer/docs {", "location = /other {"),
            TEMPLATE + "location = /developer/starter {}\n",
            TEMPLATE.replace("location = /developer {", "location = /developer/starter {"),
        ):
            with self.subTest(invalid=invalid[:45]), self.assertRaises(ValueError):
                render_backend(invalid)

    def test_preserves_ip_fallback_and_live_domain_rpc_config(self):
        candidate = render_tls(TLS)
        old_ip, old_domain = TLS.split(DOMAIN_MARKER, 1)
        new_ip, new_domain = candidate.split(DOMAIN_MARKER, 1)
        self.assertEqual(new_ip, old_ip)
        self.assertIn("location = /rpc {\n   proxy_pass http://127.0.0.1:18446/;\n }", new_domain)
        self.assertEqual(new_domain.count("proxy_pass http://127.0.0.1:18446/;"), 1)
        self.assertEqual(candidate.count("location = /rpc { return 403; }"), 1)
        self.assertEqual(new_domain.count("location = /developer/starter {"), 1)
        self.assertNotIn("location ^~ /developer", new_domain)
        self.assertEqual(new_domain.count("limit_except GET { deny all; }"), len(PAGES))

    def test_reviewed_sources_are_all_zvq_and_officially_branded(self):
        sources = check_sources()
        self.assertEqual(set(sources), set(PAGES))
        self.assertEqual(sources["/developer/starter"], "developer-starter.html")
        dev = Path("explorer-dashboard/developer.html").read_text()
        verify = Path("explorer-dashboard/developer-verify.html").read_text()
        self.assertIn('src="/zevaryq-assets/zevaryq-emblem.webp', dev)
        self.assertIn('data-copy="https://rpc.kriptoaman.com"', dev)
        self.assertNotIn('href="https://rpc.kriptoaman.com">Open RPC Console', dev)
        self.assertNotIn("KAM Contract Verification", verify)
        self.assertIn("ZVQ Contract Verification", verify)

    def test_deployment_requires_manual_confirmation_and_keeps_rollback(self):
        script = inspect.getsource(sys.modules["deploy_zvq_developer_only"])
        workflow = Path(".github/workflows/zvq-developer-only-deploy.yml").read_text()
        self.assertIn("ZVQ_DEV_RUN_ID", script)
        self.assertIn("backup.mkdir", script)
        self.assertIn('"--no-deps", "proxy"', script)
        self.assertIn("TLS.write_bytes(tls_before.encode", script)
        self.assertIn("backend_before, encoding", script)
        self.assertIn("Developer-only rollback completed", script)
        self.assertNotIn("eth_sendRawTransaction", script)
        self.assertNotIn("ufw", script)
        self.assertIn("workflow_dispatch:", workflow)
        self.assertIn("DEPLOY-ZVQ-DEVELOPER-ONLY", workflow)
        self.assertIn("github.ref == 'refs/heads/main'", workflow)
        self.assertNotIn("\n  push:", workflow)
        self.assertIn("public-post-verify:", workflow)


if __name__ == "__main__":
    unittest.main()
