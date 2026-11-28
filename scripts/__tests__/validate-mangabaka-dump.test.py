import importlib.util
from pathlib import Path
import unittest

spec=importlib.util.spec_from_file_location("dump",Path(__file__).parents[1]/"validate-mangabaka-dump.py")
dump=importlib.util.module_from_spec(spec)
spec.loader.exec_module(dump)

class DumpTests(unittest.TestCase):
    def test_exact_default_row_only(self):
        html="""<table><tr><td><a href="/data/series.full.jsonl.zst">series.full.jsonl.zst</a></td><td><a href="/data/full.sha1">SHA1</a></td></tr>
        <tr><td><a href="https://downloads.mangabaka.org/data/series.jsonl.zst">series.jsonl.zst</a></td><td><a href="/data/series.jsonl.zst.sha1">SHA1</a></td></tr></table>"""
        self.assertEqual(dump.discover_download(html),("https://downloads.mangabaka.org/data/series.jsonl.zst","https://mangabaka.org/data/series.jsonl.zst.sha1"))
    def test_untrusted_and_missing_links(self):
        for html in [
            '<tr><a href="https://other.example/series.jsonl.zst">series.jsonl.zst</a><a href="/sha1">SHA1</a></tr>',
            '<tr><a href="/data/series.jsonl.zst">series.jsonl.zst</a></tr>',
            '<tr><a href="/data/series.full.jsonl.zst">series.jsonl.zst</a><a href="/sha1">SHA1</a></tr>',
        ]:
            with self.assertRaises(ValueError):dump.discover_download(html)
    def test_checksum_strictness(self):
        self.assertEqual(dump.expected_sha1("A"*40+"  series.jsonl.zst\n"),"a"*40)
        with self.assertRaises(ValueError):dump.expected_sha1("<html>not a checksum</html>")
    def test_decompress_checked_roundtrip_and_corrupt_rejection(self):
        import tempfile
        try:
            from compression import zstd as stdlib_zstd
        except ImportError:
            self.skipTest("Python 3.14+ compression.zstd unavailable")
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            packed = root / "sample.zst"
            payload = b'{"id":1,"title":"Fixture"}\n'
            packed.write_bytes(stdlib_zstd.compress(payload))
            out = root / "sample.jsonl"
            self.assertEqual(dump.decompress_checked(packed, out), len(payload))
            self.assertEqual(out.read_bytes(), payload)
            bad = root / "bad.zst"
            bad.write_bytes(b"not-a-valid-zstd-frame")
            with self.assertRaisesRegex(ValueError, "decompression failed"):
                dump.decompress_checked(bad, root / "bad.jsonl")

if __name__=="__main__":unittest.main()
