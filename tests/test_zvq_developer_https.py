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


if __name__ == "__main__":
    unittest.main()
