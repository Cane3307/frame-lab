#!/usr/bin/env python3
"""Build readable references and deterministic indexes from the JSON catalog."""
import argparse, json, re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
REF=ROOT/'references'
CATALOGS=[('process','曬過程'),('story','說故事'),('knowledge','教知識'),('emotion','熬雞湯'),('stance','選立場'),('product','賣商品'),('drama','演劇情')]
CHAPTERS=['四','五','六','七','八','九','十']
def read(name): return json.loads((REF/name).read_text(encoding='utf-8'))
def write(name,text): (REF/name).write_text(text.rstrip()+'\n',encoding='utf-8')
def bullets(items): return '\n'.join('- '+s for s in items)
def code(s): return '```text\n'+s.strip()+'\n```'
def cell(s): return str(s).replace('|','／').replace('\n',' ')
def example_md(ex,n,anchor):
 return f'<a id="{anchor}-{n}"></a>\n\n### 範例 {n}：{ex["scenario"]}\n\n**資料性質：**{ex["evidence_status"]}。文案中的事件與數值需依實際素材確認。\n\n**標題：**{ex["title"]}\n\n'+code(ex['copy'])+'\n\n'+(('**鏡頭與聲音：**\n\n'+bullets(ex['shots'])+'\n\n') if ex.get('shots') else '')+'**為什麼這樣組合：**'+ex['explanation']+'\n'
def record_md(r):
 anchor=r['id'].lower()
 s=f'<a id="{anchor}"></a>\n\n## {r["id"]}｜{r["theme"]} × {r["form"]} × {r["headline"]}\n\n**通用題型：**{r["template"]}\n\n**組合概念：**{r["concept"]}\n\n**腳本公式：**\n\n'+code(r['formula'])
 for field,title in [('reinforce','優先強化點'),('expected_effects','預期效果（設計假設）'),('presentation','建議呈現'),('avoid','避免事項')]:
  s+='\n\n**'+title+'：**\n\n'+bullets(r[field])
 for i,ex in enumerate(r['examples'],1): s+='\n\n'+example_md(ex,i,anchor)
 return s+'\n---\n'
def generic_md(r):
 anchor=r['id'].lower()
 s=f'<a id="{anchor}"></a>\n\n## {r["id"]}｜{r["name"]}\n\n**概念：**{r["concept"]}\n\n**公式：**\n\n'+code(r['formula'])
 for field,title in [('reinforce','優先強化'),('expected_effects','預期效果'),('presentation','呈現建議'),('avoid','避免事項')]:
  if r.get(field): s+='\n\n**'+title+'：**\n\n'+bullets(r[field])
 for i,e in enumerate(r['examples'],1): s+='\n\n'+example_md(e,i,anchor)
 return s+'\n---\n'
def build():
 index=[]
 for k,(slug,theme) in enumerate(CATALOGS):
  filename='catalog-'+slug
  rows=read(filename+'.json')
  toc='\n'.join(f'- [{r["id"]}｜{r["form"]} × {r["headline"]}](#{r["id"].lower()})' for r in rows)
  text=f'# 第{CHAPTERS[k]}章：{theme}——30 種組合與 60 則文案\n\n本章全部操作建議為分析整理，全部範例為虛構教學示例。先選同一形式，再比較六種標題承諾。\n\n## 本章索引\n\n'+toc+'\n\n---\n\n'+'\n'.join(record_md(r) for r in rows)
  write(filename+'.md',text)
  for r in rows:
   index.append({key:r[key] for key in ('id','theme','form','headline','template')}|{'path':filename+'.md','anchor':r['id'].lower(),'scenarios':[e['scenario'] for e in r['examples']],'evidence_status':'分析整理；範例為虛構教學示例'})
 write('index.json',json.dumps(index,ensure_ascii=False,indent=2))
 s='# 第三章：210 種組合總索引\n\n每筆連結通往同編號的完整概念、公式、強化、效果、拍法及兩則文案。編號沿用原清單；索引不把同一標題的不同措辭算成新組合。\n\n'
 for slug,theme in CATALOGS:
  s+=f'## {theme}\n\n| 編號 | 形式 | 標題 | 通用題型 |\n|---|---|---|---|\n'
  for r in index:
   if r['theme']==theme:s+=f'| [{r["id"]}]({r["path"]}#{r["anchor"]}) | {r["form"]} | {r["headline"]} | {cell(r["template"])} |\n'
  s+='\n'
 write('index.md',s)
 scenarios={}
 for r in index:
  for n,sc in enumerate(r['scenarios'],1):scenarios.setdefault(sc,[]).append((r,n))
 s='# 附錄一：跨情境案例索引\n\n依情境找到相應文案；同一情境可能適用不同目的，先讀組合概念再決定。此處列出 420 則核心案例，通用公式與混搭案例另見各章。\n\n| 情境 | 組合與案例 | 主題／形式／標題 |\n|---|---|---|\n'
 for sc,items in sorted(scenarios.items()):
  for r,n in items:s+=f'| {cell(sc)} | [{r["id"]} 範例 {n}]({r["path"]}#{r["anchor"]}-{n}) | {r["theme"]}／{r["form"]}／{r["headline"]} |\n'
 write('scenario-index.md',s)
 formulas=read('formulas.json')
 s='# 第二章：12 種通用公式與 24 則完整範例\n\n公式描述敘事關係，不是成功機率或演算法權重。可先選公式，再到 C 索引找指定主題、形式與標題的完整變體。所有例子為虛構教學示例。\n\n## 本章索引\n\n'+'\n'.join(f'- [{r["id"]} {r["name"]}](#{r["id"].lower()})' for r in formulas)+'\n\n---\n\n'+'\n'.join(generic_md(r) for r in formulas)
 write('02-formulas.md',s)
 mixes=read('mixes.json')
 s='# 第十一章：21 種主題混搭與 10 種形式混搭\n\n本章共 31 個配對、62 則完整示例。主題配對的兩例分別展示不同主副重心；不是把更多主題堆在一起就會更好。形式混用則必須在實際聲畫中分工。全部為分析整理與虛構教學示例。\n\n## 本章索引\n\n'+'\n'.join(f'- [{r["id"]} {r["name"]}](#{r["id"].lower()})' for r in mixes)+'\n\n---\n\n'+'\n'.join(generic_md(r) for r in mixes)
 write('05-mixes.md',s)
 return index,formulas,mixes

