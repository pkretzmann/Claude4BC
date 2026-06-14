"""Lokal dokumentations-server uden browser-cache.

Pythons indbyggede http.server sender Last-Modified og svarer 304 Not Modified
paa betingede forespoergsler, saa browseren genbruger gamle (cachede) sider —
isaer i portalens fetch-baserede indhold. Denne server saetter no-store-headers
og fjerner betingede headere, saa hver indlaesning altid er frisk (ingen Ctrl+F5).

Brug:  python serve.py [port] [directory]
  port       lytteport (standard 8765)
  directory  mappe der serveres (standard: aktuel mappe)

Kaldes af "Start dokumentation.cmd" (cwd = .website) og af .claude/launch.json
(kører fra git-roden og peger paa .website via directory-argumentet).
"""
import sys
import functools
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def send_head(self):
        # Fjern betingede headere, saa basisklassen aldrig kan svare 304.
        # del paa en manglende noegle er en no-op for HTTP-besked-headere.
        del self.headers["If-Modified-Since"]
        del self.headers["If-None-Match"]
        return super().send_head()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    directory = sys.argv[2] if len(sys.argv) > 2 else None
    handler = functools.partial(NoCacheHandler, directory=directory) if directory else NoCacheHandler
    # ThreadingHTTPServer: hver forespoergsel i sin egen traad, saa portalens
    # mange samtidige fetch-kald (fuldtekst-indeks) + iframe-load ikke overloeber
    # serverens backlog og giver "connection refused".
    httpd = ThreadingHTTPServer(("127.0.0.1", port), handler)
    httpd.daemon_threads = True
    print(f"Dokumentation (no-cache) paa http://localhost:{port}/  - stop med Ctrl+C")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
