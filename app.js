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
  let page = 'draw', currentCard, detailOrigin = 'cards';
  let query = '', theme = '', listScroll = 0, lastOpenedId = '';
  let midTimer, endTimer, searchTimer, toastTimer, flipFocus;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const searchIndex = new Map(catalog.map(card => [card.id, JSON.stringify(card).toLocaleLowerCase()]));
  const order = catalog.map((_,index) => catalog[(index % 7)*30 + ((Math.floor(index/7)*7 + (index%7)*4)%30)]);

  function toast(text) {
    clearTimeout(toastTimer);
    $('#toast').textContent = text;
    $('#toast').hidden = false;
    toastTimer = setTimeout(() => { $('#toast').hidden = true; },3500);
  }
  function resetFlipControls() {
    $('#draw-button').disabled = false;
    $('#draw-button').removeAttribute('aria-busy');
    $('#draw-button-label').textContent = currentCard ? '再翻一張' : '隨機翻一張';
    $('#inspiration-card').classList.remove('is-flipping');
  }
  function cancelFlip() {
    clearTimeout(midTimer); clearTimeout(endTimer);
    midTimer = endTimer = undefined;
    resetFlipControls();
  }
  function renderDraw(card) {
    currentCard = card;
    const article = $('#inspiration-card');
    article.className = 'inspiration-card card-' + themeColor(card) + (article.classList.contains('is-flipping') ? ' is-flipping' : '');
    article.dataset.cardId = card.id;
    article.setAttribute('aria-label',card.id + ' ' + card.template);
    $('#card-content').innerHTML = '<div class="card-meta"><span class="card-code">' + card.id + '</span><span class="mini-face" aria-hidden="true">' + icon('smile') + '</span></div>' + tags(card) + '<h2 class="draw-card-title">' + escape(card.template) + '</h2><p class="card-concept">' + escape(card.concept) + '</p><div class="section-label">故事可以這樣走 <span aria-hidden="true">↘</span></div>' + structure(card) + '<a class="card-detail-link" href="#card/' + card.id + '" data-open-card="' + card.id + '">看完整內容與範例 ' + icon('arrow') + '</a>';
  }
  function draw() {
    if ($('#draw-button').disabled) return;
    const candidates = catalog.filter(card => card.id !== currentCard?.id);
    const random = new Uint32Array(1);
    if (globalThis.crypto?.getRandomValues) crypto.getRandomValues(random);
    else random[0] = Math.floor(Math.random()*4294967296);
    const next = candidates[random[0] % candidates.length];
    flipFocus = document.activeElement;
    if (reduced()) {
      renderDraw(next); resetFlipControls();
      $('#draw-status').textContent = '翻到 ' + next.id + '：' + next.template;
      return;
    }
    $('#draw-button').disabled = true;
    $('#draw-button').setAttribute('aria-busy','true');
    $('#draw-button-label').textContent = '翻卡中…';
    $('#inspiration-card').classList.add('is-flipping');
    $('#draw-status').textContent = '正在翻開下一張靈感…';
    midTimer = setTimeout(() => { renderDraw(next); midTimer = undefined; },180);
    endTimer = setTimeout(() => {
      resetFlipControls(); endTimer = undefined;
      $('#draw-status').textContent = '翻到 ' + next.id + '：' + next.template;
      if (flipFocus === $('#draw-button') && document.activeElement === document.body) $('#draw-button').focus({preventScroll:true});
      if (innerWidth < 760) $('#inspiration-card').scrollIntoView({behavior:'smooth',block:'start'});
    },380);
  }
  $('#draw-button').addEventListener('click',draw);
  $('#cover-draw').addEventListener('click',() => {
    $('#draw-button').focus({preventScroll:true});
    draw();
  });

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
    const examples = card.examples.map((example,index) => '<details class="example"' + (index===0 ? ' open' : '') + '><summary><span>範例 ' + (index+1) + '：' + escape(example.scenario) + '</span><span class="plus" aria-hidden="true">+</span></summary><div class="example-content"><h3>' + escape(example.title) + '</h3><p class="example-note">虛構示例，請換成你的真實素材。</p><p>' + escape(example.copy) + '</p>' + (example.shots?.length ? '<h4>畫面怎麼拍</h4><ul>' + example.shots.map(text=>'<li>' + escape(text) + '</li>').join('') + '</ul>' : '') + '</div></details>').join('');
    $('#detail-content').innerHTML = '<a class="back-link" id="detail-back" href="#' + detailOrigin + '">' + icon('back') + (detailOrigin==='draw' ? '回到翻卡' : '回到全部卡片') + '</a><article class="detail-card card-' + themeColor(card) + '"><header><div class="card-meta"><span class="card-code">' + card.id + '</span><span class="detail-doodle" aria-hidden="true">' + icon('spark') + '</span></div>' + tags(card) + '<h1>' + escape(card.template) + '</h1><p class="detail-concept">' + escape(card.concept) + '</p></header><section class="detail-framework" aria-labelledby="framework-title"><div class="section-heading"><h2 id="framework-title">這張卡的拍攝架構</h2><button class="button small-button" id="copy-framework">' + icon('copy') + '<span>複製架構</span></button></div>' + structure(card) + '<div id="copy-fallback" hidden><label for="framework-text">請選取文字複製</label><textarea id="framework-text" readonly rows="8"></textarea></div></section><section class="detail-examples" aria-labelledby="examples-title"><h2 id="examples-title">把架構，變成一支影片。</h2>' + examples + '</section><aside class="detail-tips"><h2>開拍前的小提醒</h2><ul>' + card.avoid.map(text=>'<li>' + escape(text) + '</li>').join('') + '</ul></aside></article>';
    $('#copy-framework').addEventListener('click',() => copyFramework(card));
  }
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

  function route(focus = true) {
    cancelFlip();
    const previous = page;
    const hash = location.hash.slice(1) || 'draw';
    const [target,id] = hash.split('/');
    if ((target==='card' || target==='detail') && byId.has(id)) {
      page='detail'; renderDetail(byId.get(id));
    } else page = target==='cards' || target==='browse' ? 'cards' : 'draw';
    $$('.page').forEach(section => { section.hidden = section.id !== page+'-view'; });
    $$('[data-page]').forEach(link => {
      const active = link.dataset.page === (page==='detail' ? detailOrigin : page);
      if (active) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current');
    });
    if (page==='cards') renderCards();
    document.title = page==='detail' ? byId.get(id).template + '｜靈感場' : page==='cards' ? '全部靈感卡｜靈感場' : '靈感場｜翻一張，想到下一支！';
    if (focus) {
      if (page==='cards' && previous==='detail' && detailOrigin==='cards') {
        window.scrollTo({top:listScroll,behavior:'instant'});
        const cardLink=$('[data-open-card="'+lastOpenedId+'"]',$('#cards-grid'));
        cardLink?.focus({preventScroll:true});
      } else {
        window.scrollTo({top:0,behavior:'instant'});
        $('#main').focus({preventScroll:true});
      }
    }
  }
  document.addEventListener('click',event => {
    const link=event.target.closest('[data-open-card]');
    if (!link) return;
    detailOrigin=page==='draw' ? 'draw' : 'cards';
    if (page==='cards') { listScroll=scrollY; lastOpenedId=link.dataset.openCard; }
  });
  $('.skip-link').addEventListener('click',event => {
    event.preventDefault(); $('#main').focus({preventScroll:true}); $('#main').scrollIntoView({block:'start'});
  });
  window.addEventListener('hashchange',() => route());
  document.addEventListener('visibilitychange',() => { if(document.hidden) cancelFlip(); });
  route(false);
})();
