#!/usr/bin/env bash
set -Eeuo pipefail
SCRIPT="$(cd "$(dirname "$0")/.." && pwd)/scripts/repair-zevaryq-assets-nginx.sh"
bash -n "$SCRIPT"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
cat > "$tmp/original" <<'NGINX'
server {
    listen 18080;
    location ^~ /.well-known/acme-challenge/ {
        root /etc/nginx/templates;
        try_files /kam-dashboard$uri =404;
    }
    location = / {
        root /etc/nginx/templates;
        try_files /kam-dashboard/index.html =404;
    }
    location / {
        try_files /kam-dashboard/index.html =404;
    }
}
NGINX
bash "$SCRIPT" --render-only "$tmp/original" "$tmp/patched"
python3 - "$tmp/original" "$tmp/patched" <<'PY'
from pathlib import Path
import sys
before, after = (Path(p).read_text() for p in sys.argv[1:3])
assert after.count('location ^~ /zevaryq-assets/') == 1
assert 'root /etc/nginx/templates/kam-dashboard;' in after
assert 'types { image/webp webp; image/png png; }' in after
assert 'try_files $uri =404;' in after
assert 'location ^~ /.well-known/acme-challenge/' in after
assert before in after.replace(after[after.index('    location ^~ /zevaryq-assets/'):after.index('    location = / {')], '', 1)
assert before == Path(sys.argv[1]).read_text(), 'test renderer mutated its source'
PY
if bash "$SCRIPT" --render-only "$tmp/patched" "$tmp/duplicate" 2>/dev/null; then
  echo 'Repeated injection unexpectedly succeeded' >&2; exit 1
fi
if command -v nginx >/dev/null; then
  printf 'pid %s/nginx.pid;\nerror_log stderr notice;\nevents {}\nhttp { access_log off; include /etc/nginx/mime.types; include %s; }\n' "$tmp" "$tmp/patched" > "$tmp/nginx.conf"
  nginx -t -c "$tmp/nginx.conf"
fi
echo 'PASS: isolated static route, protected ACME/homepage, no duplicate, NGINX syntax (if installed)'