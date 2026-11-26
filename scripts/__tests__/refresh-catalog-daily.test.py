import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from types import SimpleNamespace
from unittest.mock import patch

spec=importlib.util.spec_from_file_location("daily",Path(__file__).parents[1]/"refresh-catalog-daily.py")
daily=importlib.util.module_from_spec(spec)
spec.loader.exec_module(daily)
class DailyTests(unittest.TestCase):
    def test_daily_reservation_unchanged_and_new_candidate(self):
        with tempfile.TemporaryDirectory() as tmp, patch.dict(os.environ,{"YOMIRRA_MANGABAKA_METADATA":"permitted","YOMIRRA_CATALOG_DAILY_PREPARE":"yes","CI":"","GITHUB_ACTIONS":""}), \
             patch.object(daily.shutil,"disk_usage",return_value=SimpleNamespace(free=10*1024**3)), \
             patch.object(daily.refresh,"prepare") as prep,patch.object(daily.staging,"stage") as stage:
            root=Path(tmp)
            prep.return_value={"status":"UNCHANGED","officialSha1":"a"*40}
            self.assertEqual(daily.run(root,day="2026-11-25")["status"],"UNCHANGED")
            self.assertEqual(daily.run(root,day="2026-11-25")["status"],"ALREADY_ATTEMPTED")
            prep.assert_called_once();stage.assert_not_called()
            prep.return_value={"status":"CANDIDATE_VERIFIED","normalizedInputSha256":"b"*64}
            stage.return_value={"catalogSnapshot":"b"*64,"database":"candidate","accepted":123,"productionActivated":False}
            output=daily.run(root,day="2026-11-26")
            self.assertEqual(output["status"],"CANDIDATE_STAGED")
            self.assertFalse(output["imported"]);self.assertFalse(output["productionActivated"])
            stage.assert_called_once_with(root/"2026-11-26"/"snapshot",root/"2026-11-26"/"stage")
            self.assertTrue((root/"2026-11-26"/"result.json").is_file())
    def test_failure_does_not_retry_or_overwrite(self):
        with tempfile.TemporaryDirectory() as tmp, patch.dict(os.environ,{"YOMIRRA_MANGABAKA_METADATA":"permitted","YOMIRRA_CATALOG_DAILY_PREPARE":"yes","CI":"","GITHUB_ACTIONS":""}), \
             patch.object(daily.shutil,"disk_usage",return_value=SimpleNamespace(free=10*1024**3)), \
             patch.object(daily.refresh,"prepare",side_effect=ValueError("download rejected")) as prep:
            root=Path(tmp)
            with self.assertRaisesRegex(ValueError,"download rejected"):
                daily.run(root,day="2026-11-25")
            self.assertTrue((root/"2026-11-25"/"attempt.json").exists())
            self.assertFalse((root/"2026-11-25"/"result.json").exists())
            self.assertEqual(daily.run(root,day="2026-11-25")["status"],"ALREADY_ATTEMPTED")
            prep.assert_called_once()
            (root/".daily-lock").mkdir()
            with self.assertRaisesRegex(ValueError,"prior attempt"):
                daily.run(root,day="2026-11-26")
    def test_failed_staging_is_not_reused_as_a_completed_refresh(self):
        with tempfile.TemporaryDirectory() as tmp,patch.dict(os.environ,{"YOMIRRA_MANGABAKA_METADATA":"permitted","YOMIRRA_CATALOG_DAILY_PREPARE":"yes","CI":"","GITHUB_ACTIONS":""}), \
             patch.object(daily.shutil,"disk_usage",return_value=SimpleNamespace(free=10*1024**3)), \
             patch.object(daily.refresh,"previous_snapshot",return_value=(Path("fixture.sqlite"),{"normalizedInputSha256":"a"*64})) as previous, \
             patch.object(daily.refresh,"verify_sqlite_snapshot"),patch.object(daily.refresh,"prepare",return_value={"status":"UNCHANGED","officialSha1":"a"*40}) as prep:
            root=Path(tmp)
            good=root/"2026-11-23"
            (good/"snapshot").mkdir(parents=True)
            (good/"stage").mkdir()
            (good/"result.json").write_text(json.dumps({"status":"CANDIDATE_STAGED","snapshot":"a"*64,"database":"good"}))
            (good/"stage"/"import-plan.json").write_text(json.dumps({"catalogSnapshot":"a"*64,"database":"good"}))
            failed=root/"2026-11-24"
            (failed/"snapshot").mkdir(parents=True)
            (failed/"attempt.json").write_text("{}")
            self.assertEqual(daily.run(root,day="2026-11-25")["status"],"UNCHANGED")
            previous.assert_called_once_with(good/"snapshot")
            prep.assert_called_once_with(root/"2026-11-25"/"snapshot",good/"snapshot")

    def test_unchanged_verified_snapshot_writes_immutable_freshness_evidence(self):
        with tempfile.TemporaryDirectory() as tmp,patch.dict(os.environ,{"YOMIRRA_MANGABAKA_METADATA":"permitted","YOMIRRA_CATALOG_DAILY_PREPARE":"yes","CI":"","GITHUB_ACTIONS":""}), \
             patch.object(daily.shutil,"disk_usage",return_value=SimpleNamespace(free=10*1024**3)), \
             patch.object(daily.refresh,"previous_snapshot",return_value=(Path("fixture.sqlite"),{"normalizedInputSha256":"a"*64,"createdAt":"2026-11-20T00:00:00Z","officialSha1":"b"*40})), \
             patch.object(daily.refresh,"verify_sqlite_snapshot"), \
             patch.object(daily.refresh,"prepare",return_value={"status":"UNCHANGED","officialSha1":"b"*40}):
            root=Path(tmp)
            out=daily.run(root,bootstrap=root/"bootstrap",day="2026-11-25")
            self.assertEqual(out["status"],"UNCHANGED")
            self.assertTrue(out["freshnessRenewalRequired"])
            evidence=json.loads((root/"2026-11-25"/"freshness-evidence.json").read_text("utf8"))
            self.assertEqual(evidence["source_sha256"],"a"*64)
            self.assertEqual(evidence["created_at"],"2026-11-20T00:00:00Z")
            self.assertEqual(evidence["official_sha1"],"b"*40)
            self.assertEqual(evidence["schema_version"],1)
    def test_unchanged_checksum_flags_snapshot_nearing_runtime_expiry(self):
        self.assertEqual(daily.freshness({"createdAt":"2026-11-20T00:00:00+00:00"},"2026-11-22"),
                         {"snapshotAgeDays":2.0,"freshnessRenewalRequired":False})
        self.assertEqual(daily.freshness({"createdAt":"2026-11-20T00:00:00Z"},"2026-11-25"),
                         {"snapshotAgeDays":5.0,"freshnessRenewalRequired":True})
        for report in (None,{},{"createdAt":"not-a-date"}):
            self.assertEqual(daily.freshness(report,"2026-11-25"),{"snapshotAgeDays":None,"freshnessRenewalRequired":True})
    def test_permission_disk_and_retention_fail_before_network(self):
        with tempfile.TemporaryDirectory() as tmp,patch.dict(os.environ,{"YOMIRRA_MANGABAKA_METADATA":"permitted","YOMIRRA_CATALOG_DAILY_PREPARE":"","CI":"","GITHUB_ACTIONS":""}),patch.object(daily.refresh,"prepare") as prep:
            root=Path(tmp)
            with self.assertRaisesRegex(ValueError,"confirmations"):
                daily.run(root,day="2026-11-25")
            with patch.dict(os.environ,{"YOMIRRA_CATALOG_DAILY_PREPARE":"yes"}),patch.object(daily.shutil,"disk_usage",return_value=SimpleNamespace(free=1)):
                with self.assertRaisesRegex(ValueError,"disk headroom"):
                    daily.run(root,day="2026-11-25")
            for i in range(1,5):
                (root/("2026-11-0"+str(i))/"snapshot").mkdir(parents=True)
            with patch.dict(os.environ,{"YOMIRRA_CATALOG_DAILY_PREPARE":"yes"}):
                with self.assertRaisesRegex(ValueError,"retention ceiling"):
                    daily.run(root,day="2026-11-25")
            prep.assert_not_called()
if __name__=="__main__":
    unittest.main()
