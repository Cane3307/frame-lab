/* Run: node tests/smoke.cjs. Uses installed Playwright or the bundled runtime. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const vm = require('node:vm');
let playwright;
try { playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright'); }
catch { playwright = require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }
const root = path.resolve(__dirname,'..');
const shots = path.join(root,'docs/screenshots');
const checks = [];
const pass = name => { checks.push(name); console.log('PASS',name); };
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
const server = http.createServer((request,response) => {
  const pathname = new URL(request.url,'http://localhost').pathname;
  const rel = decodeURIComponent(pathname.replace(/^\/frame-lab\//,''));
  const filename = path.resolve(root,rel || 'index.html');
  if (!filename.startsWith(root+path.sep) || !fs.existsSync(filename) || fs.statSync(filename).isDirectory()) { response.writeHead(404); response.end(); return; }
  response.writeHead(200,{'Content-Type':mime[path.extname(filename)] || 'application/octet-stream'});
  response.end(fs.readFileSync(filename));
});
function executablePath() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  const cache = path.join(process.env.LOCALAPPDATA || '','ms-playwright');
  if (!fs.existsSync(cache)) return undefined;
  return fs.readdirSync(cache).filter(x=>/^chromium-\d+$/.test(x)).sort((a,b)=>Number(b.split('-')[1])-Number(a.split('-')[1])).map(x=>path.join(cache,x,'chrome-win64/chrome.exe')).find(x=>fs.existsSync(x));
}
(async () => {
  fs.mkdirSync(shots,{recursive:true});
  const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'data/catalog.js'),'utf8'),sandbox);
  const data=Array.from(sandbox.window.LAB_DATA.combinations);
  assert.equal(data.length,210);assert.equal(new Set(data.map(c=>c.id)).size,210);
  assert.ok(data.every(c=>c.examples.length===2&&c.formula.includes('→')));
  assert.ok(!/gradient\(/i.test(fs.readFileSync(path.join(root,'styles.css'),'utf8')));
  pass('210 complete unique cards and a flat-color interface');
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port+'/frame-lab/';
  const browser=await playwright.chromium.launch({headless:true,executablePath:executablePath()});
  try {
    const context=await browser.newContext({viewport:{width:1440,height:1000}});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base))errors.push(r.status()+' '+r.url());});
    const ids=()=>page.locator('#draw-results [data-card-id]').evaluateAll(nodes=>nodes.map(n=>n.dataset.cardId));
    const settle=()=>page.waitForFunction(()=>!document.querySelector('#draw-button').disabled);
    const phase=value=>page.waitForFunction(v=>document.querySelector('#draw-results').dataset.phase===v,value);
    const choose=number=>page.locator('input[name="draw-count"][value="'+number+'"]').check();
    const shot=async(name)=>{await page.waitForTimeout(220);await page.screenshot({path:path.join(shots,name)});};
    const snapshot=()=>page.evaluate(()=>({
      hash:location.hash,scrollX,scrollY,active:document.querySelector('#draw-results .is-active')?.dataset.cardId||'',
      cards:[...document.querySelectorAll('#draw-results [data-card-id]')].map(n=>n.dataset.cardId),
      rects:[...document.querySelectorAll('#draw-results [data-card-id]')].map(n=>{const r=n.getBoundingClientRect();return{top:r.top,left:r.left,width:r.width,height:r.height};})
    }));
    const assertRestored=async(saved)=>{
      await page.waitForTimeout(30);
      const actual=await snapshot();
      assert.equal(actual.hash,saved.hash);assert.deepEqual(actual.cards,saved.cards);assert.equal(actual.active,saved.active);
      assert.ok(Math.abs(actual.scrollY-saved.scrollY)<1&&Math.abs(actual.scrollX-saved.scrollX)<1);
      actual.rects.forEach((r,index)=>Object.keys(r).forEach(k=>assert.ok(Math.abs(r[k]-saved.rects[index][k])<1,'Card '+index+' '+k+' moved after dialog')));
    };
    await page.goto(base+'#draw');
    await page.waitForSelector('#inspiration-card');
    assert.equal(await page.locator('.main-nav a').count(),2);
    await choose(5);
    const controlBefore=await page.locator('#draw-button').boundingBox();
    await page.locator('#draw-button').click();
    await phase('spread');await page.waitForTimeout(420);
    assert.equal(await page.locator('#draw-results .is-covered').count(),5);
    assert.ok(await page.locator('.card-flipper').evaluateAll(nodes=>nodes.every(n=>new DOMMatrix(getComputedStyle(n).transform).m11 < -.99)));
    assert.ok(await page.locator('.card-face').evaluateAll(nodes=>nodes.every(n=>getComputedStyle(n).backfaceVisibility==='hidden')));
    await page.screenshot({path:path.join(shots,'flip-backs-desktop.png')});
    for(let index=0;index<5;index++){
      await page.waitForFunction(i=>document.querySelector('#draw-results').dataset.revealIndex===String(i+1),index);
      assert.equal(await page.locator('#draw-results .is-covered').count(),4-index);
      if(index===0){
        await page.waitForTimeout(150);
        const matrix=await page.locator('.card-flipper').first().evaluate(n=>{const m=new DOMMatrix(getComputedStyle(n).transform);return{edge:Math.abs(m.m13),front:m.m11};});
        assert.ok(matrix.edge>.1&&Math.abs(matrix.front)<.99,'Card must rotate through 3D, not just replace its text');
        await page.screenshot({path:path.join(shots,'flip-first-desktop.png')});
      }
    }
    await settle();
    assert.equal(await page.locator('#draw-results .is-covered').count(),0);
    assert.ok(await page.locator('.card-flipper').evaluateAll(nodes=>nodes.every(n=>new DOMMatrix(getComputedStyle(n).transform).m11>.99)));
    assert.ok(Math.abs((await page.locator('#draw-button').boundingBox()).y-controlBefore.y)<1);
    pass('All five backs spread before the first reveal; five separate physical rotations finish in order');
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.evaluate(()=>{window.__firstCard=document.querySelector('#inspiration-card');});
    for(const count of [1,3,5]){
      await choose(count);
      const previous=await ids();
      const box=await page.locator('#draw-button').boundingBox();
      await page.locator('#draw-button').click();
      const result=await ids();
      assert.equal(result.length,count);assert.equal(new Set(result).size,count);assert.ok(result.every(id=>!previous.includes(id)));
      assert.ok(await page.evaluate(()=>window.__firstCard===document.querySelector('#inspiration-card')));
      assert.ok(Math.abs((await page.locator('#draw-button').boundingBox()).y-box.y)<1);
      assert.ok(!await page.locator('#draw-button').isDisabled());
    }
    pass('1/3/5 draws retain card nodes and control position; reduced motion reveals instantly and excludes the last batch');
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.evaluate(()=>document.activeElement.blur());await page.locator('#draw-button').hover();await page.waitForTimeout(430);
    const first=page.locator('#inspiration-card');
    const exposed=await first.evaluate(n=>{const r=n.getBoundingClientRect();for(let y=r.top+40;y<Math.min(r.bottom,innerHeight-10);y+=20)for(let x=r.left+14;x<r.right-14;x+=14)if(document.elementFromPoint(x,y)?.closest('.inspiration-card')===n)return{x,y};return null;});
    assert.ok(exposed);await page.mouse.move(exposed.x,exposed.y);await page.waitForTimeout(440);
    assert.ok(await first.evaluate(n=>n.classList.contains('is-active')&&getComputedStyle(n).zIndex==='100'));
    await first.focus();await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'draw-card-2');
    await page.waitForTimeout(440);await shot('hand-hover-desktop.png');
    fs.copyFileSync(path.join(shots,'hand-hover-desktop.png'),path.join(shots,'preview.png'));
    pass('Pointer hover and arrow keys still raise the selected card');
    const opener=page.locator('#draw-card-2');
    await opener.focus();await page.waitForTimeout(440);
    const handBefore=await snapshot(),originalURL=page.url();
    await page.evaluate(()=>{window.__openedNode=document.querySelector('#draw-card-2');});
    for(const method of ['close','escape','backdrop']){
      await opener.locator('.draw-card-title').click();
      await page.waitForSelector('#card-dialog[open]');
      assert.equal(page.url(),originalURL);assert.ok(await page.locator('#draw-view').isVisible());
      assert.ok(await page.locator('#card-dialog').evaluate(n=>n.matches(':modal')));
      assert.equal(await page.locator('#close-detail').evaluate(n=>document.activeElement===n),true);
      for(let tab=0;tab<12;tab++){await page.keyboard.press('Tab');assert.ok(await page.evaluate(()=>document.querySelector('#card-dialog').contains(document.activeElement)));}
      if(method==='close'){await page.locator('#card-dialog').evaluate(n=>{n.scrollTop=0;});await shot('dialog-desktop.png');await page.locator('#close-detail').click();}
      else if(method==='escape')await page.keyboard.press('Escape');
      else await page.mouse.click(5,5);
      await page.waitForFunction(()=>!document.querySelector('#card-dialog').open);
      await assertRestored(handBefore);
      assert.ok(await page.evaluate(()=>window.__openedNode===document.querySelector('#draw-card-2')));
      assert.equal(await page.evaluate(()=>document.activeElement.id),'draw-card-2');
    }
    pass('Card popup keeps the URL, hand, selected card, exact positions and focus; X, Escape and backdrop all close safely with focus containment');
    await opener.locator('.framework li').first().click();
    await page.waitForSelector('#card-dialog[open]');
    await page.locator('[data-modal-nav="cards"]').click();
    await page.waitForSelector('#cards-view:not([hidden])');
    assert.equal(await page.locator('.card-tile').count(),210);assert.ok(!await page.locator('#card-dialog').evaluate(n=>n.open));
    await page.locator('#card-search').fill('C069');await page.waitForFunction(()=>document.querySelectorAll('.card-tile').length===1);
    assert.equal(await page.locator('.card-tile').getAttribute('data-open-card'),'C069');
    await page.locator('#card-search').fill('zzzz無結果');await page.waitForSelector('#empty-state:not([hidden])');
    await page.locator('#reset-search').click();await page.locator('#theme-filter').selectOption({index:1});
    assert.equal(await page.locator('.card-tile').count(),30);await page.locator('#theme-filter').selectOption('');
    const tile=page.locator('.card-tile').nth(30);await tile.scrollIntoViewIfNeeded();
    const tileID=await tile.getAttribute('data-open-card'),catalogBefore=await snapshot();
    await tile.click();await page.waitForSelector('#card-dialog[open]');
    assert.equal(new URL(page.url()).hash,'#cards');assert.equal(await page.locator('#detail-title').count(),1);
    assert.equal(await page.locator('.example').count(),2);await page.locator('.example summary').nth(1).click();assert.equal(await page.locator('.example[open]').count(),2);
    assert.equal(await page.locator('.return-draw p').textContent(),'沒靈感，再抽抽看');
    assert.equal(await page.locator('[data-modal-nav="draw"]').textContent(),'回到翻卡');
    await page.locator('[data-modal-nav="draw"]').scrollIntoViewIfNeeded();await shot('dialog-return-footer.png');
    await page.locator('#close-detail').click();await assertRestored(catalogBefore);
    assert.equal(await page.evaluate(()=>document.activeElement.dataset.openCard),tileID);
    await tile.click();await page.locator('[data-modal-nav="draw"]').click();await page.waitForSelector('#draw-view:not([hidden])');
    assert.deepEqual(await ids(),handBefore.cards);assert.ok(!await page.locator('#card-dialog').evaluate(n=>n.open));
    pass('Catalog search/filter/scroll survive popup close; catalog popup footer offers return to draw with the requested hint and preserves the hand');
    await page.goto(base+'#card/C069');await page.waitForSelector('#card-dialog[open]');
    assert.ok(await page.locator('#cards-view').isVisible());
    await context.grantPermissions(['clipboard-read','clipboard-write'],{origin:new URL(base).origin});
    await page.locator('#copy-framework').click();await page.waitForFunction(()=>document.querySelector('#copy-framework span').textContent==='已複製！');
    assert.ok((await page.evaluate(()=>navigator.clipboard.readText())).includes('C069'));
    assert.ok(await page.locator('#card-dialog #toast').isVisible());
    await context.clearPermissions();await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined});document.execCommand=()=>false;});
    await page.locator('#copy-framework').click();assert.ok(await page.locator('#copy-fallback').isVisible());assert.ok((await page.locator('#framework-text').inputValue()).includes('拍攝架構'));
    await page.keyboard.press('Escape');assert.equal(new URL(page.url()).hash,'#cards');
    await page.goto(base+'#card/INVALID');await page.waitForSelector('#draw-view:not([hidden])');
    pass('Legacy card links open a popup over the catalog; closing normalizes the URL; copying and manual fallback work inside the dialog');
    await page.goto(base+'#card/C069');await page.waitForSelector('#card-dialog[open]');
    await page.evaluate(()=>{location.hash='#card/C070';});
    await page.waitForFunction(()=>document.querySelector('#card-dialog').open&&document.querySelector('.detail-card .card-code').textContent==='C070');
    await page.waitForTimeout(100);assert.ok(await page.locator('#card-dialog').evaluate(n=>n.open));
    await page.evaluate(()=>{document.querySelector('#close-detail').click();document.querySelector('.card-tile[data-open-card="C001"]').click();});
    await page.waitForFunction(()=>document.querySelector('#card-dialog').open&&document.querySelector('.detail-card .card-code').textContent==='C001');
    await page.waitForTimeout(100);assert.ok(await page.locator('#card-dialog').evaluate(n=>n.open));
    await page.locator('#close-detail').click();
    pass('A delayed native close event cannot dismiss a newly opened popup or a changed deep link');

    await page.emulateMedia({reducedMotion:'reduce'});
    for(const width of [320,360,390,768,1024,1440]){
      await page.setViewportSize({width,height:844});await page.goto(base+'#draw');
      for(const count of [1,3,5]){
        await choose(count);await page.locator('#draw-button').click();assert.equal((await ids()).length,count);
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1));
      }
      const selected=page.locator('#draw-card-3');await selected.focus();await selected.locator('.draw-card-title').click();
      const bounds=await page.locator('#card-dialog').boundingBox();
      assert.ok(bounds.x>=0&&bounds.x+bounds.width<=width+1&&bounds.y>=0&&bounds.height<=844);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1));
      await page.locator('#close-detail').click();await page.goto(base+'#cards');
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1));
    }
    pass('Draws, catalog and popup fit 320/360/390/768/1024/1440px without horizontal overflow');
    await page.setViewportSize({width:390,height:844});await page.goto(base+'#draw');await choose(5);await page.locator('#draw-button').click();
    await page.locator('#hand-picker button').nth(4).click();assert.ok(await page.locator('#draw-card-5').evaluate(n=>n.classList.contains('is-active')));
    await page.locator('#draw-card-5').focus();await page.locator('#draw-card-5 .framework li').last().scrollIntoViewIfNeeded();
    const mobileBefore=await snapshot();await page.locator('#draw-card-5 .framework li').last().click();
    assert.equal(await page.locator('#toast').evaluate(n=>n.hidden),true);
    await shot('dialog-mobile.png');await page.keyboard.press('Escape');await assertRestored(mobileBefore);await shot('hand-five-mobile.png');
    pass('Mobile card popup closes back to the same selected card and exact reading position');
    // Traverse all rendered cards at the narrowest supported width.
    await page.setViewportSize({width:320,height:844});await choose(5);
    await page.evaluate(()=>{window.__originalRng=crypto.getRandomValues;crypto.getRandomValues=array=>{const current=new Set([...document.querySelectorAll('#draw-results [data-card-id]')].map(n=>n.dataset.cardId));const pool=window.LAB_DATA.combinations.filter(card=>!current.has(card.id));window.__targetCards.forEach((id,index)=>{const at=pool.findIndex(card=>card.id===id);array[index]=at;pool.splice(at,1);});return array;};});
    await page.evaluate(()=>{const current=new Set([...document.querySelectorAll('#draw-results [data-card-id]')].map(n=>n.dataset.cardId));window.__targetCards=window.LAB_DATA.combinations.filter((card,index)=>index>=5&&!current.has(card.id)).slice(-5).map(card=>card.id);});await page.locator('#draw-button').click();
    const inspected=new Set();
    for(let offset=0;offset<210;offset+=5){
      const target=data.slice(offset,offset+5).map(card=>card.id);await page.evaluate(value=>{window.__targetCards=value;},target);await page.locator('#draw-button').click();
      const actual=await ids();assert.deepEqual(actual,target);actual.forEach(id=>inspected.add(id));
      const clipped=await page.locator('#draw-results .card-content').evaluateAll(nodes=>nodes.filter(n=>n.scrollHeight>n.clientHeight+1).length);assert.equal(clipped,0);
      const scrollers=await page.locator('#draw-results *').evaluateAll(nodes=>nodes.filter(n=>['auto','scroll'].includes(getComputedStyle(n).overflowY)).length);assert.equal(scrollers,0);
    }
    await page.evaluate(()=>{crypto.getRandomValues=window.__originalRng;});assert.equal(inspected.size,210);
    pass('All 210 card fronts fit at 320px without clipping or card-internal scroll regions');
    await page.setViewportSize({width:1440,height:1000});await page.goto(base+'#draw');const lastHand=await ids();
    await page.emulateMedia({reducedMotion:'no-preference'});
    for(const stop of ['gather','spread','reveal']){
      await page.locator('#draw-button').click();await phase(stop);await page.locator('[data-page="cards"]').click();await page.waitForSelector('#cards-view:not([hidden])');
      await page.locator('[data-page="draw"]').click();assert.deepEqual(await ids(),lastHand);
    }
    await page.waitForTimeout(3400);assert.deepEqual(await ids(),lastHand);assert.ok(!await page.locator('#draw-button').isDisabled());assert.equal(await page.locator('#draw-results .is-covered').count(),0);
    pass('Navigation cancels gathering, spreading and revealing with no delayed mutation and restores the previous complete hand');
    await page.goto('file:///'+path.join(root,'index.html').replace(/\\/g,'/'));await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#draw-button').click();await page.locator('#inspiration-card .draw-card-title').click();
    assert.ok(await page.locator('#card-dialog').evaluate(n=>n.open));await page.locator('#close-detail').click();assert.ok(await page.locator('#inspiration-card').getAttribute('data-card-id'));
    assert.deepEqual(errors,[]);pass('Direct file use, relative assets and scripts work without browser errors');
    fs.writeFileSync(path.join(root,'docs/TEST_RESULTS.json'),JSON.stringify({date:new Date().toISOString(),scope:'dialog-and-sequential-physical-flip',checks:checks.length,passed:checks,errors},null,2)+'\n');
    console.log('ALL '+checks.length+' CHECK GROUPS PASSED');await context.close();
  } finally {await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
