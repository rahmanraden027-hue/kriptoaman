import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
from render_zvq_developer_backend import PAGES, erase_route, render

OLD = """server {
    # KAM_EXPLORER_V2_BEGIN
    location = / {
        root /etc/nginx/templates;
        try_files /kam-dashboard/index.html =404;
    }
    location = /developer {
        limit_except GET { deny all; }
        root /etc/nginx/templates;
        add_header Content-Security-Policy "style-src 'self' {trusted}";
        try_files /kam-dashboard/developer.html =404;
    }
    location = /developer/docs {
        limit_except GET { deny all; }
        root /etc/nginx/templates;
        try_files /kam-dashboard/developer-docs.html =404;
    }
    location = /developer/network.json {
        root /etc/nginx/templates;
        try_files /kam-dashboard/developer-network.json =404;
    }
    # KAM_EXPLORER_V2_END
    location ^~ /api/v2/ {
        proxy_pass http://blockscout;
    }
    location / {
        proxy_pass http://frontend;
    }
}
"""

class DeveloperBackendTests(unittest.TestCase):
    def test_exact_seven_routes_replace_legacy_without_changing_home_or_api(self):
        out = render(OLD)
        for route, filename, mimetype in PAGES:
            self.assertEqual(out.count(f"location = {route} {{"), 1)
            self.assertIn(f"try_files /kam-dashboard/{filename} =404;", out)
            self.assertIn(f"default_type {mimetype};", out)
        self.assertIn("location = / {\n        root /etc/nginx/templates;", out)
        self.assertIn("location ^~ /api/v2/ {\n        proxy_pass http://blockscout;", out)
        self.assertIn("location / {\n        proxy_pass http://frontend;", out)
        self.assertIn("limit_except GET { deny all; }", out)
        self.assertNotIn("style-src 'self' {trusted}", out)

    def test_fails_on_reapplication_and_unrecognized_template(self):
        out = render(OLD)
        with self.assertRaises(ValueError):
            render(out)
        with self.assertRaises(ValueError):
            render(OLD.replace("# KAM_EXPLORER_V2_BEGIN", "# unknown"))
        with self.assertRaises(ValueError):
            render(OLD.replace("location / {\n", "location /home {\n", 1).replace(
                "location / {\n        proxy_pass", "location /fallback {\n        proxy_pass"))

    def test_fails_on_duplicate_developer_routes(self):
        dup = OLD.replace("    # KAM_EXPLORER_V2_END",
                          "    location = /developer { return 200; }\n    # KAM_EXPLORER_V2_END")
        # Inline unexpected route isn't replaced; renderer fails its exactly-once output assertion.
        with self.assertRaises((AssertionError, ValueError)):
            render(dup)

    def test_incomplete_existing_route_must_fail_closed(self):
        bad = OLD.replace("    location = /developer/docs {", "    location = /developer/docs {{{")
        with self.assertRaises(ValueError):
            render(bad)

if __name__ == "__main__":
    unittest.main()
