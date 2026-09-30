#!/usr/bin/env python3
import argparse, base64, hashlib, json, os, socket, ssl, struct, time
from urllib.parse import urlparse

GUID="258EAFA5-E914-47DA-95CA-C5AB0DC85B11"

def recv_exact(sock,n):
    out=b""
    while len(out)<n:
        part=sock.recv(n-len(out))
        if not part: raise ConnectionError("unexpected EOF")
        out+=part
    return out

def send_text(sock,text):
    payload=text.encode()
    key=os.urandom(4)
    n=len(payload)
    head=bytearray([0x81])
    if n<126: head.append(0x80|n)
    elif n<65536: head.extend([0x80|126]); head.extend(struct.pack("!H",n))
    else: head.extend([0x80|127]); head.extend(struct.pack("!Q",n))
    head.extend(key)
    masked=bytes(b ^ key[i%4] for i,b in enumerate(payload))
    sock.sendall(bytes(head)+masked)

def send_pong(sock,payload):
    key=os.urandom(4); n=len(payload); head=bytearray([0x8A,0x80|n]); head.extend(key)
    sock.sendall(bytes(head)+bytes(b ^ key[i%4] for i,b in enumerate(payload)))

def recv_frame(sock):
    b1,b2=recv_exact(sock,2)
    opcode=b1&0x0f; masked=bool(b2&0x80); n=b2&0x7f
    if n==126: n=struct.unpack("!H",recv_exact(sock,2))[0]
    elif n==127: n=struct.unpack("!Q",recv_exact(sock,8))[0]
    key=recv_exact(sock,4) if masked else b""
    payload=recv_exact(sock,n) if n else b""
    if masked: payload=bytes(b ^ key[i%4] for i,b in enumerate(payload))
    return opcode,payload

def connect(url, timeout):
    u=urlparse(url)
    if u.scheme not in ("ws","wss") or not u.hostname: raise ValueError("invalid websocket URL")
    port=u.port or (443 if u.scheme=="wss" else 80)
    raw=socket.create_connection((u.hostname,port),timeout=timeout)
    raw.settimeout(timeout)
    sock=ssl.create_default_context().wrap_socket(raw,server_hostname=u.hostname) if u.scheme=="wss" else raw
    key=base64.b64encode(os.urandom(16)).decode()
    target=u.path or "/"
    if u.query: target+="?"+u.query
    req=(
        f"GET {target} HTTP/1.1\r\n"
        f"Host: {u.hostname}{(':'+str(port)) if port not in (80,443) else ''}\r\n"
        "Upgrade: websocket\r\nConnection: Upgrade\r\n"
        f"Sec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n"
        "Origin: https://explorer.kriptoaman.com\r\n\r\n"
    ).encode()
    sock.sendall(req)
    buf=b""
    while b"\r\n\r\n" not in buf and len(buf)<16384: buf+=sock.recv(4096)
    header=buf.split(b"\r\n\r\n",1)[0].decode("latin1")
    if not header.startswith("HTTP/1.1 101") and not header.startswith("HTTP/1.0 101"):
        raise ConnectionError("handshake failed: "+header.split("\r\n",1)[0])
    accept=None
    for line in header.split("\r\n")[1:]:
        if line.lower().startswith("sec-websocket-accept:"): accept=line.split(":",1)[1].strip()
    expected=base64.b64encode(hashlib.sha1((key+GUID).encode()).digest()).decode()
    if accept!=expected: raise ConnectionError("invalid Sec-WebSocket-Accept")
    return sock

def probe(url, timeout):
    sock=connect(url,timeout)
    deadline=time.monotonic()+timeout
    joined=False
    send_text(sock,json.dumps(["1","1","blocks:new_block","phx_join",{}],separators=(",",":")))
    try:
        while time.monotonic()<deadline:
            sock.settimeout(max(0.2,deadline-time.monotonic()))
            opcode,payload=recv_frame(sock)
            if opcode==9:
                send_pong(sock,payload); continue
            if opcode==8: raise ConnectionError("server closed websocket")
            if opcode!=1: continue
            try: msg=json.loads(payload.decode())
            except Exception: continue
            if not isinstance(msg,list) or len(msg)<5: continue
            _,_,topic,event,body=msg[:5]
            if topic=="blocks:new_block" and event=="phx_reply" and isinstance(body,dict) and body.get("status")=="ok":
                joined=True
                continue
            if topic=="blocks:new_block" and event=="new_block":
                number=None
                if isinstance(body,dict):
                    b=body.get("block") if isinstance(body.get("block"),dict) else body
                    number=b.get("height",b.get("number")) if isinstance(b,dict) else None
                return {"ok":True,"joined":joined,"event":"new_block","blockNumber":number}
        raise TimeoutError("joined but no new_block event" if joined else "join timeout")
    finally:
        try: sock.close()
        except Exception: pass

def main():
    p=argparse.ArgumentParser()
    p.add_argument("urls",nargs="+")
    p.add_argument("--timeout",type=float,default=35.0)
    args=p.parse_args()
    last=None
    for url in args.urls:
        try:
            result=probe(url,args.timeout)
            print(json.dumps({"url":url.split("?",1)[0],**result},separators=(",",":")))
            print("qoryvex_phoenix_websocket=pass")
            return 0
        except Exception as e:
            last=str(e); print(json.dumps({"url":url.split("?",1)[0],"ok":False,"error":last},separators=(",",":")))
    print("qoryvex_phoenix_websocket=failed "+str(last),file=__import__("sys").stderr)
    return 1

if __name__=="__main__": raise SystemExit(main())
