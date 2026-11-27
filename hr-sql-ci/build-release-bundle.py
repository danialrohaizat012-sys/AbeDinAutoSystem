#!/usr/bin/env python3
"""Build a review-only HR release bundle; never push, deploy, or access Supabase."""
from pathlib import Path
import hashlib
import json
import subprocess
import sys
import tempfile

ROOT=Path(__file__).resolve().parents[1]
BASE="43afd4809ce01c3449c9c7735a7d61394527d91a"
ALLOW=[
    "app.html", "js/staff.js", "js/staff-profile.js", "js/staff-me.js",
    "js/hr-dashboard.mjs", "js/hr-assistant.mjs", "js/hr-kpi.mjs",
    "js/hr-letters.mjs", "js/hr-esign.mjs", "js/hr-discipline.mjs", "js/hr-assets.mjs",
    "js/payroll-review.mjs", "js/payroll-approval.mjs", "js/payroll-slip.mjs", "js/payroll-handoff.mjs",
    "tests/v83-staff-annual-leave-initial.test.cjs",
]
def git(*args,cwd=ROOT):
    return subprocess.check_output(["git",*args],cwd=cwd)
def digest(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()
def main(out):
    out=out.resolve()
    out.mkdir(parents=True,exist_ok=True)
    head=git("rev-parse","HEAD").decode().strip()
    live=git("rev-parse","refs/remotes/origin/main").decode().strip()
    if live!=BASE:
        raise RuntimeError("Production main changed: reconcile and rerun all gates")
    subprocess.run(["git","merge-base","--is-ancestor",BASE,head],cwd=ROOT,check=True)
    changed=set(git("diff","--name-only",BASE,head).decode().splitlines())
    missing=set(ALLOW)-changed
    unexpected={p for p in changed-set(ALLOW) if not p.startswith("hr-sql-ci/") and p not in {".github/workflows/hr-frontend-test-only.yml",".github/workflows/hr-sql-test-only.yml"}}
    if missing or unexpected:
        raise RuntimeError(f"Review changed files: missing={missing}; unexpected={unexpected}")
    patch=out/"hr-frontend.patch"
    patch.write_bytes(git("diff","--binary",BASE,head,"--",*ALLOW))
    with tempfile.TemporaryDirectory(prefix="hr-release-") as temp:
        checkout=Path(temp)/"baseline"
        git("worktree","add","--detach",str(checkout),BASE)
        try:
            git("apply","--check",str(patch),cwd=checkout)
            git("apply",str(patch),cwd=checkout)
            for p in ALLOW:
                if (checkout/p).read_bytes()!=git("show",head+":"+p):
                    raise RuntimeError("Patched file differs from tested blob: "+p)
            git("apply","-R","--check",str(patch),cwd=checkout)
            git("apply","-R",str(patch),cwd=checkout)
            if git("status","--porcelain",cwd=checkout).strip():
                raise RuntimeError("Reverse patch did not restore the original checkout")
        finally:
            git("worktree","remove","--force",str(checkout))
    sql=out/"HR_RELEASE_CANDIDATE.sql"
    subprocess.run([sys.executable,str(ROOT/"hr-sql-ci/build-release-sql.py"),str(sql)],check=True)
    (out/"RELEASE-7B.md").write_bytes((ROOT/"hr-sql-ci/RELEASE-7B.md").read_bytes())
    manifest={"purpose":"REVIEW ONLY; NOT AUTHORIZED FOR DEPLOYMENT",
        "base_main":BASE,"candidate_commit":head,
        "promotion_files":{p:git("rev-parse",head+":"+p).decode().strip() for p in ALLOW},
        "sha256":{p.name:digest(p) for p in sorted(out.iterdir()) if p.is_file() and p.name!="manifest.json"},
        "checks":{"forward_patch":"passed","reverse_patch":"passed","base_main":"matched"},
        "required_before_release":["verified recoverable database backup","approved production window","final SQL and frontend CI","live Supabase authorization checks","independent payroll reviewer"]}
    (out/"manifest.json").write_text(json.dumps(manifest,indent=2)+"\n")
    print(f"Verified {len(ALLOW)} promotion files. Forward and reverse patch passed. No deployment.")
if __name__=="__main__":
    main(Path(sys.argv[1]))
