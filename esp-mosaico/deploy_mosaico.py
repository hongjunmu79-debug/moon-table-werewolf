"""Push the board_game Lua app to an ESP-Mosaico over Wi-Fi (no USB needed).

usage:  python deploy_mosaico.py [--device 192.168.3.10] [--server http://192.168.3.7:8080] [--room latest]

Uploads launcher.json + scripts + icon to /apps/board_game (and /skills/board_game),
then writes /board_game/config.json telling the board which table server to poll.
"""
import argparse, json, os, sys, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.join(HERE, "board_game")
OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))  # bypass Clash for LAN


def call(dev, method, path, body=None, ctype="application/octet-stream"):
    req = urllib.request.Request(f"http://{dev}{path}", data=body, method=method)
    if body is not None:
        req.add_header("Content-Type", ctype)
    try:
        with OPENER.open(req, timeout=15) as r:
            return r.status, r.read().decode("utf-8", "ignore")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "ignore")


def mkdir(dev, path):
    q = urllib.parse.quote(path)
    for m, p, b, ct in (("POST", f"/api/files/mkdir?path={q}", b"", "application/octet-stream"),
                        ("POST", "/api/files/mkdir", json.dumps({"path": path}).encode(), "application/json")):
        s, t = call(dev, m, p, b, ct)
        if s < 300 or "exist" in t.lower():
            return True
    print(f"  mkdir {path}: {s} {t[:120]}")
    return False


def upload(dev, path, data):
    s, t = call(dev, "POST", f"/api/files/upload?path={urllib.parse.quote(path)}", data)
    ok = s < 300
    print(f"  {'OK ' if ok else 'ERR'} {path} ({len(data)} B){'' if ok else f' -> {s} {t[:160]}'}")
    return ok


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--device", default="192.168.3.10")
    ap.add_argument("--server", default="http://192.168.3.7:8080")
    ap.add_argument("--room", default="latest")
    a = ap.parse_args()

    s, t = call(a.device, "GET", "/api/status")
    if s != 200:
        sys.exit(f"device {a.device} not reachable: {s} {t[:200]}")
    print("device:", t)

    files = []
    for dp, _, fs in os.walk(APP):
        for f in fs:
            full = os.path.join(dp, f)
            files.append((os.path.relpath(full, APP).replace("\\", "/"), open(full, "rb").read()))

    ok = True
    for base in ("/apps/board_game", "/skills/board_game"):
        print("->", base)
        for d in (base, base + "/scripts", base + "/assets"):
            mkdir(a.device, d)
        for rel, data in files:
            ok &= upload(a.device, f"{base}/{rel}", data)

    mkdir(a.device, "/board_game")
    cfg = json.dumps({"server": a.server, "room": a.room}).encode()
    ok &= upload(a.device, "/board_game/config.json", cfg)
    print("DONE" if ok else "FINISHED WITH ERRORS")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
