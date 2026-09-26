"""Surgically replace only reviewed Developer paths in the existing Blockscout proxy.

The production template already contains six legacy exact Developer routes.
Never replace the homepage or touch any unrelated NGINX location.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

MARKER = "# ZVQ_DEVELOPER_BACKEND_V1"
BEGIN = "    " + MARKER + "_BEGIN\n"
END = "    " + MARKER + "_END\n"
PAGES = (
    ("/developer", "developer.html", "text/html"),
    ("/developers", "developer.html", "text/html"),
    ("/developer/docs", "developer-docs.html", "text/html"),
    ("/developer/examples", "developer-examples.html", "text/html"),
    ("/developer/verify", "developer-verify.html", "text/html"),
    ("/developer/starter", "developer-starter.html", "text/html"),
    ("/developer/network.json", "developer-network.json", "application/json"),
)


def erase_route(text: str, path: str) -> str:
    regex = re.compile(r"(?m)^[ \t]{4}location = " + re.escape(path) + r"[ \t]*\{[ \t]*$")
    matches = list(regex.finditer(text))
    if len(matches) > 1:
        raise ValueError(f"Duplicate existing exact route {path}; fail closed")
    if not matches:
        return text
    start = matches[0].start()
    pos = matches[0].end()
    depth = 1
    # Existing source is a reviewed NGINX template, not an arbitrary user upload.
    # Only literal brace characters outside quoted strings and comments count.
    quoted = False
    escaped = False
    comment = False
    while pos < len(text):
        ch = text[pos]
        if comment:
            if ch == "\n":
                comment = False
        elif escaped:
            escaped = False
        elif ch == "\\":
            escaped = True
        elif ch == '"':
            quoted = not quoted
        elif not quoted and ch == "#":
            comment = True
        elif not quoted and ch == "{":
            depth += 1
        elif not quoted and ch == "}":
            depth -= 1
            if depth == 0:
                tail = pos + 1
                if tail < len(text) and text[tail] == "\n":
                    tail += 1
                return text[:start] + text[tail:]
        pos += 1
    raise ValueError(f"Incomplete route {path}; fail closed")


def render(src: str) -> str:
    if BEGIN in src or END in src:
        raise ValueError("Developer backend patch already present; refuse double apply")
    if src.count("# KAM_EXPLORER_V2_BEGIN") != 1:
        raise ValueError("Unrecognized production backend; legacy V2 marker missing")
    needle = "    location / {\n"
    if src.count(needle) != 1:
        raise ValueError("Expected exactly one catch-all; refuse unexpected template")
    # Preserve the existing production homepage, every non-developer location,
    # and all CSP/security settings unrelated to the repaired seven exact routes.
    for path, _, _ in PAGES:
        src = erase_route(src, path)
    lines = [BEGIN]
    for path, name, mime in PAGES:
        lines.append(
            f"""    location = {path} {{
        limit_except GET {{ deny all; }}
        root /etc/nginx/templates;
        try_files /kam-dashboard/{name} =404;
        default_type {mime};
        add_header Cache-Control "no-store" always;
        add_header X-Content-Type-Options "nosniff" always;
    }}
"""
        )
    lines.append(END)
    result = src.replace(needle, "".join(lines) + needle, 1)
    for path, _, _ in PAGES:
        assert result.count(f"location = {path} {{") == 1, path
    return result


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: render_zvq_developer_backend.py source.conf candidate.conf")
    Path(sys.argv[2]).write_text(render(Path(sys.argv[1]).read_text()))
