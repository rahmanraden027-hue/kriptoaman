import contextlib
import io
import json
import sys
import unittest
from unittest.mock import patch
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
from render_zvq_domain_rpc import DOMAIN_ROUTE, MARKER, RATE_ZONE, render
import repair_zvq_domain_rpc as repair

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
        self.assertIn("proxy_pass http://127.0.0.1:18446/;", domain)
        # NGINX proxy_pass with a URI replaces exact /rpc with /.
        # The gateway deliberately rejects any path other than /.
        self.assertNotIn("proxy_pass http://127.0.0.1:18446;", domain)
        self.assertNotIn("proxy_pass https://", domain)
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


class DirectOriginProbeTests(unittest.TestCase):
    def test_all_four_direct_origin_probes_and_chain_must_pass(self):
        import contextlib
        import io
        import json
        from unittest.mock import patch, call
        from repair_zvq_domain_rpc import verify_local

        with patch("repair_zvq_domain_rpc.rpc_status", return_value="200") as rpc_http, \
             patch("repair_zvq_domain_rpc.status", side_effect=["403", "403", "200"]) as http, \
             patch("repair_zvq_domain_rpc.rpc_probe", return_value=True) as chain, \
             contextlib.redirect_stdout(io.StringIO()) as output:
            self.assertTrue(verify_local())
            evidence = json.loads(output.getvalue())
        self.assertEqual(evidence["direct_origin_probes"],
                         {"domain_rpc": "200", "ip_rpc": "403",
                          "ip_api_admin": "403", "origin_home": "200"})
        self.assertTrue(evidence["domain_rpc_chain_22028"])
        rpc_http.assert_called_once_with(
            "https://explorer.kriptoaman.com/rpc", "eth_chainId", resolve=True)
        self.assertEqual(http.call_args_list, [
            call("https://146.190.93.254/rpc"),
            call("https://146.190.93.254/api/admin"),
            call("https://explorer.kriptoaman.com/", resolve=True),
        ])
        chain.assert_called_once_with("https://explorer.kriptoaman.com/rpc", resolve=True)

    def test_timeout_does_not_hide_other_three_probe_results(self):
        import contextlib
        import io
        import json
        import subprocess
        from unittest.mock import patch
        from repair_zvq_domain_rpc import verify_local

        failure = subprocess.CalledProcessError(28, ["curl"])
        with patch("repair_zvq_domain_rpc.rpc_status", side_effect=failure), \
             patch("repair_zvq_domain_rpc.status", side_effect=["403", "502", "200"]) as http, \
             patch("repair_zvq_domain_rpc.rpc_probe") as chain, \
             contextlib.redirect_stdout(io.StringIO()) as output:
            self.assertFalse(verify_local())
            evidence = json.loads(output.getvalue())
        self.assertEqual(evidence["direct_origin_probes"],
                         {"domain_rpc": "curl_exit_28", "ip_rpc": "403",
                          "ip_api_admin": "502", "origin_home": "200"})
        self.assertEqual(http.call_count, 3)
        chain.assert_not_called()

    def test_explicit_domain_origin_resolution(self):
        from unittest.mock import patch
        from repair_zvq_domain_rpc import rpc_status, status

        with patch("repair_zvq_domain_rpc.cmd", return_value="200") as run:
            self.assertEqual(status("https://explorer.kriptoaman.com/", resolve=True), "200")
            args = run.call_args.args[0]
            self.assertIn("--resolve", args)
            self.assertIn("explorer.kriptoaman.com:443:146.190.93.254", args)
            self.assertEqual(rpc_status("https://explorer.kriptoaman.com/rpc",
                                        "eth_chainId", resolve=True), "200")
            args = run.call_args.args[0]
            self.assertIn("--resolve", args)
            self.assertIn("explorer.kriptoaman.com:443:146.190.93.254", args)



class FourIndependentProbeTests(unittest.TestCase):
    def test_reports_all_four_direct_origin_results(self):
        calls = []

        def rpc_status(url, method, *, resolve=False):
            calls.append(("rpc", url, method, resolve))
            return "404"

        def status(url, *, resolve=False):
            calls.append(("http", url, resolve))
            return {"https://146.190.93.254/rpc": "403",
                    "https://146.190.93.254/api/admin": "403",
                    "https://explorer.kriptoaman.com/": "200"}[url]

        with patch.object(repair, "rpc_status", side_effect=rpc_status), \
             patch.object(repair, "status", side_effect=status), \
             patch.object(repair, "rpc_probe") as chain_probe:
            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                passed = repair.verify_local()
        self.assertFalse(passed)
        chain_probe.assert_not_called()
        self.assertEqual(json.loads(output.getvalue()), {
            "direct_origin_probes": {"domain_rpc": "404", "ip_rpc": "403",
                                     "ip_api_admin": "403", "origin_home": "200"},
            "domain_rpc_chain_22028": False})
        self.assertEqual(calls, [
            ("rpc", "https://explorer.kriptoaman.com/rpc", "eth_chainId", True),
            ("http", "https://146.190.93.254/rpc", False),
            ("http", "https://146.190.93.254/api/admin", False),
            ("http", "https://explorer.kriptoaman.com/", True)])

    def test_all_four_success_with_verified_chain(self):
        with patch.object(repair, "rpc_status", return_value="200"), \
             patch.object(repair, "status", side_effect=["403", "403", "200"]), \
             patch.object(repair, "rpc_probe", return_value=True) as chain_probe:
            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                passed = repair.verify_local()
        self.assertTrue(passed)
        chain_probe.assert_called_once_with(
            "https://explorer.kriptoaman.com/rpc", resolve=True)
        self.assertTrue(json.loads(output.getvalue())["domain_rpc_chain_22028"])

    def test_failed_curl_does_not_suppress_other_probes(self):
        import subprocess
        with patch.object(repair, "rpc_status",
                          side_effect=subprocess.CalledProcessError(7, ["curl"])), \
             patch.object(repair, "status", side_effect=["403", "403", "200"]), \
             patch.object(repair, "rpc_probe") as chain_probe:
            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                passed = repair.verify_local()
        self.assertFalse(passed)
        chain_probe.assert_not_called()
        self.assertEqual(json.loads(output.getvalue())["direct_origin_probes"], {
            "domain_rpc": "curl_exit_7", "ip_rpc": "403",
            "ip_api_admin": "403", "origin_home": "200"})


if __name__ == "__main__":
    unittest.main()
