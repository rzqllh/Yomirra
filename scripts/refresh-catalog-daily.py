"""Daily immutable catalog preparation on an operator-owned scheduler.

No production credentials, upload, import, deployment or pointer writes.
The existing import and verified publication commands remain explicit.
"""
import argparse
from datetime import datetime, timezone
import importlib.util
import json
import os
from pathlib import Path
import re
import shutil

def load(name):
    spec=importlib.util.spec_from_file_location(name,Path(__file__).with_name(name+".py"))
    module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module
refresh=load("prepare-mangabaka-refresh")
staging=load("prepare-turso-import")

MIN_DISK=8*1024**3
MAX_RETAINED=4
def write_new(path,data):
    with path.open("x",encoding="utf8") as file:
        json.dump(data,file,indent=2)
        file.write("\n")

def run(root,bootstrap=None,day=None):
    if os.environ.get("YOMIRRA_MANGABAKA_METADATA")!="permitted" or os.environ.get("YOMIRRA_CATALOG_DAILY_PREPARE")!="yes":
        raise ValueError("Explicit permitted-use and daily preparation confirmations required")
    if os.environ.get("CI")=="true" or os.environ.get("GITHUB_ACTIONS")=="true":
        raise ValueError("Operator-owned scheduler only")
    day=day or datetime.now(timezone.utc).date().isoformat()
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}",day):
        raise ValueError("Invalid UTC day")
    root=Path(root).resolve()
    root.mkdir(parents=True,exist_ok=True)
    lock=root/".daily-lock"
    try:
        lock.mkdir()
    except FileExistsError:
        raise ValueError("Another refresh or unresolved prior attempt exists; inspect local lock") from None
    try:
        run_dir=root/day
        if run_dir.exists():
            return {"status":"ALREADY_ATTEMPTED","day":day,"productionActivated":False}
        retained=sorted((p/"snapshot" for p in root.iterdir()
            if p.is_dir() and not p.is_symlink() and re.fullmatch(r"\d{4}-\d{2}-\d{2}",p.name)
            and (p/"snapshot").is_dir() and not (p/"snapshot").is_symlink()),reverse=True)
        if len(retained)>=MAX_RETAINED:
            raise ValueError("Local retention ceiling; archive verified inactive candidates before continuing")
        if shutil.disk_usage(root).free<MIN_DISK:
            raise ValueError("Insufficient local disk headroom")
        previous=retained[0] if retained else bootstrap
        if previous is not None:
            index,report=refresh.previous_snapshot(previous)
            refresh.verify_sqlite_snapshot(index,report)
        # Reserve the day before the first network request. A failed or
        # interrupted attempt is not automatically retried on the same day.
        run_dir.mkdir(exist_ok=False)
        write_new(run_dir/"attempt.json",{"day":day,"status":"ATTEMPTED","productionActivated":False})
        result=refresh.prepare(run_dir/"snapshot",previous)
        if result.get("status")=="UNCHANGED":
            output={"status":"UNCHANGED","day":day,"officialSha1":result["officialSha1"],"downloaded":False,"productionActivated":False}
        elif result.get("status")=="CANDIDATE_VERIFIED":
            plan=staging.stage(run_dir/"snapshot",run_dir/"stage")
            if plan.get("catalogSnapshot")!=result.get("normalizedInputSha256") or plan.get("productionActivated") is not False:
                raise ValueError("Stage snapshot mismatch")
            output={"status":"CANDIDATE_STAGED","day":day,"snapshot":plan["catalogSnapshot"],
                    "database":plan["database"],"accepted":plan["accepted"],"productionActivated":False,
                    "imported":False,"publicationRequired":True}
        else:
            raise ValueError("Unexpected preparation result")
        write_new(run_dir/"result.json",output)
        return output
    finally:
        lock.rmdir()

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--root",required=True)
    parser.add_argument("--bootstrap")
    args=parser.parse_args()
    print(json.dumps(run(args.root,args.bootstrap),indent=2))
