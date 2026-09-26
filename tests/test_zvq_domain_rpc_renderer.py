import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
from render_zvq_domain_rpc import DOMAIN_ROUTE, MARKER, RATE_ZONE, render

IP = """server {
 listen 443 ssl default_server;
 server_name 146.190.93.254;
 add_header X-ZVQ-Origin "standalone-ip-readonly" always;
 location = /rpc { return 403; }
 location ^~ /api/ { return 403; }
}
"""
DOMAIN = """server {
 listen 443 ssl;
 server_name explorer.kriptoaman.com;
 add_header X-ZVQ-Origin "standalone-domain-readonly" always;
 location = /rpc { return 403; }
 location ^~ /api/ { return 403; }
}
"""
ORIGINAL = IP + "\n" + MARKER + "\n" + DOMAIN


class DomainRpcRendererTests(unittest.TestCase):
    def test_only_domain_sni_gets_scoped_readonly_gateway(self):
        candidate = render(ORIGINAL)
        fallback, domain = candidate.split(MARKER, 1)
        self.assertIn(IP, fallback)
        self.assertIn("location = /rpc { return 403; }", fallback)
        self.assertNotIn("proxy_pass", fallback)
        self.assertEqual(domain.count("location = /rpc { return 403; }"), 0)
        self.assertIn(DOMAIN_ROUTE, domain)
        self.assertIn("proxy_pass https://rpc.kriptoaman.com/;", domain)
        self.assertIn("proxy_ssl_verify on;", domain)
        self.assertIn("limit_except POST { deny all; }", domain)
        self.assertIn(RATE_ZONE, candidate)
        self.assertIn("standalone-domain-rpc-readonly", domain)
        self.assertIn("location ^~ /api/ { return 403; }", domain)
        self.assertNotIn("proxy_set_header Authorization $", domain)

    def test_refuses_unrecognized_or_incomplete_https_config(self):
        for cfg in (
            ORIGINAL.replace(MARKER, ""),
            ORIGINAL.replace("server_name explorer.kriptoaman.com;", "server_name wrong.example;"),
            ORIGINAL.replace("location = /rpc { return 403; }", "", 1),
            ORIGINAL.replace("location ^~ /api/ { return 403; }", "", 1),
            ORIGINAL + DOMAIN,
        ):
            with self.subTest(cfg=cfg[:30]), self.assertRaises(ValueError):
                render(cfg)

    def test_does_not_reapply_over_existing_gateway(self):
        with self.assertRaises(ValueError):
            render(render(ORIGINAL))


if __name__ == "__main__":
    unittest.main()
