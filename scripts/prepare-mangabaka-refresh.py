"""Operator-side candidate preparation; never deploy, upload, or mutate prior data.
Requires Python 3, zstd, Node 22. Run from repository root.
"""
from pathlib import Path
from tempfile import TemporaryDirectory
import argparse
import hashlib
import importlib.util
import json
import os
import re
import subprocess

SPEC = importlib.util.spec_from_file_location("dump", Path(__file__).with_name("validate-mangabaka-dump.py"))
dump = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(dump)

def sha256(path):
    result = hashlib.sha256()
    with path.open("rb") as file:
        while block := file.read(1024 * 1024):
            result.update(block)
    return result.hexdigest()

def previous_snapshot(folder):
    if folder is None:
        return None, None
    folder = Path(folder).resolve(strict=True)
    index, report = folder / "catalog.sqlite", folder / "manifest.json"
    if not index.is_file() or not report.is_file() or report.stat().st_size > 65536:
        raise ValueError("Previous candidate files missing")
    data = json.loads(report.read_text("utf8"))
    if (data.get("schemaVersion") != 2 or data.get("provider") != "mangabaka"
            or data.get("license") != "CC-BY-NC-SA-4.0"
            or not re.fullmatch("[a-f0-9]{40}", data.get("officialSha1", ""))
            or data.get("indexBytes") != index.stat().st_size
            or data.get("indexSha256") != sha256(index)):
        raise ValueError("Previous snapshot integrity mismatch")
    return index, data

def prepare(output, previous=None):
    if os.environ.get("YOMIRRA_MANGABAKA_METADATA") != "permitted":
        raise ValueError("Confirm noncommercial permitted use and attribution first")
    output = Path(output).resolve()
    if output.exists():
        raise ValueError("Use a new candidate path; no overwrites")
    old, old_report = previous_snapshot(previous)
    with dump.fetch(dump.DOCUMENT) as response:
        html = response.read(2 * 1024 * 1024 + 1)
    if len(html) > 2 * 1024 * 1024:
        raise ValueError("Documentation response too large")
    data, checksum = dump.discover_download(html.decode("utf8"))
    with dump.fetch(checksum) as response:
        expected = dump.expected_sha1(response.read(1024).decode("ascii"))
    if old_report and old_report["officialSha1"] == expected:
        return {"status":"UNCHANGED", "officialSha1":expected,
                "downloaded":False, "productionActivated":False}
    # Build in an isolated directory beside the destination, then publish
    # only new candidate files. Existing snapshots are read-only inputs.
    output.parent.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory(prefix="yomirra-refresh-", dir=output.parent) as temp:
        root = Path(temp)
        packed = root / dump.FILENAME
        compressed = dump.download_checked(data, packed, expected)
        raw = root / "series.jsonl"
        expanded = dump.decompress_checked(packed, raw)
        index = root / "catalog.sqlite"
        cmd = ["node", str(Path(__file__).with_name("build-mangabaka-index.mjs")), str(raw), str(index)]
        if old:
            cmd.append(str(old))
        build = subprocess.run(cmd, capture_output=True, text=True, check=False, timeout=480)
        if build.returncode:
            raise ValueError("Candidate build rejected; previous snapshot retained")
        report = json.loads(build.stdout)
        report.update({"status":"CANDIDATE_VERIFIED","officialSha1":expected,
                       "compressedBytes":compressed,"uncompressedBytes":expanded,
                       "indexBytes":index.stat().st_size,"indexSha256":sha256(index),
                       "productionActivated":False,"downloaded":True})
        # Atomically create each immutable file; no replace or rm of an
        # existing snapshot. A partially created folder is never considered
        # valid without its manifest and matching hash.
        output.mkdir(exist_ok=False)
        os.link(index, output / "catalog.sqlite")
        with (output / "manifest.json").open("x", encoding="utf8") as file:
            json.dump(report, file, indent=2)
            file.write("\n")
        return report

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    parser.add_argument("--previous")
    args = parser.parse_args()
    print(json.dumps(prepare(args.output, args.previous), indent=2))