def report(path,index,formulas,mixes):
 files=['01-theory.md','02-formulas.md','index.md']+['catalog-'+s+'.md' for s,t in CATALOGS]+['05-mixes.md','03-effects-presentation.md','04-rewrite-workflow.md','06-schema-extension.md','07-evidence.md','scenario-index.md']
 count=2*len(index)+sum(len(r['examples']) for r in formulas+mixes)
 title='# 短影音通用公式、組合模板與 AI 改稿資料庫\n\n版本：1.0｜整理日期：2026-09-10｜語言：繁體中文\n\n'
 title+=f'完整包含 **{len(index)} 種核心組合、420 則核心文案、{len(formulas)} 種通用公式、{len(mixes)} 種混搭配對，共 {count} 則編目示例**。另附完整改稿前後案例、效果與呈現章、資料結構與來源界線。正文去除具體品牌、人名與平台名稱，來源追溯集中於末章。\n\n'
 title+='所有示例均是虛構教學設定，不能直接當成使用者經歷、實測、顧客見證或商品事實。文件用於理解與改稿，不保證流量或成交。\n\n## 閱讀與使用\n\n- 人類：先看第一、二章，再從第三章索引選組合，最後讀效果、呈現與改稿章。\n- AI：若使用技能包，先讀技能入口，再按需檢索 JSON 或對應 Markdown，無需載入整本報告。\n- 直接提供本報告給 AI 時，要求它按編號定位相關紀錄，保留使用者事實與製作限制。\n\n## 章節索引\n\n'
 for f in files:
  first=(REF/f).read_text(encoding='utf-8').splitlines()[0].lstrip('# ')
  if f=='03-effects-presentation.md':first=first.replace('第三章','第十二章')
  if f=='04-rewrite-workflow.md':first=first.replace('第四章','第十三章')
  title+=f'- [{first}](#file-{Path(f).stem})\n'
 title+='\n---\n\n'
 for f in files:
  body=(REF/f).read_text(encoding='utf-8')
  if f=='03-effects-presentation.md':body=body.replace('# 第三章：','# 第十二章：',1)
  if f=='04-rewrite-workflow.md':body=body.replace('# 第四章：','# 第十三章：',1)
  def fix(m):
   label,target=m.group(1),m.group(2)
   if '.md' not in target or target.startswith(('https:','http:')):return m.group(0)
   filepart,sep,anchor=target.partition('#')
   return f'[{label}](#{anchor if sep else "file-"+Path(filepart).stem})'
  body=re.sub(r'\[([^\]]+)\]\(([^)]+)\)',fix,body)
  title+=f'<a id="file-{Path(f).stem}"></a>\n\n'+body+'\n\n---\n\n'
 title+='## 最後的使用原則\n\n先確定要讓觀眾理解、感受或決定什麼，再挑模板。選擇主題、形式與標題之後，讓每段內容支持同一個承諾；以素材和證據決定說法，用實際反應修正。模板是查找與推敲工具，不是代替判斷的答案。\n'
 path=Path(path).expanduser().resolve();path.parent.mkdir(parents=True,exist_ok=True);path.write_text(title,encoding='utf-8')
 print(f'Report: {path}; {len(title)} characters')
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--report');args=ap.parse_args()
 index,formulas,mixes=build()
 print(f'Built {len(index)} combinations, {len(formulas)} formulas, {len(mixes)} mixes')
 if args.report:report(args.report,index,formulas,mixes)
