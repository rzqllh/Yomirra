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

if __name__=="__main__":unittest.main()
