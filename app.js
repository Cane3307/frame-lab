/* FRAME LAB: two simple views, one deck of 210 short-video frameworks. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const icon = name => '<svg aria-hidden="true"><use href="#i-' + name + '"/></svg>';
  const catalog = window.LAB_DATA?.combinations || [];
  if (!catalog.length) {
    $('#main').innerHTML = '<div class="empty-state"><h1>靈感卡還沒準備好</h1><p>請重新整理頁面，再試一次。</p></div>';
    return;
  }
  const byId = new Map(catalog.map(card => [card.id, card]));
  const themes = [...new Set(catalog.map(card => card.theme))];
  const colors = ['yellow','blue','pink','mint','pink','yellow','blue'];
  const themeColor = card => colors[themes.indexOf(card.theme)] || 'yellow';
  const steps = card => card.formula.split('→').map(text => text.trim()).filter(Boolean);
  const structure = card => '<ol class="framework">' + steps(card).map((text,index) => '<li><span class="step-number">' + String(index+1).padStart(2,'0') + '</span><span>' + escape(text) + '</span></li>').join('') + '</ol>';
  const tags = card => '<div class="tags"><span>' + escape(card.theme) + '</span><span>' + escape(card.form) + '</span><span>' + escape(card.headline) + '</span></div>';
  let page = 'draw', currentCards = [], drawCount = 1;
  let query = '', theme = '';
  let searchTimer, toastTimer, flipFocus, drawTimers=[], pendingDraw=null;
  const cardDialog=$('#card-dialog');
  let modalState=null,restoringModal=false;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const searchIndex = new Map(catalog.map(card => [card.id, JSON.stringify(card).toLocaleLowerCase()]));
  const order = catalog.map((_,index) => catalog[(index % 7)*30 + ((Math.floor(index/7)*7 + (index%7)*4)%30)]);

  let activeHand = -1, handLayout, resizeFrame;
  const compactHand = () => $('#draw-results').clientWidth < 720;
  function positionHand() {
    const results = $('#draw-results');
    if (!handLayout) return;
    const cards = [...results.children];
    const {compact,height,spacing,angle,scale,activeScale} = handLayout;
    const middle = (cards.length-1)/2;
    cards.forEach((card,index) => {
      const relative = index-middle;
      const active = index===activeHand && Boolean(card.dataset.cardId)&&!card.classList.contains('is-covered');
      card.classList.toggle('is-active',active);
      card.style.setProperty('--fan-x',(active && compact ? 0 : relative*spacing)+'px');
      card.style.setProperty('--fan-y',(active ? -24 : Math.abs(relative)*(compact?9:13))+'px');
      card.style.setProperty('--fan-angle',(active ? 0 : relative*(middle ? angle/middle : 0))+'deg');
      card.style.setProperty('--fan-scale',active ? activeScale : cards.length===1 ? 1 : scale);
      card.style.setProperty('--deal-delay',index*55+'ms');
      card.style.zIndex=active ? 100 : 10+cards.length-Math.round(Math.abs(relative));
    });
    $$('#hand-picker button').forEach((button,index) => button.setAttribute('aria-pressed',String(index===activeHand)));
  }
  function setActiveHand(index) {
    if ($('#draw-button').disabled||cardDialog.open||restoringModal) return;
    activeHand=index;
    positionHand();
  }
  function layoutHand() {
    const results=$('#draw-results');
    if (!results.clientWidth || !results.children.length) return;
    const compact=compactHand(), count=results.children.length, width=results.clientWidth;
    const cardWidth=Math.min(count===1?370:330,width-(compact?52:44));
    results.style.setProperty('--hand-card-width',cardWidth+'px');
    const cards=[...results.children];
    cards.forEach(card=>{card.style.height='auto';});
    const height=Math.max(460,...cards.map(card=>Math.ceil(card.offsetHeight)));
    cards.forEach(card=>{card.style.height=height+'px';});
    const scale=compact ? .82 : .92, activeScale=compact ? 1.025 : 1.11;
    const angle=count===1?0:compact?3:8;
    const radians=angle*Math.PI/180;
    const extent=scale*(cardWidth*Math.cos(radians)/2+height*Math.sin(radians));
    const spread=Math.max(0,Math.min(width/2-20-extent,(width-cardWidth*activeScale)/2-20));
    const spacing=count===1?0:Math.min(count===3?245:185,spread/((count-1)/2));
    const top=Math.ceil(height*(activeScale-1)+42);
    results.style.setProperty('--hand-top',top+'px');
    results.style.height=Math.max(compact ? innerHeight : 0,Math.ceil(top+height+70))+'px';
    handLayout={compact,height,spacing,angle,scale,activeScale};
    positionHand();
  }
  function renderHandPicker() {
    const picker=$('#hand-picker');
    picker.hidden=currentCards.length<2;
    picker.innerHTML=currentCards.map((card,index)=>'<button type="button" data-hand-index="'+index+'" aria-pressed="'+(index===activeHand)+'" aria-label="放大第 '+(index+1)+' 張：'+card.id+' '+escape(card.template)+'">'+(index+1)+'</button>').join('');
    $$('button',picker).forEach(button=>{button.disabled=$('#draw-button').disabled;});
  }
  $('#hand-picker').addEventListener('click',event=>{
    const button=event.target.closest('[data-hand-index]');
    if(button) setActiveHand(Number(button.dataset.handIndex));
  });
  $('#draw-results').addEventListener('pointerleave',()=>{
    if(!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const focused=document.activeElement.closest('.inspiration-card');
    setActiveHand(focused ? [...$('#draw-results').children].indexOf(focused) : -1);
  });
  window.addEventListener('resize',()=>{
    cancelAnimationFrame(resizeFrame);
    resizeFrame=requestAnimationFrame(()=>{
      if(compactHand() && currentCards.length && activeHand<0) activeHand=Math.floor(currentCards.length/2);
      layoutHand();
    });
  });

  function toast(text) {
    clearTimeout(toastTimer);
    $('#toast').textContent = text;
    $('#toast').hidden = false;
    toastTimer = setTimeout(() => { $('#toast').hidden = true; },3500);
  }
  function setCovered(card,covered) {
    card.classList.toggle('is-covered',covered);
    card.tabIndex=covered?-1:0;
    if(covered)card.setAttribute('aria-disabled','true');else card.removeAttribute('aria-disabled');
    $('.card-front',card).setAttribute('aria-hidden',String(covered));
  }
  function resetFlipControls() {
    $('#draw-button').disabled=false;
    $('#draw-button').removeAttribute('aria-busy');
    $('#draw-button-label').textContent=drawCount===1?'翻一張':'翻 '+drawCount+' 張';
    $$('.draw-count input').forEach(input=>{input.disabled=false;});
    $$('#hand-picker button').forEach(button=>{button.disabled=false;});
    const results=$('#draw-results');
    results.removeAttribute('aria-busy');
    results.classList.remove('is-gathering','is-dealing');
    results.dataset.phase='idle';
    delete results.dataset.revealIndex;
  }
  function cancelFlip() {
    drawTimers.forEach(clearTimeout);drawTimers=[];
    if(pendingDraw) {
      const saved=pendingDraw;pendingDraw=null;
      const results=$('#draw-results');
      results.classList.add('skip-flip');
      activeHand=saved.activeHand;
      ensureSlots(saved.cards.length||1);
      if(saved.cards.length)renderDraw(saved.cards);
      else {
        currentCards=[];
        const card=results.firstElementChild;
        card.className='inspiration-card is-cover';
        card.removeAttribute('href');delete card.dataset.cardId;delete card.dataset.openCard;
        card.setAttribute('aria-label','待翻開的文案靈感卡');
        $('.card-content',card).innerHTML='<div class="card-cover"><svg class="cover-doodle" aria-hidden="true"><use href="#i-cover"/></svg></div>';
        setCovered(card,true);renderHandPicker();layoutHand();
      }
      resetFlipControls();void results.offsetHeight;results.classList.remove('skip-flip');
    } else resetFlipControls();
  }
  function ensureSlots(count) {
    const results=$('#draw-results');
    results.dataset.count=count;
    while(results.children.length>count)results.lastElementChild.remove();
    while(results.children.length<count) {
      const card=document.createElement('a');
      card.id=results.children.length?'draw-card-'+(results.children.length+1):'inspiration-card';
      card.className='inspiration-card is-cover';
      card.setAttribute('aria-label','待翻開的文案靈感卡');
      card.innerHTML='<div class="card-flipper"><div class="card-face card-front"><div class="card-content"><div class="card-cover"><svg class="cover-doodle" aria-hidden="true"><use href="#i-cover"/></svg></div></div></div><div class="card-face card-reverse" aria-hidden="true"><svg class="cover-doodle" aria-hidden="true"><use href="#i-cover"/></svg></div></div>';
      setCovered(card,true);
      const index=results.children.length;
      card.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'&&card.dataset.cardId)setActiveHand(index);});
      card.addEventListener('focusin',()=>{if(card.dataset.cardId)setActiveHand(index);});
      card.addEventListener('keydown',event=>{
        if(event.target!==card||pendingDraw)return;
        if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){
          event.preventDefault();
          const next=event.key==='Home'?0:event.key==='End'?results.children.length-1:(index+(event.key==='ArrowRight'?1:-1)+results.children.length)%results.children.length;
          results.children[next].focus({preventScroll:true});
        }
      });
      results.append(card);
    }
  }
  function renderDraw(cards,covered=false) {
    currentCards=cards;
    if(activeHand>=cards.length)activeHand=cards.length-1;
    cards.forEach((card,index)=>{
      const element=$('#draw-results').children[index];
      element.className='inspiration-card card-'+themeColor(card);
      element.dataset.cardId=card.id;
      element.href='#card/'+card.id;element.dataset.openCard=card.id;
      element.setAttribute('aria-label','看完整內容：'+card.id+' '+card.template);
      element.setAttribute('aria-haspopup','dialog');
      $('.card-content',element).innerHTML='<div class="card-meta"><span class="card-code">'+card.id+'</span><span class="mini-face" aria-hidden="true">'+icon('smile')+'</span></div>'+tags(card)+'<h2 class="draw-card-title">'+escape(card.template)+'</h2><div class="section-label">故事架構</div>'+structure(card)+'<span class="card-detail-link">看完整內容 '+icon('arrow')+'</span>';
      setCovered(element,covered);
    });
    renderHandPicker();layoutHand();
  }
  function draw() {
    if($('#draw-button').disabled)return;
    const previous=new Set(currentCards.map(card=>card.id));
    const candidates=catalog.filter(card=>!previous.has(card.id)),next=[];
    const random=new Uint32Array(drawCount);
    if(globalThis.crypto?.getRandomValues)crypto.getRandomValues(random);
    else random.forEach((_,index)=>{random[index]=Math.floor(Math.random()*4294967296);});
    for(let index=0;index<drawCount;index++)next.push(candidates.splice(random[index]%candidates.length,1)[0]);
    const saved={cards:[...currentCards],activeHand};
    ensureSlots(drawCount);
    activeHand=compactHand()?Math.floor(drawCount/2):-1;
    flipFocus=document.activeElement;
    const results=$('#draw-results');
    const complete=()=>{
      pendingDraw=null;drawTimers=[];
      resetFlipControls();positionHand();
      $('#draw-status').textContent='抽到 '+next.length+' 張：'+next.map(card=>card.id+' '+card.template).join('；');
      if(flipFocus===$('#draw-button')&&document.activeElement===document.body)$('#draw-button').focus({preventScroll:true});
    };
    if(reduced()){renderDraw(next);complete();return;}
    pendingDraw=saved;
    $('#draw-button').disabled=true;$('#draw-button').setAttribute('aria-busy','true');
    $('#draw-button-label').textContent='展開卡片…';
    $$('.draw-count input').forEach(input=>{input.disabled=true;});
    $$('#hand-picker button').forEach(button=>{button.disabled=true;});
    results.setAttribute('aria-busy','true');
    results.classList.add('is-dealing','is-gathering');results.dataset.phase='gather';
    [...results.children].forEach(card=>setCovered(card,true));
    positionHand();
    $('#draw-status').textContent='先展開 '+drawCount+' 張卡片背面';
    drawTimers.push(setTimeout(()=>{
      renderDraw(next,true);
      results.classList.remove('is-gathering');results.dataset.phase='spread';
    },180));
    next.forEach((card,index)=>{
      drawTimers.push(setTimeout(()=>{
        results.dataset.phase='reveal';results.dataset.revealIndex=index+1;
        setCovered(results.children[index],false);positionHand();
        $('#draw-button-label').textContent='翻牌 '+(index+1)+' / '+next.length;
      },540+index*240));
    });
    drawTimers.push(setTimeout(complete,540+(next.length-1)*240+260));
  }
  $('#draw-button').addEventListener('click',draw);
  $$('.draw-count input').forEach(input=>input.addEventListener('change',()=>{
    cancelFlip();drawCount=Number(input.value);resetFlipControls();
  }));

  const character = (index) => {
    const faces = [
      '<path d="M20 21v7m23-7v7M19 39q13 14 26-1"/>',
      '<path d="m16 25 8-4 1 9m17-8 7 4M23 41q10 7 20-2"/>',
      '<path d="M19 24h.1m25 0h.1M24 40q8 9 16-1" stroke-width="5"/>'
    ];
    return '<svg class="card-character" aria-hidden="true" viewBox="0 0 64 64"><path d="M31 5C13 3 3 17 5 34s15 25 31 24S62 41 58 25 47 5 31 5z"/>' + faces[index%3] + '</svg>';
  };
  function renderCards() {
    const matching = order.filter(card => (!theme || card.theme === theme) && (!query || searchIndex.get(card.id).includes(query.toLocaleLowerCase())));
    $('#card-count').textContent = matching.length + ' 張卡片';
    $('#cards-grid').innerHTML = matching.map((card,index) => '<a class="card-tile card-' + themeColor(card) + '" href="#card/' + card.id + '" data-open-card="' + card.id + '" aria-label="查看 ' + card.id + ' ' + escape(card.template) + '"><div class="tile-top"><span class="card-code">' + card.id + '</span><span class="tile-theme">' + escape(card.theme) + '</span></div>' + character(index) + '<h2>' + escape(card.template) + '</h2><p class="tile-formula">' + escape(card.formula) + '</p><div class="tile-bottom"><span>' + escape(card.form) + ' · ' + escape(card.headline) + '</span>' + icon('arrow') + '</div></a>').join('');
    $('#empty-state').hidden = matching.length !== 0;
  }
  $('#theme-filter').insertAdjacentHTML('beforeend',themes.map(value => '<option value="' + escape(value) + '">' + escape(value) + '</option>').join(''));
  $('#theme-filter').addEventListener('change',event => { theme = event.target.value; renderCards(); });
  $('#card-search').addEventListener('input',event => {
    clearTimeout(searchTimer); query = event.target.value.trim();
    searchTimer = setTimeout(renderCards,100);
  });
  $('#reset-search').addEventListener('click',() => {
    clearTimeout(searchTimer); query = theme = '';
    $('#card-search').value = ''; $('#theme-filter').value = '';
    renderCards(); $('#card-search').focus();
  });

  function renderDetail(card) {
    const examples=card.examples.map((example,index)=>'<details class="example"'+(index===0?' open':'')+'><summary><span>範例 '+(index+1)+'：'+escape(example.scenario)+'</span><span class="plus" aria-hidden="true">+</span></summary><div class="example-content"><h3>'+escape(example.title)+'</h3><p class="example-note">虛構示例，請換成你的真實素材。</p><p>'+escape(example.copy)+'</p>'+(example.shots?.length?'<h4>畫面怎麼拍</h4><ul>'+example.shots.map(text=>'<li>'+escape(text)+'</li>').join('')+'</ul>':'')+'</div></details>').join('');
    const footer=modalState.source==='cards'
      ?'<div class="return-draw"><a class="button" href="#draw" data-modal-nav="draw">'+icon('dice')+'回到翻卡</a><p>沒靈感，再抽抽看</p></div><button class="button secondary" data-close-detail type="button">關閉視窗</button>'
      :'<button class="button" data-close-detail type="button">回到這手卡片</button><a class="button secondary" href="#cards/'+card.id+'" data-modal-nav="cards" data-catalog-card="'+card.id+'">在全部卡片開啟這張 '+icon('arrow')+'</a>';
    const headingAction=modalState.source==='draw'
      ?'<a class="button small-button" href="#cards/'+card.id+'" data-modal-nav="cards" data-catalog-card="'+card.id+'">在全部卡片開啟 '+icon('arrow')+'</a>'
      :'<span class="detail-doodle" aria-hidden="true">'+icon('spark')+'</span>';
    $('#detail-content').innerHTML='<article class="detail-card"><header><div class="card-meta"><span class="card-code">'+card.id+'</span>'+headingAction+'</div>'+tags(card)+'<h1 id="detail-title">'+escape(card.template)+'</h1><p class="detail-concept">'+escape(card.concept)+'</p></header><section class="detail-framework" aria-labelledby="framework-title"><div class="section-heading"><h2 id="framework-title">這張卡的拍攝架構</h2><button class="button small-button" id="copy-framework">'+icon('copy')+'<span>複製架構</span></button></div>'+structure(card)+'<div id="copy-fallback" hidden><label for="framework-text">請選取文字複製</label><textarea id="framework-text" readonly rows="8"></textarea></div></section><section class="detail-examples" aria-labelledby="examples-title"><h2 id="examples-title">把架構，變成一支影片。</h2>'+examples+'</section><aside class="detail-tips"><h2>開拍前的小提醒</h2><ul>'+card.avoid.map(text=>'<li>'+escape(text)+'</li>').join('')+'</ul></aside><footer class="dialog-footer">'+footer+'</footer></article>';
    $('#copy-framework').addEventListener('click',()=>copyFramework(card));
  }
  function baseTitle() {
    return page==='cards'?'全部靈感卡｜文案靈感隨機卡片':'文案靈感隨機卡片';
  }
  function openDetail(id,opener=document.activeElement,legacy=false) {
    const card=byId.get(id);if(!card)return;
    if(modalState)closeDetail({restore:false,normalizeHash:false});
    cancelFlip();
    clearTimeout(toastTimer);$('#toast').hidden=true;
    const body=document.body,root=document.documentElement;
    const gap=innerWidth-root.clientWidth;
    modalState={source:page,opener,scrollX,scrollY,activeHand,legacy,bodyOverflow:body.style.overflow,rootOverflow:root.style.overflow,bodyPadding:body.style.paddingRight};
    body.style.paddingRight=((parseFloat(getComputedStyle(body).paddingRight)||0)+gap)+'px';
    body.style.overflow='hidden';root.style.overflow='hidden';
    cardDialog.className='card-dialog card-'+themeColor(card);
    renderDetail(card);
    document.title=card.template+'｜文案靈感隨機卡片';
    cardDialog.showModal();cardDialog.scrollTop=0;
    $('#close-detail').focus({preventScroll:true});
    window.scrollTo(modalState.scrollX,modalState.scrollY);
  }
  function closeDetail({restore=true,normalizeHash=true}={}) {
    const saved=modalState;
    if(!saved){if(cardDialog.open)cardDialog.close();return;}
    modalState=null;restoringModal=true;
    clearTimeout(toastTimer);$('#toast').hidden=true;
    if(cardDialog.open)cardDialog.close();
    document.body.style.overflow=saved.bodyOverflow;
    document.documentElement.style.overflow=saved.rootOverflow;
    document.body.style.paddingRight=saved.bodyPadding;
    if(normalizeHash&&saved.legacy)history.replaceState(null,'','#'+saved.source);
    document.title=baseTitle();
    if(restore){
      activeHand=saved.activeHand;positionHand();
      if(saved.opener?.isConnected)saved.opener.focus({preventScroll:true});
      else $('#main').focus({preventScroll:true});
      window.scrollTo(saved.scrollX,saved.scrollY);
    }
    queueMicrotask(()=>{restoringModal=false;});
  }
  $('#close-detail').addEventListener('click',()=>closeDetail());
  cardDialog.addEventListener('keydown',event=>{
    if(event.key!=='Tab')return;
    const controls=$$('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])',cardDialog).filter(node=>node.getClientRects().length);
    const first=controls[0],last=controls[controls.length-1];
    if(!first){event.preventDefault();return;}
    if(event.shiftKey&&(document.activeElement===first||document.activeElement===cardDialog)){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
  cardDialog.addEventListener('cancel',event=>{event.preventDefault();closeDetail();});
  cardDialog.addEventListener('close',()=>{if(!cardDialog.open&&modalState)closeDetail();});
  let backdropDown=false;
  const outsideDialog=event=>{
    const rect=cardDialog.getBoundingClientRect();
    return event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom;
  };
  cardDialog.addEventListener('pointerdown',event=>{backdropDown=event.target===cardDialog&&outsideDialog(event);});
  cardDialog.addEventListener('click',event=>{if(backdropDown&&event.target===cardDialog&&outsideDialog(event))closeDetail();backdropDown=false;});

  async function copyFramework(card) {
    const copyButton = $('#copy-framework');
    const fallback = $('#copy-fallback'), field = $('#framework-text');
    const text = card.id + '｜' + card.theme + ' × ' + card.form + ' × ' + card.headline + '\n\n' + card.template + '\n\n' + card.concept + '\n\n拍攝架構\n' + steps(card).map((step,index)=>(index+1)+'. '+step).join('\n');
    let success = false;
    try {
      if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); success=true; }
    } catch {}
    if (!copyButton.isConnected) return;
    if (!success) {
      fallback.hidden=false; field.value=text; field.focus(); field.select();
      try { success = document.execCommand('copy'); } catch {}
      if (success) { fallback.hidden=true; copyButton.focus(); }
    }
    if (success) {
      $('span',copyButton).textContent='已複製！'; toast('架構已複製，接著換成你的故事。');
    } else toast('這個瀏覽器無法自動複製，請選取下方文字。');
  }

  function route(focus=true) {
    cancelFlip();
    if(modalState)closeDetail({restore:false,normalizeHash:false});
    const [target,id]=(location.hash.slice(1)||'draw').split('/');
    const linkedCard=(target==='cards'||target==='card'||target==='detail')&&byId.has(id);
    page=target==='cards'||target==='browse'||linkedCard?'cards':'draw';
    document.body.dataset.view=page;
    $$('.page').forEach(section=>{section.hidden=section.id!==page+'-view';});
    $$('[data-page]').forEach(link=>{
      if(link.dataset.page===page)link.setAttribute('aria-current','page');
      else link.removeAttribute('aria-current');
    });
    if(page==='cards')renderCards();else layoutHand();
    document.title=baseTitle();
    if(focus){window.scrollTo({top:0,behavior:'instant'});$('#main').focus({preventScroll:true});}
    if(linkedCard){
      clearTimeout(searchTimer);
      let opener=$('[data-open-card="'+id+'"]',$('#cards-grid'));
      if(!opener){
        query=theme='';
        $('#card-search').value='';$('#theme-filter').value='';renderCards();
        opener=$('[data-open-card="'+id+'"]',$('#cards-grid'));
      }
      opener.scrollIntoView({block:'center',behavior:'instant'});
      opener.focus({preventScroll:true});
      openDetail(id,opener,true);
    }
  }
  document.addEventListener('click',event=>{
    const close=event.target.closest('[data-close-detail]');
    if(close){event.preventDefault();closeDetail();return;}
    const destination=event.target.closest('[data-modal-nav]');
    if(destination){
      if(event.button!==0||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;
      event.preventDefault();
      const target=destination.dataset.modalNav;
      const hash=target==='cards'&&destination.dataset.catalogCard?'#cards/'+destination.dataset.catalogCard:'#'+target;
      closeDetail({restore:false});
      if(location.hash===hash)route();else location.hash=hash;
      return;
    }
    const link=event.target.closest('[data-open-card]');
    if(!link||event.button!==0||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;
    event.preventDefault();
    if(pendingDraw||link.classList.contains('is-covered'))return;
    openDetail(link.dataset.openCard,link);
  });
  $('.skip-link').addEventListener('click',event => {
    event.preventDefault(); $('#main').focus({preventScroll:true}); $('#main').scrollIntoView({block:'start'});
  });
  window.addEventListener('hashchange',() => route());
  document.addEventListener('visibilitychange',() => { if(document.hidden) cancelFlip(); });
  ensureSlots(1);
  route(false);
})();
