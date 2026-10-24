#!/usr/bin/env python3
"""Search the local, read-only short-video catalog without external dependencies."""
import argparse, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
REF=ROOT/'references'
def load():
 rows=[]
 for p in sorted(REF.glob('catalog-*.json')):
  for r in json.loads(p.read_text(encoding='utf-8')):
   rows.append(r|{'record_type':'combination','source_path':'references/'+p.with_suffix('.md').name,'anchor':r['id'].lower()})
 for filename,md,kind in [('formulas.json','02-formulas.md','formula'),('mixes.json','05-mixes.md','mix')]:
  path=REF/filename
  if path.exists():
   for r in json.loads(path.read_text(encoding='utf-8')):
    rows.append(r|{'record_type':kind,'source_path':'references/'+md,'anchor':r['id'].lower()})
 return sorted(rows,key=lambda r:r['id'])
def main():
 ap=argparse.ArgumentParser(description=__doc__)
 ap.add_argument('--id');ap.add_argument('--theme');ap.add_argument('--form');ap.add_argument('--headline');ap.add_argument('--query');ap.add_argument('--limit',type=int,default=5);ap.add_argument('--full',action='store_true')
 a=ap.parse_args()
 if a.limit<1:ap.error('--limit must be positive')
 rows=load()
 for k in ('id','theme','form','headline'):
  value=getattr(a,k)
  if value:
   if k=='id':value=value.upper()
   rows=[r for r in rows if r.get(k)==value]
 if a.query:
  terms=a.query.casefold().split()
  rows=[r for r in rows if all(t in json.dumps(r,ensure_ascii=False).casefold() for t in terms)]
 count=len(rows);rows=rows[:a.limit]
 if not (a.full or a.id):
  rows=[{k:r[k] for k in ('id','record_type','name','theme','form','headline','template','concept','source_path','anchor') if k in r}|{'scenarios':[e['scenario'] for e in r['examples']]} for r in rows]
 print(json.dumps({'total_matches':count,'returned':len(rows),'results':rows},ensure_ascii=False,indent=2))
if __name__=='__main__':main()
