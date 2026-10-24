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
  const sandbox={window:{}}; vm.runInNewContext(fs.readFileSync(path.join(root,'data/catalog.js'),'utf8'),sandbox);
  const data=sandbox.window.LAB_DATA.combinations;
  assert.equal(data.length,210); assert.equal(new Set(data.map(c=>c.id)).size,210);
  assert.ok(data.every(c=>c.examples.length===2 && c.formula.includes('→')));
  assert.ok(!/gradient\(/i.test(fs.readFileSync(path.join(root,'styles.css'),'utf8')));
  assert.ok(!/notebook.css|knowledge.js|fonts\//.test(fs.readFileSync(path.join(root,'index.html'),'utf8')));
  pass('210 complete unique frameworks; active UI has no gradients or old notebook dependencies');
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port+'/frame-lab/';
  const browser=await playwright.chromium.launch({headless:true,executablePath:executablePath()});
  try {
    const context=await browser.newContext({viewport:{width:1440,height:1000}});
    const page=await context.newPage(), errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400 && r.url().startsWith(base))errors.push(r.status()+' '+r.url());});
    const capture = async (name,fullPage=false) => {
      await page.evaluate(()=>{document.activeElement.blur();window.scrollTo(0,0);});
      await page.waitForTimeout(220);
      await page.screenshot({path:path.join(shots,name),fullPage});
    };
    await page.goto(base);
    await page.waitForSelector('#cover-draw');
    assert.equal(await page.locator('.main-nav a').count(),2);
    assert.ok(await page.locator('#draw-view').isVisible());
    await capture('doodle-cover-desktop.png',true);
    fs.copyFileSync(path.join(shots,'doodle-cover-desktop.png'),path.join(shots,'preview.png'));
    await page.locator('#cover-draw').click();
    await page.waitForFunction(()=>!document.querySelector('#draw-button').disabled);
    await page.waitForSelector('#inspiration-card[data-card-id]');
    assert.ok(await page.locator('#inspiration-card .framework li').count()>=3);
    assert.equal(await page.locator('#draw-button-label').textContent(),'再翻一張');
    await capture('doodle-drawn-desktop.png',true);
    for(let i=0;i<4;i++){
      const prior=await page.locator('#inspiration-card').getAttribute('data-card-id');
      await page.locator('#draw-button').focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction(()=>!document.querySelector('#draw-button').disabled);
      assert.notEqual(await page.locator('#inspiration-card').getAttribute('data-card-id'),prior);
      assert.equal(await page.evaluate(()=>document.activeElement.id),'draw-button');
    }
    pass('Cover and primary button draw usable frameworks; consecutive cards differ; keyboard focus survives repeated flips');
    const drawn=await page.locator('#inspiration-card').getAttribute('data-card-id');
    await page.locator('.card-detail-link').click();
    await page.waitForSelector('#detail-view:not([hidden])');
    assert.ok((await page.locator('#detail-back').textContent()).includes('回到翻卡'));
    assert.ok(await page.locator('.detail-card .card-code').textContent()===drawn);
    await page.locator('#detail-back').click();
    await page.waitForSelector('#draw-view:not([hidden])');
    assert.equal(await page.locator('#inspiration-card').getAttribute('data-card-id'),drawn);
    await page.locator('#draw-button').click({noWaitAfter:true});
    await page.locator('[data-page="cards"]').click();
    await page.waitForSelector('#cards-view:not([hidden])');
    await page.waitForTimeout(450);
    assert.ok(!await page.locator('#draw-button').isDisabled());
    assert.ok(!await page.locator('#inspiration-card').evaluate(n=>n.classList.contains('is-flipping')));
    const ids=await page.locator('.card-tile').evaluateAll(nodes=>nodes.map(n=>n.dataset.openCard));
    assert.equal(ids.length,210); assert.equal(new Set(ids).size,210);
    await capture('doodle-cards-desktop.png');
    pass('Draw/detail navigation preserves current card; navigation cancels animation; all 210 cards are rendered');
    await page.locator('#card-search').fill('C069');
    await page.waitForFunction(()=>document.querySelectorAll('.card-tile').length===1);
    assert.equal(await page.locator('.card-tile').getAttribute('data-open-card'),'C069');
    await page.locator('#card-search').fill('zzzz無結果');
    await page.waitForSelector('#empty-state:not([hidden])');
    await page.locator('#reset-search').click();
    assert.equal(await page.locator('.card-tile').count(),210);
    await page.locator('#theme-filter').selectOption({index:1});
    assert.equal(await page.locator('.card-tile').count(),30);
    await page.locator('#theme-filter').selectOption('');
    const card=page.locator('.card-tile').nth(30);
    await card.scrollIntoViewIfNeeded();
    const selected=await card.getAttribute('data-open-card');
    await card.click();
    await page.waitForSelector('#detail-view:not([hidden])');
    assert.equal(await page.locator('.example').count(),2);
    assert.equal(await page.locator('.example[open]').count(),1);
    await page.locator('.example summary').nth(1).click();
    assert.equal(await page.locator('.example[open]').count(),2);
    await capture('doodle-detail-desktop.png',true);
    await page.locator('#detail-back').click();
    await page.waitForSelector('#cards-view:not([hidden])');
    assert.equal(await page.evaluate(()=>document.activeElement.dataset.openCard),selected);
    assert.ok(await card.evaluate(n=>{const r=n.getBoundingClientRect();return r.top<innerHeight && r.bottom>0;}),'Return should restore the opened card in view');
    pass('Search, empty reset and seven-theme filtering work; detail examples expand and back restores card position/focus');
    await page.goto(base+'#card/C069');
    await page.waitForSelector('#copy-framework');
    await context.grantPermissions(['clipboard-read','clipboard-write'],{origin:new URL(base).origin});
    await page.locator('#copy-framework').click();
    await page.waitForFunction(()=>document.querySelector('#copy-framework span').textContent==='已複製！');
    assert.ok((await page.evaluate(()=>navigator.clipboard.readText())).includes('C069'));
    await context.clearPermissions();
    await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined});document.execCommand=()=>false;});
    await page.locator('#copy-framework').click();
    assert.ok(await page.locator('#copy-fallback').isVisible());
    assert.ok((await page.locator('#framework-text').inputValue()).includes('拍攝架構'));
    pass('Clipboard copies actual structure; unavailable clipboard exposes selectable text without false success');
    await page.goto(base+'#card/INVALID');
    await page.waitForSelector('#draw-view:not([hidden])');
    for(const width of [320,360,390,768,1024,1440]){
      await page.setViewportSize({width,height:844});
      for(const hash of ['#draw','#cards','#card/C069']){
        await page.goto(base+hash);
        const target=hash==='#draw'?'#draw-view':hash==='#cards'?'#cards-view':'#detail-view';
        await page.waitForSelector(target+':not([hidden])');
        const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
        assert.ok(dimensions.scroll<=dimensions.client+1,'Horizontal overflow at '+width+' '+hash+' '+JSON.stringify(dimensions));
      }
    }
    await page.setViewportSize({width:390,height:844});
    await page.goto(base);
    await capture('doodle-cover-mobile.png',true);
    await page.locator('#draw-button').click();
    await page.waitForFunction(()=>!document.querySelector('#draw-button').disabled);
    await page.waitForTimeout(500);
    await capture('doodle-drawn-mobile.png',true);
    await page.goto(base+'#cards');
    await capture('doodle-cards-mobile.png');
    assert.equal(await page.locator('#card-search').evaluate(n=>getComputedStyle(n).fontSize),'16px');
    await page.goto(base+'#card/C069');
    await capture('doodle-detail-mobile.png',true);
    pass('All three views fit 320/360/390/768/1024/1440px; mobile inputs use 16px type');
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto(base);
    await page.locator('#draw-button').click();
    assert.ok(await page.locator('#inspiration-card').getAttribute('data-card-id'));
    assert.ok(!await page.locator('#draw-button').isDisabled());
    assert.equal(await page.locator('#inspiration-card').evaluate(n=>n.getAnimations().length),0);
    await page.keyboard.press('Tab');
    assert.ok(await page.evaluate(()=>document.activeElement.matches('a,button,input,select,summary')));
    pass('Reduced motion draws immediately with no animation and keyboard navigation remains native');
    await page.goto('file:///'+path.join(root,'index.html').replace(/\\/g,'/'));
    await page.waitForSelector('#draw-button');
    await page.locator('#draw-button').click();
    await page.waitForSelector('#inspiration-card[data-card-id]');
    assert.equal(errors.length,0,errors.join('\n'));
    pass('Direct file opening works; no JavaScript errors or missing local assets');
    const report={date:new Date().toISOString(),scope:'simple-doodle-redesign',checks:checks.length,passed:checks,errors};
    fs.writeFileSync(path.join(root,'docs/TEST_RESULTS.json'),JSON.stringify(report,null,2)+'\n');
    console.log('ALL '+checks.length+' CHECK GROUPS PASSED');
    await context.close();
  } finally {await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
