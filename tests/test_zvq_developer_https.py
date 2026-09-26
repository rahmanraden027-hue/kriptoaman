import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
from render_zvq_developer_https import DOMAIN_MARKER, MARKER, PAGES, render

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
        self.assertEqual(domain.count("proxy_pass http://127.0.0.1:80;"), len(PAGES))
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


if __name__ == "__main__":
    unittest.main()
