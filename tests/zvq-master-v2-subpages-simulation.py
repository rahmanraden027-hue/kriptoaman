"""Sandbox-only test for guarded ZVQ subpage publish, explicit rollback and fail-closed RPC.

The script runs against temporary directories and fake curl/hostname executables;
it never connects to a production host.
"""
from pathlib import Path
import os
import re
import subprocess
import tempfile

ORIGINAL=(Path(__file__).resolve().parents[1]/'scripts/deploy-zvq-master-v2-subpages.sh').read_text()
FILES=re.search(r'^FILES=\(([^)]+)\)$',ORIGINAL,re.M).group(1).split()
ASSET='/zevaryq-assets/zevaryq-master-v2.svg?v=20261008-zevaryq-identity-v2'

def check_case(bad_rpc=False,roll_back=False):
    with tempfile.TemporaryDirectory(prefix='zvq-master-v2-sandbox-') as folder:
        home=Path(folder)
        d=home/'proxy'/'kam-dashboard';d.mkdir(parents=True)
        src=home/'explorer-dashboard';src.mkdir()
        backup=home/'backups'
        bin_dir=home/'bin';bin_dir.mkdir()
        (home/'proxy'/'default.conf.template').write_text('protected nginx placeholder')
        root=b'<html data-zevaryq-explorer-version="1.1.2">protected root</html>'
        (d/'index.html').write_bytes(root)
        original={}
        for name in FILES:
            original[name]=('<html>legacy original '+name+'</html>').encode()
            (d/name).write_bytes(original[name])
            (src/name).write_text('<html><head><link rel="icon" href="'+ASSET+'"></head><body>'
                '<img src="'+ASSET+'" alt="ZEVARYQ Master V2 network emblem"> '+name+'</body></html>')
        (bin_dir/'hostname').write_text('#!/bin/sh\necho kam-explorer-blockscout-01\n')
        curl=bin_dir/'curl'
        curl.write_text("""#!/usr/bin/env bash
url=""
for arg in "$@"; do if [[ "$arg" == https://* ]]; then url="$arg"; fi; done
case "$url" in
 */rpc)
  if [[ "$SIM_FAIL_RPC" == 1 ]]; then echo '{"jsonrpc":"2.0","result":"0x1"}'; else echo '{"jsonrpc":"2.0","result":"0x560c"}'; fi ;;
 */api/v2/blocks) echo '{"items":[{"height":100}]}' ;;
 */zevaryq-assets/zevaryq-master-v2.svg*) exit 0 ;;
 *) echo "Unexpected network call: $url" >&2; exit 22 ;;
esac
""")
        for p in [curl,bin_dir/'hostname']:p.chmod(0o755)
        script=ORIGINAL
        replacements=[
            ('D=/opt/blockscout/docker-compose/proxy/kam-dashboard','D='+str(d)),
            ('TEMPLATE=/opt/blockscout/docker-compose/proxy/default.conf.template','TEMPLATE='+str(home/'proxy'/'default.conf.template')),
            ('BACKUPS=/var/backups/kriptoaman/zvq-master-v2-routes','BACKUPS='+str(backup)),
            ('[[ "$EUID" == 0 ]]','[[ 0 == 0 ]]'),
        ]
        for old,new in replacements:
            assert old in script,old
            script=script.replace(old,new,1)
        test_script=home/'deploy.sh';test_script.write_text(script)
        env=dict(os.environ,PATH=str(bin_dir)+os.pathsep+os.environ['PATH'],SIM_FAIL_RPC='1' if bad_rpc else '0')
        run=subprocess.run(['bash',str(test_script)],cwd=home,env=env,capture_output=True,text=True)
        if bad_rpc:
            assert run.returncode!=0,run.stdout+run.stderr
            for name in FILES:assert (d/name).read_bytes()==original[name],name
            assert (d/'index.html').read_bytes()==root
            return
        assert run.returncode==0,run.stdout+run.stderr
        for name in FILES:assert (d/name).read_bytes()==(src/name).read_bytes(),name
        assert (d/'index.html').read_bytes()==root
        assert len(list(backup.rglob('*.second-copy')))==len(FILES)
        if roll_back:
            stamp=re.search(r'ZVQ_MASTER_V2_SUBPAGES_DEPLOY_STAMP=(\w+)',run.stdout)
            assert stamp,run.stdout
            restored=subprocess.run(['bash',str(test_script),'--rollback',stamp.group(1)],
                cwd=home,env=env,capture_output=True,text=True)
            assert restored.returncode==0,restored.stdout+restored.stderr
            for name in FILES:assert (d/name).read_bytes()==original[name],name
            assert (d/'index.html').read_bytes()==root

if __name__=='__main__':
    assert len(FILES)==17
    check_case(roll_back=True)
    print('PASS: 17 HTML files deployed by hash then explicitly rolled back; homepage unchanged')
    check_case(bad_rpc=True)
    print('PASS: chain mismatch refuses every production write')
