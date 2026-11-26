import base64
from contextlib import closing
from datetime import datetime,timezone
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import sqlite3
import tempfile
import unittest
from unittest.mock import patch
spec=importlib.util.spec_from_file_location("verify",Path(__file__).parents[1]/"verify-turso-candidate.py")
verify=importlib.util.module_from_spec(spec)
spec.loader.exec_module(verify)
class CandidateTests(unittest.TestCase):
    def test_remote_acceptance_is_read_only_and_refuses_mismatch(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            name="yomirra-catalog-"+"b"*12+"-"+"c"*12
            db=root/(name+".db")
            created=datetime.now(timezone.utc).isoformat()
            payload=b"fixture payload"
            with closing(sqlite3.connect(db)) as conn, conn:
                conn.execute("CREATE TABLE works(id INTEGER PRIMARY KEY,payload BLOB)")
                conn.execute("INSERT INTO works VALUES(1,?)",(payload,))
                conn.execute("CREATE TABLE lookup(key TEXT,work_id INTEGER REFERENCES works(id),PRIMARY KEY(key,work_id))")
                conn.execute("INSERT INTO lookup VALUES('title:fixture',1)")
                conn.execute("CREATE TABLE manifest(schema_version INTEGER,created_at TEXT,license TEXT,provider TEXT,source_sha256 TEXT,accepted INTEGER)")
                conn.execute("INSERT INTO manifest VALUES(2,?,'CC-BY-NC-SA-4.0','mangabaka',?,1)",(created,"b"*64))
            original=db.read_bytes()
            (root/"import-plan.json").write_text(json.dumps({"kind":"turso-import-candidate","database":name,"file":db.name,"bytes":len(original),"sha256":hashlib.sha256(original).hexdigest(),"catalogSnapshot":"b"*64,"accepted":1,"lookupRows":1}))
            def cell(v):return {"type":"text","value":v}
            rows=[[[cell(v) for v in ["2",created,"CC-BY-NC-SA-4.0","mangabaka","b"*64,"1"]]],[[cell("1")]],[[cell("1")]],[[{"type":"blob","base64":base64.b64encode(payload).decode()}]],[[cell("1")]]]
            config={"YOMIRRA_MANGABAKA_METADATA":"permitted","YOMIRRA_TURSO_FREE_CONFIRMED":"yes","YOMIRRA_TURSO_CANDIDATE_READ_ONLY_CONFIRMED":"yes","YOMIRRA_TURSO_CANDIDATE_URL":"libsql://"+name+"-owner.turso.io","YOMIRRA_TURSO_CANDIDATE_READ_TOKEN":"fixture-secret"}
            with patch.dict(os.environ,config),patch.object(verify,"pipeline",return_value=rows) as request:
                with self.assertRaisesRegex(ValueError,"headroom"):
                    verify.verify(root,root/"low.json",1)
                request.assert_not_called()
                result=verify.verify(root,root/"accepted.json",10000)
                self.assertEqual(result["status"],"REMOTE_CANDIDATE_VERIFIED")
                self.assertFalse(result["productionActivated"])
                self.assertNotIn("fixture-secret",(root/"accepted.json").read_text())
                self.assertTrue(all(q[0].startswith("SELECT ") for q in request.call_args.args[2]))
                self.assertEqual(db.read_bytes(),original)
                with self.assertRaisesRegex(ValueError,"new acceptance file"):
                    verify.verify(root,root/"accepted.json",10000)
                request.return_value=[rows[0],[[cell("2")]],*rows[2:]]
                with self.assertRaisesRegex(ValueError,"mismatch"):
                    verify.verify(root,root/"bad.json",10000)
                self.assertFalse((root/"bad.json").exists())
if __name__=="__main__":
    unittest.main()
