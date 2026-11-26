from contextlib import closing
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import sqlite3
import tempfile
import unittest
from unittest.mock import patch
from types import SimpleNamespace

spec=importlib.util.spec_from_file_location("staging",Path(__file__).parents[1]/"prepare-turso-import.py")
staging=importlib.util.module_from_spec(spec)
spec.loader.exec_module(staging)

class ImportTests(unittest.TestCase):
    def test_stage_and_explicit_import_boundary(self):
        with tempfile.TemporaryDirectory() as root:
            source,output=Path(root)/"source",Path(root)/"stage"
            source.mkdir()
            index=source/"catalog.sqlite"
            with closing(sqlite3.connect(index)) as db, db:
                db.execute("CREATE TABLE works(id INTEGER PRIMARY KEY)")
                db.execute("INSERT INTO works VALUES(1)")
                db.execute("CREATE TABLE lookup(key TEXT, work_id INTEGER REFERENCES works(id))")
                db.execute("INSERT INTO lookup VALUES('title:fixture',1)")
                db.execute("CREATE TABLE manifest(schema_version INTEGER,provider TEXT,license TEXT,source_sha256 TEXT,accepted INTEGER)")
                db.execute("INSERT INTO manifest VALUES(2,'mangabaka','CC-BY-NC-SA-4.0',?,1)",("b"*64,))
            original=index.read_bytes()
            report={"schemaVersion":2,"provider":"mangabaka","license":"CC-BY-NC-SA-4.0","officialSha1":"a"*40,
                    "indexBytes":len(original),"indexSha256":hashlib.sha256(original).hexdigest(),
                    "normalizedInputSha256":"b"*64,"accepted":1}
            (source/"manifest.json").write_text(json.dumps(report))
            with patch.dict(os.environ,{"YOMIRRA_MANGABAKA_METADATA":"permitted","YOMIRRA_TURSO_FREE_CONFIRMED":"","YOMIRRA_TURSO_IMPORT_CONFIRMED":""}), \
                 patch.object(staging.subprocess,"run",return_value=SimpleNamespace(returncode=0)) as run:
                plan=staging.stage(source,output)
                self.assertEqual(index.read_bytes(),original)
                self.assertEqual(plan["estimatedLogicalRows"],3)
                self.assertFalse(plan["productionActivated"])
                with closing(sqlite3.connect(output/plan["file"])) as db:
                    self.assertEqual(db.execute("PRAGMA journal_mode").fetchone()[0],"wal")
                with self.assertRaisesRegex(ValueError,"confirmations"):
                    staging.import_candidate(output,"default",10**9,1000,1)
                run.assert_not_called()
                with patch.dict(os.environ,{"YOMIRRA_TURSO_FREE_CONFIRMED":"yes","YOMIRRA_TURSO_IMPORT_CONFIRMED":"yes"}):
                    with self.assertRaisesRegex(ValueError,"headroom"):
                        staging.import_candidate(output,"default",1,1000,1)
                    run.assert_not_called()
                    result=staging.import_candidate(output,"default",10**9,1000,1)
                    self.assertEqual(result["status"],"IMPORT_COMMAND_SUCCEEDED")
                    self.assertFalse(result["remoteAcceptanceVerified"])
                    run.assert_called_once()
                    self.assertEqual(run.call_args.args[0][:5],["turso","db","import","--group","default"])
                    with self.assertRaises(FileExistsError):
                        staging.import_candidate(output,"default",10**9,1000,1)
if __name__=="__main__":
    unittest.main()
