"""Read-only acceptance for an imported Turso candidate. No deployment or env mutation."""
import argparse
import base64
from contextlib import closing
from datetime import datetime, timezone
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import sqlite3
import urllib.error
import urllib.request
from urllib.parse import urlsplit

spec=importlib.util.spec_from_file_location("refresh",Path(__file__).with_name("prepare-mangabaka-refresh.py"))
refresh=importlib.util.module_from_spec(spec)
spec.loader.exec_module(refresh)

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,req,fp,code,msg,headers,newurl):
        return None

def pipeline(origin,token,statements):
    body={"requests":[{"type":"execute","stmt":{"sql":sql,"args":[{"type":"text","value":str(arg)} for arg in args]}} for sql,args in statements]+[{"type":"close"}]}
    request=urllib.request.Request(origin+"/v2/pipeline",data=json.dumps(body).encode(),headers={"Authorization":"Bearer "+token,"Content-Type":"application/json","Accept":"application/json"},method="POST")
    try:
        with urllib.request.build_opener(NoRedirect()).open(request,timeout=10) as response:
            raw=response.read(2*1024*1024+1)
        if len(raw)>2*1024*1024:
            raise ValueError("Response exceeds bound")
        result=json.loads(raw)["results"]
        if len(result)!=len(statements)+1 or result[-1].get("type")!="ok" or result[-1].get("response",{}).get("type")!="close":
            raise ValueError("Protocol mismatch")
        rows=[]
        for entry in result[:-1]:
            if entry.get("type")!="ok" or entry.get("response",{}).get("type")!="execute":
                raise ValueError("Query failed")
            values=entry["response"]["result"]["rows"]
            if not isinstance(values,list) or len(values)>20:
                raise ValueError("Unexpected rows")
            rows.append(values)
        return rows
    except (OSError,ValueError,KeyError,TypeError):
        # Never include provider response, request headers or credentials.
        raise ValueError("Remote candidate query failed") from None

def text(cell):
    if cell.get("type")!="text" or not isinstance(cell.get("value"),str):
        raise ValueError("Unexpected remote cell")
    return cell["value"]

def blob(cell):
    if cell.get("type")!="blob":
        raise ValueError("Unexpected payload type")
    return base64.b64decode(cell["base64"],validate=True)

