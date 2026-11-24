"""One-off noncommercial catalog diagnostic. No production credentials,
third-party API crawling, dataset publication or raw provider logging."""
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit, unquote
from urllib.request import Request, build_opener, HTTPRedirectHandler
from pathlib import Path
from tempfile import TemporaryDirectory
import hashlib
import json
import os
import re
import subprocess

DOCUMENT = "https://mangabaka.org/developers/dumps"
FILENAME = "series.jsonl.zst"
MAX_COMPRESSED = 512 * 1024 * 1024
MAX_DECOMPRESSED = 4 * 1024 * 1024 * 1024

def official(url):
    p = urlsplit(url)
    return (p.scheme == "https" and not p.username and not p.password
            and p.port is None and (p.hostname == "mangabaka.org"
            or bool(p.hostname and p.hostname.endswith(".mangabaka.org"))))

class OfficialRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if not official(newurl):
            raise ValueError("Download redirected outside the documented official domain")
        return super().redirect_request(req, fp, code, msg, headers, newurl)

OPENER = build_opener(OfficialRedirect)
def fetch(url):
    if not official(url):
        raise ValueError("Unverified download origin")
    return OPENER.open(Request(url, headers={
        "User-Agent": "Yomirra-Noncommercial-Catalog-Validation/1.0",
        "Accept": "*/*",
    }), timeout=30)

class DownloadTable(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.rows = []
        self.row = None
        self.anchor = None

    def handle_starttag(self, tag, attrs):
        if tag == "tr":
            self.row = []
        elif tag == "a" and self.row is not None:
            self.anchor = [dict(attrs).get("href", ""), ""]

    def handle_data(self, data):
        if self.anchor is not None:
            self.anchor[1] += data

    def handle_endtag(self, tag):
        if tag == "a" and self.anchor is not None and self.row is not None:
            self.row.append(self.anchor)
            self.anchor = None
        elif tag == "tr" and self.row is not None:
            self.rows.append(self.row)
            self.row = None
            self.anchor = None

def discover_download(html):
    table = DownloadTable()
    table.feed(html)
    matches = []
    for row in table.rows:
        files = [href for href, label in row
                 if label.strip() == FILENAME]
        checksums = [href for href, label in row if label.strip().lower() == "sha1"]
        if len(files) == 1 and len(checksums) == 1:
            data, digest = (urljoin(DOCUMENT, path) for path in [files[0], checksums[0]])
            if not official(data) or not official(digest):
                raise ValueError("Unverified download origin")
            if Path(unquote(urlsplit(data).path)).name != FILENAME:
                raise ValueError("Unexpected dump filename")
            matches.append((data, digest))
    if len(matches) != 1:
        raise ValueError("Official default JSONL download/checksum row unavailable")
    return matches[0]

def expected_sha1(text):
    # Accept the documented checksum file, with or without a filename.
    m = re.fullmatch(r"\s*([a-fA-F0-9]{40})(?:[ \t]+[*]?[^\r\n]+)?\s*", text)
    if not m:
        raise ValueError("Invalid official checksum")
    return m.group(1).lower()

def download_checked(url, destination, expected):
    digest = hashlib.sha1()
    size = 0
    with fetch(url) as response, destination.open("xb") as file:
        length = response.headers.get("Content-Length")
        if length is not None and int(length) > MAX_COMPRESSED:
            raise ValueError("Compressed dump exceeds diagnostic limit")
        while block := response.read(1024 * 1024):
            size += len(block)
            if size > MAX_COMPRESSED:
                raise ValueError("Compressed dump exceeds diagnostic limit")
            digest.update(block)
            file.write(block)
    if digest.hexdigest() != expected:
        raise ValueError("Official dump checksum mismatch")
    return size

def decompress_checked(compressed, output):
    size = 0
    child = subprocess.Popen(["zstd", "-q", "-d", "-c", str(compressed)],
                             stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    try:
        with output.open("xb") as file:
            while block := child.stdout.read(1024 * 1024):
                size += len(block)
                if size > MAX_DECOMPRESSED:
                    raise ValueError("Decompressed dump exceeds diagnostic limit")
                file.write(block)
        if child.wait() != 0:
            raise ValueError("Official dump decompression failed")
    finally:
        if child.poll() is None:
            child.kill()
            child.wait()
        child.stdout.close()
    return size

def main():
    with TemporaryDirectory(prefix="yomirra-catalog-") as folder:
        root = Path(folder)
        with fetch(DOCUMENT) as response:
            html = response.read(2 * 1024 * 1024 + 1)
        if len(html) > 2 * 1024 * 1024:
            raise ValueError("Documentation page exceeds limit")
        data, checksum = discover_download(html.decode("utf8"))
        with fetch(checksum) as response:
            expected = expected_sha1(response.read(1024).decode("ascii"))
        packed = root / FILENAME
        packed_size = download_checked(data, packed, expected)
        print(json.dumps({"stage":"official_dump_verified","compressedBytes":packed_size,
                          "sha1":expected}), flush=True)
        jsonl = root / "series.jsonl"
        uncompressed_size = decompress_checked(packed, jsonl)
        index = root / "canonical.sqlite"
        # This isolated non-commercial diagnostic only imports top-level
        # MangaBaka fields. The disposable runner never receives user data.
        result = subprocess.run(
            ["node", "scripts/build-mangabaka-index.mjs", str(jsonl), str(index)],
            env={**os.environ, "YOMIRRA_MANGABAKA_METADATA":"permitted"},
            capture_output=True, text=True, timeout=480, check=False)
        if result.returncode:
            raise ValueError("Normalized index build failed; no raw records published")
        report = json.loads(result.stdout)
        size = index.stat().st_size
        report.update({"stage":"isolated_index_verified","officialSha1":expected,
                       "compressedBytes":packed_size,"uncompressedBytes":uncompressed_size,
                       "indexBytes":size,"fitsCurrentRuntimeLimit":size<=200*1024*1024,
                       "productionActivated":False,"benchmarkPass":False})
        print(json.dumps(report), flush=True)

if __name__ == "__main__":
    main()
