"""Prepare and optionally import a verified SQLite candidate into a NEW Turso database.
No credentials printed, no existing database mutations, no automatic production switch.
Official import: https://turso.tech/blog/migrating-and-importing-sqlite-to-turso-just-got-easier
"""
from contextlib import closing
from pathlib import Path
from tempfile import TemporaryDirectory
import argparse
import importlib.util
import json
import os
import re
import shutil
import sqlite3
import subprocess
import uuid

spec=importlib.util.spec_from_file_location("refresh",Path(__file__).with_name("prepare-mangabaka-refresh.py"))
refresh=importlib.util.module_from_spec(spec)
spec.loader.exec_module(refresh)

def stage(snapshot,output):
    if os.environ.get("YOMIRRA_MANGABAKA_METADATA")!="permitted":
        raise ValueError("Confirm permitted use and attribution")
    index,report=refresh.previous_snapshot(snapshot)
    count=refresh.verify_sqlite_snapshot(index,report)
    with closing(sqlite3.connect(index.as_uri()+"?mode=ro&immutable=1",uri=True)) as db:
        lookup_count=db.execute("SELECT COUNT(*) FROM lookup").fetchone()[0]
    if lookup_count<count:
        raise ValueError("Missing indexed identities")
    output=Path(output).resolve()
    if output.exists():
        raise ValueError("Use a new staging directory")
    output.parent.mkdir(parents=True,exist_ok=True)
    name="yomirra-catalog-"+report["normalizedInputSha256"][:12]+"-"+uuid.uuid4().hex[:12]
    with TemporaryDirectory(prefix="yomirra-turso-stage-",dir=output.parent) as tmp:
        candidate=Path(tmp)/(name+".db")
        shutil.copyfile(index,candidate)
        if refresh.sha256(candidate)!=report["indexSha256"]:
            raise ValueError("Candidate copy hash mismatch")
        with closing(sqlite3.connect(candidate)) as db:
            if db.execute("PRAGMA journal_mode=WAL").fetchone()[0].lower()!="wal":
                raise ValueError("WAL conversion failed")
            if db.execute("PRAGMA wal_checkpoint(TRUNCATE)").fetchone()[0]!=0:
                raise ValueError("WAL checkpoint failed")
        refresh.verify_sqlite_snapshot(candidate,report)
        if candidate.with_name(candidate.name+"-wal").exists() and candidate.with_name(candidate.name+"-wal").stat().st_size:
            raise ValueError("Uncheckpointed WAL")
        plan={"kind":"turso-import-candidate","database":name,"file":candidate.name,
              "catalogSnapshot":report["normalizedInputSha256"],"accepted":count,
              "lookupRows":lookup_count,"estimatedLogicalRows":count+lookup_count+1,
              "bytes":candidate.stat().st_size,"sha256":refresh.sha256(candidate),
              "productionActivated":False,"imported":False}
        output.mkdir(exist_ok=False)
        os.link(candidate,output/candidate.name)
        with (output/"import-plan.json").open("x",encoding="utf8") as f:
            json.dump(plan,f,indent=2)
            f.write("\n")
    return plan

def import_candidate(output,group,storage_headroom,row_write_headroom,free_database_slots):
    # These values must come from the actual operator dashboard. They are
    # conservative preflight inputs, not API-verified provider usage.
    if os.environ.get("YOMIRRA_MANGABAKA_METADATA")!="permitted" or \
       os.environ.get("YOMIRRA_TURSO_FREE_CONFIRMED")!="yes" or \
       os.environ.get("YOMIRRA_TURSO_IMPORT_CONFIRMED")!="yes":
        raise ValueError("Explicit permitted-use, free-plan and import confirmations required")
    if not isinstance(group,str) or not re.fullmatch("[a-z0-9][a-z0-9-]{0,62}",group):
        raise ValueError("Explicit existing Turso group required")
    output=Path(output).resolve(strict=True)
    plan_path=output/"import-plan.json"
    if plan_path.stat().st_size>65536:
        raise ValueError("Invalid import plan")
    plan=json.loads(plan_path.read_text("utf8"))
    name=plan.get("database","")
    if plan.get("kind")!="turso-import-candidate" or not re.fullmatch(
            "yomirra-catalog-[a-f0-9]{12}-[a-f0-9]{12}",name) or plan.get("file")!=name+".db":
        raise ValueError("Invalid immutable import identity")
    db_path=output/plan["file"]
    if not db_path.is_file() or db_path.stat().st_size!=plan["bytes"] or refresh.sha256(db_path)!=plan["sha256"]:
        raise ValueError("Import candidate hash mismatch")
    # Double the local estimates for headroom. Actual import accounting
    # may differ; do not use this as a promise that provider charges are zero.
    if free_database_slots<1 or storage_headroom<2*plan["bytes"] or row_write_headroom<2*plan["estimatedLogicalRows"]:
        raise ValueError("Insufficient verified free-tier headroom")
    with closing(sqlite3.connect(db_path.as_uri()+"?mode=ro&immutable=1",uri=True)) as db:
        manifest=db.execute("SELECT source_sha256,accepted FROM manifest LIMIT 2").fetchall()
        counts=(db.execute("SELECT COUNT(*) FROM works").fetchone()[0],
                db.execute("SELECT COUNT(*) FROM lookup").fetchone()[0])
        if manifest!=[(plan["catalogSnapshot"],plan["accepted"])] or counts!=(plan["accepted"],plan["lookupRows"]) or \
           sum(counts)+1!=plan["estimatedLogicalRows"]:
            raise ValueError("Import plan manifest or counts mismatch")
    # Never retry a potentially successful remote create automatically.
    # A failed CLI call requires inspection; no delete or overwrite.
    with (output/"import-attempt.json").open("x",encoding="utf8") as f:
        json.dump({"database":name,"group":group,"status":"ATTEMPTED"},f)
    result=subprocess.run(["turso","db","import","--group",group,str(db_path)],
                          capture_output=True,text=True,timeout=600,check=False)
    if result.returncode:
        raise RuntimeError("Import not verified; inspect the candidate database before retrying")
    return {"status":"IMPORT_COMMAND_SUCCEEDED","database":name,"catalogSnapshot":plan["catalogSnapshot"],
            "productionActivated":False,"remoteAcceptanceVerified":False}

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    sub=parser.add_subparsers(dest="mode",required=True)
    prep=sub.add_parser("stage");prep.add_argument("--snapshot",required=True);prep.add_argument("--output",required=True)
    imp=sub.add_parser("import");imp.add_argument("--output",required=True);imp.add_argument("--group",required=True)
    imp.add_argument("--storage-headroom",type=int,required=True);imp.add_argument("--row-write-headroom",type=int,required=True)
    imp.add_argument("--free-database-slots",type=int,required=True)
    args=parser.parse_args()
    report=stage(args.snapshot,args.output) if args.mode=="stage" else import_candidate(args.output,args.group,args.storage_headroom,args.row_write_headroom,args.free_database_slots)
    print(json.dumps(report,indent=2))
