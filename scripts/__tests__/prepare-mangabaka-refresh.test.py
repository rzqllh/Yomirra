import hashlib
import importlib.util
import io
import json
import os
import sqlite3
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("refresh", Path(__file__).parents[1] / "prepare-mangabaka-refresh.py")
refresh = importlib.util.module_from_spec(spec)
spec.loader.exec_module(refresh)

class RefreshTests(unittest.TestCase):
    def fixture(self, folder):
        folder.mkdir()
        data = b"isolated fixture"
        (folder / "catalog.sqlite").write_bytes(data)
        report = {"schemaVersion":2,"provider":"mangabaka","license":"CC-BY-NC-SA-4.0",
                  "officialSha1":"a"*40,"indexBytes":len(data),
                  "indexSha256":hashlib.sha256(data).hexdigest()}
        (folder / "manifest.json").write_text(json.dumps(report))
        return data

    def test_no_download_when_checksum_unchanged(self):
        with tempfile.TemporaryDirectory() as root:
            previous, output = Path(root)/"previous", Path(root)/"new"
            original = self.fixture(previous)
            html = b'<tr><a href="/series.jsonl.zst">series.jsonl.zst</a><a href="/sha1">SHA1</a></tr>'
            with patch.dict(os.environ, {"YOMIRRA_MANGABAKA_METADATA":"permitted"}), \
                 patch.object(refresh.dump, "fetch", side_effect=[io.BytesIO(html),io.BytesIO(b"a"*40)]), \
                 patch.object(refresh.dump, "download_checked") as download:
                self.assertEqual(refresh.prepare(output,previous)["status"],"UNCHANGED")
                download.assert_not_called()
            self.assertEqual((previous/"catalog.sqlite").read_bytes(),original)
            self.assertFalse(output.exists())

    def test_reject_tampered_backup_before_network(self):
        with tempfile.TemporaryDirectory() as root:
            previous, output = Path(root)/"previous", Path(root)/"new"
            self.fixture(previous)
            (previous/"catalog.sqlite").write_bytes(b"corrupted")
            with patch.dict(os.environ, {"YOMIRRA_MANGABAKA_METADATA":"permitted"}), \
                 patch.object(refresh.dump, "fetch") as fetch:
                with self.assertRaisesRegex(ValueError,"integrity mismatch"):
                    refresh.prepare(output,previous)
                fetch.assert_not_called()

    def test_no_existing_output_overwrite(self):
        with tempfile.TemporaryDirectory() as root:
            output = Path(root)/"existing"
            original = self.fixture(output)
            with patch.dict(os.environ, {"YOMIRRA_MANGABAKA_METADATA":"permitted"}), \
                 patch.object(refresh.dump, "fetch") as fetch:
                with self.assertRaisesRegex(ValueError,"no overwrites"):
                    refresh.prepare(output)
                fetch.assert_not_called()
            self.assertEqual((output/"catalog.sqlite").read_bytes(),original)

    def test_restore_verified_sqlite_into_new_candidate(self):
        with tempfile.TemporaryDirectory() as root:
            previous, output = Path(root)/"previous", Path(root)/"restore"
            previous.mkdir()
            index = previous/"catalog.sqlite"
            with sqlite3.connect(index) as db:
                db.execute("CREATE TABLE works(id INTEGER PRIMARY KEY)")
                db.execute("INSERT INTO works VALUES(1)")
                db.execute("CREATE TABLE manifest(schema_version INTEGER,provider TEXT,license TEXT,source_sha256 TEXT,accepted INTEGER)")
                db.execute("INSERT INTO manifest VALUES(2,'mangabaka','CC-BY-NC-SA-4.0',?,1)", ("b"*64,))
            original=index.read_bytes()
            report={"schemaVersion":2,"provider":"mangabaka","license":"CC-BY-NC-SA-4.0",
                    "officialSha1":"a"*40,"indexBytes":len(original),"indexSha256":hashlib.sha256(original).hexdigest(),
                    "normalizedInputSha256":"b"*64,"accepted":1}
            (previous/"manifest.json").write_text(json.dumps(report))
            with patch.dict(os.environ, {"YOMIRRA_MANGABAKA_METADATA":"permitted"}), \
                 patch.object(refresh.dump, "fetch") as fetch:
                self.assertEqual(refresh.restore_candidate(previous, output)["status"],"RESTORE_CANDIDATE_VERIFIED")
                self.assertEqual((output/"catalog.sqlite").read_bytes(),original)
                self.assertEqual(index.read_bytes(),original)
                with self.assertRaisesRegex(ValueError,"no overwrites"):
                    refresh.restore_candidate(previous,output)
                report["accepted"]=2
                (previous/"manifest.json").write_text(json.dumps(report))
                with self.assertRaisesRegex(ValueError,"manifest mismatch"):
                    refresh.restore_candidate(previous,Path(root)/"invalid")
                fetch.assert_not_called()

if __name__ == "__main__":
    unittest.main()