def verify(stage,output,read_headroom):
    if os.environ.get("YOMIRRA_MANGABAKA_METADATA")!="permitted" or os.environ.get("YOMIRRA_TURSO_FREE_CONFIRMED")!="yes" or os.environ.get("YOMIRRA_TURSO_CANDIDATE_READ_ONLY_CONFIRMED")!="yes":
        raise ValueError("Permitted use, free plan and scoped read-only token confirmation required")
    output=Path(output).resolve()
    if output.exists():
        raise ValueError("Use a new acceptance file")
    stage=Path(stage).resolve(strict=True)
    plan_path=stage/"import-plan.json"
    if plan_path.stat().st_size>65536:
        raise ValueError("Invalid import plan")
    plan=json.loads(plan_path.read_text("utf8"))
    name=plan.get("database","")
    if plan.get("kind")!="turso-import-candidate" or not re.fullmatch("yomirra-catalog-[a-f0-9]{12}-[a-f0-9]{12}",name) or plan.get("file")!=name+".db":
        raise ValueError("Invalid candidate identity")
    db=stage/plan["file"]
    if db.stat().st_size!=plan["bytes"] or refresh.sha256(db)!=plan["sha256"]:
        raise ValueError("Candidate hash mismatch")
    raw=os.environ.get("YOMIRRA_TURSO_CANDIDATE_URL","")
    u=urlsplit(re.sub(r"^(libsql|turso)://","https://",raw))
    if u.scheme!="https" or not re.fullmatch(re.escape(name)+r"-[a-z0-9-]+\.turso\.io",u.netloc) or u.path not in ("","/") or u.query or u.fragment:
        raise ValueError("Candidate endpoint must match newly imported database")
    token=os.environ.get("YOMIRRA_TURSO_CANDIDATE_READ_TOKEN","").strip()
    if not token:
        raise ValueError("Candidate read token required")
    origin="https://"+u.netloc
    with closing(sqlite3.connect(db.as_uri()+"?mode=ro&immutable=1",uri=True)) as conn:
        if conn.execute("PRAGMA integrity_check").fetchall()!=[("ok",)] or conn.execute("PRAGMA foreign_key_check").fetchone() is not None:
            raise ValueError("Local integrity failure")
        manifest=conn.execute("SELECT CAST(schema_version AS TEXT),created_at,license,provider,source_sha256,CAST(accepted AS TEXT) FROM manifest LIMIT 2").fetchall()
        if len(manifest)!=1:
            raise ValueError("Local manifest missing")
        version,created,license,provider,sha,count=manifest[0]
        at=datetime.fromisoformat(created.replace("Z","+00:00"))
        age=(datetime.now(timezone.utc)-at).total_seconds()
        works=conn.execute("SELECT COUNT(*) FROM works").fetchone()[0]
        lookups=conn.execute("SELECT COUNT(*) FROM lookup").fetchone()[0]
        if version!="2" or license!="CC-BY-NC-SA-4.0" or provider!="mangabaka" or sha!=plan["catalogSnapshot"] or not re.fullmatch("[a-f0-9]{64}",sha) or not 0<=age<=7*86400 or int(count)!=works or works!=plan["accepted"] or lookups!=plan["lookupRows"] or works<=0 or lookups<works:
            raise ValueError("Local manifest/count/freshness mismatch")
        if read_headroom<2*(works+lookups)+1000:
            raise ValueError("Insufficient verified free read headroom")
        # Sample deterministic first/last/midpoint IDs and one exact indexed
        # lookup per sampled record; compare actual bytes, not title guesses.
        sample_ids={row[0] for row in conn.execute("SELECT id FROM works ORDER BY id LIMIT 3")}
        sample_ids.update(row[0] for row in conn.execute("SELECT id FROM works ORDER BY id DESC LIMIT 3"))
        sample_ids.update(row[0] for row in conn.execute("SELECT id FROM works ORDER BY id LIMIT 1 OFFSET ?",(works//2,)))
        samples=[]
        for identity in sorted(sample_ids):
            payload=conn.execute("SELECT payload FROM works WHERE id=?",(identity,)).fetchone()[0]
            key=conn.execute("SELECT key FROM lookup WHERE work_id=? ORDER BY key LIMIT 1",(identity,)).fetchone()
            if not isinstance(payload,bytes) or len(payload)>65536 or not key:
                raise ValueError("Invalid local sample")
            samples.append((identity,payload,key[0]))
    statements=[("SELECT CAST(schema_version AS TEXT),created_at,license,provider,source_sha256,CAST(accepted AS TEXT) FROM manifest LIMIT 2",[]),
                ("SELECT CAST(COUNT(*) AS TEXT) FROM works",[]),("SELECT CAST(COUNT(*) AS TEXT) FROM lookup",[])]
    for identity,payload,key in samples:
        statements.extend([("SELECT payload FROM works WHERE id=? LIMIT 1",[identity]),("SELECT CAST(work_id AS TEXT) FROM lookup WHERE key=? AND work_id=? LIMIT 1",[key,identity])])
    remote=pipeline(origin,token,statements)
    if [[text(cell) for cell in row] for row in remote[0]]!=[list(manifest[0])] or remote[1]!=[[{"type":"text","value":str(works)}]] or remote[2]!=[[{"type":"text","value":str(lookups)}]]:
        raise ValueError("Remote manifest/count mismatch")
    for i,(identity,payload,key) in enumerate(samples):
        data,lookup=remote[3+2*i:5+2*i]
        if len(data)!=1 or len(data[0])!=1 or blob(data[0][0])!=payload or lookup!=[[{"type":"text","value":str(identity)}]]:
            raise ValueError("Remote sample/index mismatch")
    result={"status":"REMOTE_CANDIDATE_VERIFIED","database":name,"snapshot":sha,"accepted":works,"lookupRows":lookups,
            "sampled":len(samples),"stageSha256":plan["sha256"],"verifiedAt":datetime.now(timezone.utc).isoformat(),
            "activation":{"YOMIRRA_TURSO_URL":origin,"YOMIRRA_TURSO_SNAPSHOT":sha},
            "readOnlyTokenVerifiedByOperator":True,"productionActivated":False}
    with output.open("x",encoding="utf8") as file:
        json.dump(result,file,indent=2);file.write("\n")
    return result

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--stage",required=True);parser.add_argument("--output",required=True)
    parser.add_argument("--read-headroom",type=int,required=True)
    args=parser.parse_args()
    print(json.dumps(verify(args.stage,args.output,args.read_headroom),indent=2))
