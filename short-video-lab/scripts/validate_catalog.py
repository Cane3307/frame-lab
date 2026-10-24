#!/usr/bin/env python3
"""Validate coverage, example integrity, JSON/Markdown parity and internal links."""
import itertools,json,re,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];REF=ROOT/'references'
THEMES=['曬過程','說故事','教知識','熬雞湯','選立場','賣商品','演劇情']
FORMS=['切片','口播','圖片旁白','影片旁白','情境劇']
HEADS=['新知式','提問式','解答式','反常式','佔便宜','揭秘式']
errors=[]
def require(ok,msg):
 if not ok:errors.append(msg)
def read(path):return json.loads(path.read_text(encoding='utf-8'))
def check_examples(r,shots=True):
 ex=r.get('examples',[]);require(len(ex)==2,r['id']+' must have two examples')
 for n,e in enumerate(ex,1):
  label=f'{r["id"]} example {n}'
  for key in ('scenario','title','copy','explanation','evidence_status'):require(isinstance(e.get(key),str) and bool(e[key].strip()),label+' missing '+key)
  require(e.get('evidence_status')=='虛構教學示例',label+' evidence status')
  require(len(e.get('copy',''))>=80,label+' incomplete copy')
  require(not re.search(r'【(?:任務|問題|角色|品牌|商品|成果|時間|地點|填入)[^】]*】',e.get('copy','')),label+' unresolved example placeholders')
  if shots:require(len(e.get('shots',[]))==3,label+' needs three shots')
 if len(ex)==2:
  require(ex[0]['copy']!=ex[1]['copy'],r['id']+' duplicate copies')
  require(ex[0]['scenario']!=ex[1]['scenario'],r['id']+' duplicate scenarios')
rows=[]
for p in sorted(REF.glob('catalog-*.json')):
 data=read(p);require(len(data)==30,p.name+' not 30 records')
 md=p.with_suffix('.md');require(md.exists(),str(md)+' missing')
 body=md.read_text(encoding='utf-8') if md.exists() else ''
 for r in data:
  rows.append(r)
  for key in ('id','theme','form','headline','template','concept','formula'):require(isinstance(r.get(key),str) and bool(r[key]),r.get('id','?')+' missing '+key)
  for key,n in [('reinforce',3),('expected_effects',2),('presentation',3),('avoid',2)]:require(isinstance(r.get(key),list) and len(r[key])>=n,r['id']+' missing '+key)
  check_examples(r)
  require(f'id="{r["id"].lower()}"' in body,r['id']+' missing Markdown anchor')
  for e in r.get('examples',[]):require(e['copy'].strip() in body,r['id']+' JSON/Markdown copy mismatch')
rows.sort(key=lambda r:r['id'])
require(len(rows)==210,'Expected 210 core combinations')
require([r['id'] for r in rows]==[f'C{i:03}' for i in range(1,211)],'ID coverage mismatch')
actual=[(r['theme'],r['form'],r['headline']) for r in rows]
require(actual==list(itertools.product(THEMES,FORMS,HEADS)),'7×5×6 coverage/order mismatch')
all_copies=[e['copy'] for r in rows for e in r['examples']]
require(len(set(all_copies))==420,'Core copies not unique')
formulas=read(REF/'formulas.json');require([r['id'] for r in formulas]==[f'F{i:02}' for i in range(1,13)],'Formula coverage')
for r in formulas:check_examples(r,False)
mixes=read(REF/'mixes.json')
require([r['id'] for r in mixes]==[f'M{i:02}' for i in range(1,22)]+[f'P{i:02}' for i in range(1,11)],'Mix coverage/order')
require([tuple(r['pair']) for r in mixes[:21]]==list(itertools.combinations(THEMES,2)),'Theme pair coverage')
require([tuple(r['pair']) for r in mixes[21:]]==list(itertools.combinations(FORMS,2)),'Form pair coverage')
for r in mixes:check_examples(r)
index=read(REF/'index.json');require(len(index)==210,'Index count')
for r in index:
 p=REF/r['path'];require(p.exists(),'Index target missing '+r['path'])
 if p.exists():require(f'id="{r["anchor"]}"' in p.read_text(encoding='utf-8'),'Index anchor missing '+r['anchor'])
for p in ROOT.rglob('*.md'):
 text=p.read_text(encoding='utf-8')
 require(text.count('```')%2==0,str(p)+' unclosed code fence')
 for label,target in re.findall(r'\[([^\]\n]+)\]\(([^)\n]+)\)',text):
  if target.startswith(('https://','http://','#','mailto:')):continue
  filepart,sep,anchor=target.partition('#');dest=(p.parent/filepart).resolve()
  require(dest.exists(),str(p)+' broken link '+target)
  if sep and dest.exists() and re.fullmatch(r'[cfmp]\d+(?:-[12])?',anchor):require(f'id="{anchor}"' in dest.read_text(encoding='utf-8'),str(p)+' broken anchor '+target)
 require(not re.search(r'\bTODO\b|\bFIXME\b',text),str(p)+' scaffold placeholder')
# Specific brand names from the source conversation must not leak into reusable prose.
for p in list(ROOT.rglob('*.md'))+list(REF.glob('*.json')):
 text=p.read_text(encoding='utf-8');text=re.sub(r'https?://[^\s)"<>]+','',text)
 for name in ['陳修平','師父商學院','Joeman','Sandy','藍太太','TikTok','YouTube','Facebook','Notion','Instagram']:
  require(name.casefold() not in text.casefold(),p.name+' concrete name '+name)
if errors:
 print(json.dumps({'status':'failed','errors':errors},ensure_ascii=False,indent=2));sys.exit(1)
print(json.dumps({'status':'passed','combinations':len(rows),'core_examples':len(all_copies),'formulas':len(formulas),'mixes':len(mixes),'indexed_examples':len(all_copies)+sum(len(r['examples']) for r in formulas+mixes),'min_core_copy_characters':min(map(len,all_copies))},ensure_ascii=False,indent=2))
