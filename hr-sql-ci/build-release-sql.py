#!/usr/bin/env python3
"""Build candidate migration from the eight tested SQL drafts. No database access."""
from pathlib import Path
import re
import sys
ROOT = Path(__file__).resolve().parent
ORDER = [
    'PROPOSED_staff_payroll_records.sql',
    'PROPOSED_payroll_approval.sql',
    'PROPOSED_payroll_handoff.sql',
    'PROPOSED_hr_kpi.sql',
    'PROPOSED_hr_letters.sql',
    'PROPOSED_hr_esign.sql',
    'PROPOSED_hr_discipline.sql',
    'PROPOSED_hr_assets.sql',
]
PREFLIGHT = """DO $hr_preflight$
BEGIN
  IF to_regclass('public.profiles') IS NULL OR to_regclass('public.staff_hr') IS NULL
     OR to_regprocedure('public.att_role()') IS NULL THEN
    RAISE EXCEPTION 'HR prerequisites missing';
  END IF;
  IF EXISTS (
    SELECT 1 FROM (VALUES
      ('profiles','id','uuid'),('profiles','full_name','text'),
      ('profiles','enabled','boolean'),('staff_hr','staff_id','uuid')
    ) AS req(t,c,typ)
    WHERE NOT EXISTS (
      SELECT 1 FROM information_schema.columns col
      WHERE col.table_schema='public' AND col.table_name=req.t
      AND col.column_name=req.c AND col.data_type=req.typ
    )
  ) THEN RAISE EXCEPTION 'HR prerequisite columns differ'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles'
      AND column_name='enabled' AND is_nullable='NO'
  ) THEN RAISE EXCEPTION 'Active staff flag must be non-null'; END IF;
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND (c.relname LIKE 'hr\\_%' ESCAPE '\\' OR c.relname='staff_payroll_records')
  ) OR EXISTS (
    SELECT 1 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname LIKE 'hr\\_%' ESCAPE '\\'
  ) THEN RAISE EXCEPTION 'HR objects already exist; stop and review migration history'; END IF;
END
$hr_preflight$;
"""
def strip_transaction(text):
    # Exactly one standalone outer BEGIN; and COMMIT; per draft.
    # Never strip BEGIN/END in PL/pgSQL bodies.
    markers = list(re.finditer(r'^\s*(begin|commit)\s*;[ \t]*$', text, flags=re.I|re.M))
    if len(markers)!=2 or [m.group(1).lower() for m in markers]!=['begin','commit']:
        raise ValueError('Unexpected transaction markers')
    for m in reversed(markers):
        text = text[:m.start()] + text[m.end():]
    return text.strip()
def build():
    return '\n\n'.join(['-- HR release candidate: review, test and approve before execution.',
      'BEGIN;\nSET LOCAL lock_timeout = \'5s\';\nSET LOCAL statement_timeout = \'120s\';',
      PREFLIGHT, *['-- Source: '+f+'\n'+strip_transaction((ROOT/'sql'/f).read_text()) for f in ORDER],
      'COMMIT;',''])
if __name__=='__main__':
    out = Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'HR_RELEASE_CANDIDATE.sql'
    out.write_text(build(), encoding='utf-8')
    print(out)
