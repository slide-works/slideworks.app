// SlideWorks landing page. Plain script, no build step.
// One sample deck (the <template id="deck">) is cloned into every slide frame on the page.
(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js');
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------------------------------------------------------------- theme */
  $('#themeBtn').addEventListener('click', () => {
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('sw-theme', root.dataset.theme); } catch {}
  });

  /* ---------------------------------------------------------------- the deck */
  const PARTS = ['The cost', 'Slice it', 'Ship it', 'Make it stick'];
  const DECK = 'Ship smaller';
  const slides = [...$('#deck').content.children].filter(el => el.classList.contains('sw'));
  const N = slides.length;
  // Chrome from the default template: part tracker, footer and progress bar.
  slides.forEach((s, i) => {
    if (!s.classList.contains('dark')) {
      const part = +s.dataset.part;
      const nav = document.createElement('div');
      nav.className = 'snav';
      nav.innerHTML = PARTS.map((p, k) => `<span class="${k < part ? 'past' : k === part ? 'on' : ''}">${p}</span>`).join('');
      s.prepend(nav);
      const foot = document.createElement('div');
      foot.className = 'sfoot';
      foot.innerHTML = `<span><b>${i + 1}</b> / ${N} · ${DECK} · Sam Rivera</span>`;
      s.append(foot);
    }
    const prog = document.createElement('div');
    prog.className = 'sprog';
    prog.style.width = ((i + 1) / N * 100) + '%';
    s.append(prog);
  });
  // Layouts added after the sample deck: the same chrome, with no slide number.
  const more = [...$('#more').content.children].filter(el => el.classList.contains('sw'));
  more.forEach(s => {
    const part = +s.dataset.part;
    const nav = document.createElement('div');
    nav.className = 'snav';
    nav.innerHTML = PARTS.map((p, k) => `<span class="${k < part ? 'past' : k === part ? 'on' : ''}">${p}</span>`).join('');
    s.prepend(nav);
    const foot = document.createElement('div');
    foot.className = 'sfoot';
    foot.innerHTML = `<span>${DECK} · Sam Rivera</span>`;
    s.append(foot);
  });
  const byLayout = name => slides.findIndex(s => s.dataset.layout === name);
  const stepsOf = i => slides[i].querySelectorAll('.f').length;

  // Keep every frame's 1920x1080 slide scaled to the frame's width.
  const ro = new ResizeObserver(entries => {
    for (const e of entries) e.target.style.setProperty('--s', e.contentRect.width / 1920);
  });
  function mountEl(frame, el) {
    const s = el.cloneNode(true);
    frame.replaceChildren(s);
    if (!frame.dataset.ro) { ro.observe(frame); frame.dataset.ro = '1'; }
    return s;
  }
  function mount(frame, i, step) {
    const s = mountEl(frame, slides[i]);
    if (step !== undefined) s.querySelectorAll('.f').forEach((f, k) => f.classList.toggle('on', k < step));
    return s;
  }
  function newFrame(i) {
    const f = document.createElement('div');
    f.className = 'frame';
    mount(f, i);
    return f;
  }

  /* ---------------------------------------------------------------- hero player */
  {
    const stage = $('#heroStage');
    const player = $('#heroPlayer');
    const frames = $$('[data-player-frame]', stage);
    const autoBtn = $('[data-p="auto"]', stage);
    let idx = 0, step = 0, paused = reduced, visible = true, timer = 0;

    function render() {
      frames.forEach(f => mount(f, idx, step));
      $$('[data-count]', stage).forEach(c => c.textContent = `${idx + 1} / ${N}`);
      $$('[data-bar]', stage).forEach(b => b.style.width = ((idx + 1) / N * 100) + '%');
      $$('[data-hash]', stage).forEach(h => h.textContent = '#' + (idx + 1) + (step ? '.' + step : ''));
      const n = stepsOf(idx);
      $('[data-steps]', stage).innerHTML = Array.from({ length: n }, (_, k) => `<i class="${k < step ? 'on' : ''}"></i>`).join('');
    }
    function next() { if (step < stepsOf(idx)) step++; else { idx = (idx + 1) % N; step = 0; } render(); }
    function prev() { if (step > 0) step--; else if (idx > 0) { idx--; step = stepsOf(idx); } render(); }
    function schedule() {
      clearTimeout(timer);
      if (paused || !visible || document.hidden) return;
      const isStep = step < stepsOf(idx);
      timer = setTimeout(() => { next(); schedule(); }, isStep ? 1100 : 3400);
    }
    function setPaused(p) {
      paused = p;
      autoBtn.classList.toggle('paused', p);
      autoBtn.setAttribute('aria-label', p ? 'Play the deck automatically' : 'Pause the autoplay');
      schedule();
    }
    function user(fn) { fn(); setPaused(true); }
    $$('[data-p]', stage).forEach(b => b.addEventListener('click', () => {
      if (b.dataset.p === 'next') user(next);
      else if (b.dataset.p === 'prev') user(prev);
      else setPaused(!paused);
    }));
    frames[0].addEventListener('click', () => user(next));
    player.addEventListener('keydown', e => {
      if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); user(next); }
      else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); user(prev); }
      else if (e.key === 'Home') { e.preventDefault(); user(() => { idx = 0; step = 0; render(); }); }
      else if (e.key === 'End') { e.preventDefault(); user(() => { idx = N - 1; step = 0; render(); }); }
    });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; schedule(); }, { threshold: .25 }).observe(player);
    document.addEventListener('visibilitychange', schedule);
    render();
    setPaused(paused);
  }

  /* ---------------------------------------------------------------- hero: the guest phone's reactions float up the deck */
  {
    const RX = ['👍', '❤️', '😂', '😮', '👏'];
    const row = $('#heroRxRow'), layer = $('#heroRx');
    row.innerHTML = RX.map((e, i) => `<button type="button" data-i="${i}" aria-label="React with ${e}">${e}</button>`).join('');
    const float = e => {
      const sp = document.createElement('span');
      sp.textContent = e;
      sp.style.right = (4 + Math.random() * 14) + '%';
      layer.append(sp);
      setTimeout(() => sp.remove(), 2700);
    };
    row.addEventListener('click', ev => { const b = ev.target.closest('button'); if (b) float(RX[+b.dataset.i]); });
    // The rest of the room reacts now and then while the hero is on screen.
    let timer = 0, visible = false;
    const tick = () => {
      clearTimeout(timer);
      if (!visible || reduced || document.hidden) return;
      timer = setTimeout(() => { float(RX[Math.floor(Math.random() * RX.length)]); tick(); }, 1800 + Math.random() * 2600);
    };
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; tick(); }, { threshold: .25 }).observe(layer.parentElement);
    document.addEventListener('visibilitychange', tick);
  }

  /* ---------------------------------------------------------------- live-room slides: join and poll */
  // A QR-like pattern (decorative): three finder squares and seeded modules.
  const QR = (() => {
    const n = 25;
    let seed = 482913;
    const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    const finder = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`;
    const inFinder = (x, y) => (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
    let cells = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!inFinder(x, y) && rnd() > .52) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    return `<svg viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" aria-hidden="true"><g fill="#0b1020">${finder(0, 0)}${finder(n - 7, 0)}${finder(0, n - 7)}${cells}</g></svg>`;
  })();
  const live = {};
  [...$('#live').content.children].forEach(el => {
    el.querySelectorAll('[data-qr]').forEach(q => q.innerHTML = QR);
    live[el.dataset.live] = el;
  });
  $$('[data-qr]').forEach(q => q.innerHTML = QR);
  more.forEach(s => s.querySelectorAll('[data-qr]').forEach(q => q.innerHTML = QR));
  $$('[data-live]').forEach(f => mountEl(f, live[f.dataset.live]));

  /* ---------------------------------------------------------------- mounts by layout */
  $$('[data-slide]').forEach(f => mount(f, byLayout(f.dataset.slide)));
  // The join bar: a small QR code and the code on a content slide while the deck is live.
  $$('[data-joinbar] .sw').forEach(s => s.insertAdjacentHTML('beforeend', `<div class="joinbar"><div class="jbq">${QR}</div><div><span>slideworks.live</span><b>482 913</b></div></div>`));
  $$('[data-mini]').forEach(f => mount(f, +f.dataset.mini));

  /* ---------------------------------------------------------------- gallery + lightbox */
  {
    const gallery = $('#gallery');
    const dlg = $('#lightbox');
    const lbFrame = $('#lbFrame');
    const lbCap = $('#lbCap');
    let cur = 0;
    const all = [...slides, ...more];
    const slotsHtml = s => s.dataset.slots.split(' · ').map(x => `<span class="slot">${x}</span>`).join('');
    all.forEach((s, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'g-item rv';
      b.setAttribute('aria-label', `The ${s.dataset.layout} layout. Open it larger.`);
      const f = document.createElement('div');
      f.className = 'frame';
      mountEl(f, s);
      b.append(f);
      const m = document.createElement('div');
      m.className = 'g-meta';
      m.innerHTML = `<span class="no">${String(i + 1).padStart(2, '0')}</span><code class="layout">${s.dataset.layout}</code>` + slotsHtml(s);
      b.append(m);
      b.addEventListener('click', () => open(i));
      (i < N ? gallery : $('#gallery2')).append(b);
    });
    function show(i) {
      cur = (i + all.length) % all.length;
      mountEl(lbFrame, all[cur]);
      const s = all[cur];
      lbCap.innerHTML = `<code class="layout">${s.dataset.layout}</code>${slotsHtml(s)}<span class="notes">Notes: ${s.dataset.notes}</span>`;
    }
    function open(i) { show(i); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
    $$('[data-lb]', dlg).forEach(b => b.addEventListener('click', () => {
      if (b.dataset.lb === 'close') dlg.close(); else show(cur + (b.dataset.lb === 'next' ? 1 : -1));
    }));
    dlg.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') show(cur + 1);
      if (e.key === 'ArrowLeft') show(cur - 1);
    });
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  }

  /* ---------------------------------------------------------------- palettes */
  {
    const stage = $('#palStage');
    $$('input[name="pal"]').forEach(r => r.addEventListener('change', () => { if (r.checked) stage.dataset.pal = r.value; }));
  }

  /* ---------------------------------------------------------------- the agent's session */
  {
    const out = $('#termOut');
    const thumbs = $('#dpThumbs');
    const feed = $('#dpFeed');
    const dpFrame = $('#dpFrame');
    const empty = dpFrame.innerHTML;
    const title = $('#dpTitle'), count = $('#dpCount'), share = $('#dpShare'), reject = $('#dpReject'), warn = $('#dpWarn');
    const L = {
      c: t => ({ t: `<span class="c">${t}</span>` }),
      call: (t, then) => ({ type: true, t: `<span class="call">→ ${t}</span>`, then }),
      ok: (t, then) => ({ t: `<span class="ok">← ${t}</span>`, then }),
      err: (t, then) => ({ t: `<span class="err">✗ ${t}</span>`, then }),
    };
    const s = str => `<span class="s">${str}</span>`;
    let added = 0;
    const add = (i, who = 'added slide ' + (i + 1)) => () => {
      added++;
      count.textContent = added + (added === 1 ? ' slide' : ' slides');
      mount(dpFrame, i);
      const slot = thumbs.children[i];
      slot.replaceChildren(newFrame(i));
      log(`<b>Claude</b> via MCP · ${who}`);
    };
    function log(html) {
      const li = document.createElement('li');
      li.innerHTML = `<span class="ag">AI</span><span>${html}</span>`;
      feed.prepend(li);
      while (feed.children.length > 3) feed.lastChild.remove();
    }
    const SCRIPT = [
      L.c(`# brief: outline.md, lead-times.csv, "20 minutes, four parts, end on one ask"`),
      L.call('list_layouts()'),
      L.ok('31 layouts: title, statement, bullets, compare, chart, flow, bars, stack … poll, word-cloud, qa (each with its slots)'),
      L.call(`create_deck({ title: ${s('"Ship smaller"')}, template: ${s('"talk"')}, palette: ${s('"cobalt"')},\n    parts: [${s('"The cost"')}, ${s('"Slice it"')}, ${s('"Ship it"')}, ${s('"Make it stick"')}] })`),
      L.ok('deck 7Kq2 · private · /d/7Kq2/ship-smaller', () => { title.textContent = DECK; count.textContent = '0 slides'; log('<b>Claude</b> via MCP · created the deck'); }),
      L.call(`add_slide({ layout: ${s('"title"')}, title: ${s('"Ship smaller"')}, stamp: ${s('"draft"')}, … })`),
      L.ok('slide 1', add(0)),
      L.call(`add_slide({ layout: ${s('"bullets"')}, part: 1, reveal: ${s('"one-by-one"')}, items: [ … ] })`),
      L.ok('slide 3 · steps 4', add(2)),
      L.call(`add_slide({ layout: ${s('"compare"')}, part: 2,\n    left: { tag: ${s('"Failure mode"')}, title: ${s('"Slice by layer"')}, items: [ … ] } })`),
      L.err('refused: compare.right is required { tag, title, items[] }', () => { reject.hidden = false; }),
      L.call(`add_slide({ layout: ${s('"compare"')}, part: 2, left: { … },\n    right: { tag: ${s('"Success mode"')}, title: ${s('"Slice by customer action"')}, items: [ … ] } })`),
      L.ok('slide 9', () => { reject.hidden = true; add(8)(); }),
      L.call(`add_slides({ deck: ${s('"7Kq2"')}, slides: [ { layout: ${s('"quote"')}, … }, { layout: ${s('"chart"')}, … },\n    … 11 more, each with its notes ] })`),
      { t: '<span class="ok">← 13 slides stored: 2, 4–8, 10–16</span>', then: fillRest },
      L.call(`check_deck({ deck: ${s('"7Kq2"')} })`),
      L.err('1 warning · slide 12 · smallText: axis labels drawn under 20 px', () => { mount(dpFrame, 11); warn.hidden = false; log('Check · slide 12 · small text'); }),
      L.call(`update_slide({ deck: ${s('"7Kq2"')}, slide: 12, chart: { … } })`),
      L.ok('slide 12 · revision 2'),
      L.call(`check_deck({ deck: ${s('"7Kq2"')} })`),
      L.ok('no findings on 16 slides', () => { warn.hidden = true; log('<b>Claude</b> via MCP · fixed slide 12'); }),
      L.call(`set_sharing({ deck: ${s('"7Kq2"')}, level: ${s('"link"')} })`),
      L.ok('sharing: link · logged to activity', () => { share.hidden = false; log('<b>Claude</b> via MCP · shared with anyone with the link'); }),
      L.call(`get_deck_url({ deck: ${s('"7Kq2"')}, slide: 1 })`),
      L.ok('https://slides.example.com/d/7Kq2/ship-smaller#1', () => mount(dpFrame, 0)),
    ];
    async function fillRest() {
      for (let i = 0; i < N; i++) {
        if (thumbs.children[i].firstChild) continue;
        added++;
        thumbs.children[i].replaceChildren(newFrame(i));
        mount(dpFrame, i);
        if (!fast) await sleep(110);
      }
      count.textContent = N + ' slides';
      log('<b>Claude</b> via MCP · added 13 slides and notes');
    }
    let run = 0, fast = false;
    function reset() {
      out.innerHTML = '';
      thumbs.innerHTML = Array.from({ length: N }, () => '<div class="slot"></div>').join('');
      feed.innerHTML = '';
      dpFrame.innerHTML = empty;
      title.textContent = 'Waiting for the agent…';
      count.textContent = '0 slides';
      share.hidden = true; reject.hidden = true; warn.hidden = true; added = 0;
    }
    async function play(instant) {
      const me = ++run;
      fast = instant;
      reset();
      const cursor = document.createElement('span');
      cursor.className = 'cursor';
      for (const line of SCRIPT) {
        if (me !== run) return;
        const ln = document.createElement('span');
        ln.className = 'ln';
        out.append(ln);
        if (line.type && !instant) {
          // type the call out, keeping the markup intact
          const tmp = document.createElement('span');
          tmp.innerHTML = line.t;
          const text = tmp.textContent;
          ln.textContent = '';
          ln.append(cursor);
          for (let k = 0; k <= text.length; k += 3) {
            if (me !== run) return;
            ln.textContent = text.slice(0, k);
            ln.append(cursor);
            out.scrollTop = out.scrollHeight;
            await sleep(12);
          }
          ln.innerHTML = line.t;
          await sleep(380);
        } else {
          ln.innerHTML = line.t;
        }
        ln.append('\n');
        if (line.then) await line.then();
        out.scrollTop = out.scrollHeight;
        if (!instant) await sleep(line.t.includes('class="c"') ? 500 : 700);
      }
      if (!instant) out.append(cursor);
    }
    reset();
    if (reduced) play(true);
    else {
      const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); play(false); } }, { threshold: .35 });
      io.observe($('#session'));
    }
    $('#termReplay').addEventListener('click', () => play(reduced));
  }

  /* ---------------------------------------------------------------- presenter + phone remote */
  {
    const pr = $('#presenter');
    const sec = $('#present');
    let idx = byLayout('practice'), black = false;
    const fmt = t => String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
    function notesHtml(i) {
      const n = slides[i].dataset.notes || '';
      const cut = n.indexOf('. ');
      return cut > 0 ? `<b>${n.slice(0, cut + 1)}</b>${n.slice(cut + 1)}` : `<b>${n}</b>`;
    }
    function partOf(i) {
      const s = slides[i];
      if (s.dataset.part !== undefined) return PARTS[+s.dataset.part];
      for (let k = i + 1; k < N; k++) if (slides[k].dataset.part !== undefined) return PARTS[+slides[k].dataset.part];
      return PARTS[PARTS.length - 1];
    }
    function render() {
      $$('[data-pr-now]', sec).forEach(f => mount(f, idx));
      $$('[data-pr-next]', sec).forEach(f => idx < N - 1 ? mount(f, idx + 1) : f.replaceChildren());
      $$('[data-pr-notes]', sec).forEach(n => n.innerHTML = notesHtml(idx));
      $('[data-pr-count]', sec).textContent = `${idx + 1} / ${N}`;
      $('[data-pr-next-no]', sec).textContent = idx < N - 1 ? `slide ${idx + 2}` : 'end of deck';
      $('[data-pr-part]', sec).textContent = partOf(idx);
      $('[data-pr-bar]', sec).style.width = ((idx + 1) / N * 100) + '%';
      $('[data-pr-black]', sec).hidden = !black;
      const bb = $('[data-pr="black"]', sec);
      bb.setAttribute('aria-pressed', black);
    }
    const go = d => { idx = Math.max(0, Math.min(N - 1, idx + d)); render(); };
    const toggleBlack = () => { black = !black; render(); };
    $$('[data-pr]', sec).forEach(b => b.addEventListener('click', () => {
      const a = b.dataset.pr;
      if (a === 'next') go(1); else if (a === 'prev') go(-1); else if (a === 'black') toggleBlack();
    }));
    pr.addEventListener('keydown', e => {
      if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); go(1); }
      else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); go(-1); }
      else if (e.key === 'b' || e.key === 'B') toggleBlack();
    });
    render();
    // The talk clock: 12:42 in, of a 30-minute slot. Runs while the section is on screen.
    let elapsed = 12 * 60 + 42, tick = 0;
    const clock = $('[data-pr-clock]', sec), left = $('[data-pr-left]', sec);
    function drawClock() {
      clock.textContent = fmt(elapsed);
      const l = Math.max(0, 30 * 60 - elapsed);
      left.textContent = fmt(l);
      clock.parentElement.parentElement.classList.toggle('amber', l <= 300);
    }
    drawClock();
    if (!reduced) new IntersectionObserver(([e]) => {
      clearInterval(tick);
      if (e.isIntersecting) tick = setInterval(() => { elapsed++; drawClock(); }, 1000);
    }).observe(pr);
  }

  /* ---------------------------------------------------------------- audience: the journey's poll */
  {
    const opts = $('#pollOpts');
    $$('button', opts).forEach(b => {
      b.innerHTML = `<span>${b.textContent}</span><span class="pc"></span>`;
      b.addEventListener('click', () => {
        if (opts.classList.contains('voted')) return;
        opts.classList.add('voted');
        b.classList.add('mine');
        $$('button', opts).forEach(o => {
          const v = +o.dataset.v + (o === b ? 1 : 0);
          o.style.setProperty('--w', v + '%');
          $('.pc', o).textContent = v + '%';
        });
      });
    });
  }

  /* ---------------------------------------------------------------- live poll: big screen, presenter panel, guest phone */
  {
    const sec = $('#polls');
    const OPTS = ['Under 200 lines', '200 to 500 lines', '500 to 1,000 lines', 'Size makes no difference'];
    const RIGHT = 0, JOINED = 41, WEIGHTS = [.55, .23, .13, .09];
    const slide = $('#pollScreen .sw');
    $('[data-poll-rows]', slide).innerHTML = OPTS.map(o => `<div class="prow"><span class="l">${o}</span><span class="trk"><i></i></span><span class="pct">0%</span></div>`).join('');
    const pRows = $('#ppRows'), gOpts = $('#gpOpts'), gMsg = $('#gpMsg');
    pRows.innerHTML = OPTS.map(o => `<li><span>${o}</span><i><b></b></i><em>0</em></li>`).join('');
    gOpts.innerHTML = OPTS.map((o, i) => `<button type="button" data-i="${i}"><span class="rad"></span><span>${o}</span><span class="pc"></span></button>`).join('');
    let counts, mine, open, shown, round = 1, timer = 0, visible = false;
    const total = () => counts.reduce((a, b) => a + b, 0);

    function draw() {
      const n = total();
      const pct = counts.map(c => n ? Math.round(c / n * 100) : 0);
      // the big screen
      slide.classList.toggle('closed', !open);
      slide.classList.toggle('answer', shown);
      $$('.prow', slide).forEach((r, i) => {
        r.classList.toggle('right', i === RIGHT);
        $('i', r).style.width = pct[i] + '%';
        $('.pct', r).textContent = pct[i] + '%';
      });
      $('[data-poll-state]', slide).textContent = open ? 'Open' : 'Closed';
      $('[data-poll-n]', slide).textContent = n;
      // the presenter's panel
      const st = $('#ppState');
      st.textContent = open ? 'Open' : 'Closed';
      st.classList.toggle('closed', !open);
      $('#ppRound').textContent = 'round ' + round;
      $('#ppN').textContent = n;
      $('#ppRate').textContent = `${Math.round(n / JOINED * 100)}% of ${JOINED} joined`;
      $$('li', pRows).forEach((li, i) => {
        li.classList.toggle('right', shown && i === RIGHT);
        $('b', li).style.width = pct[i] + '%';
        $('em', li).textContent = counts[i];
      });
      $('#ppNote').textContent = shown ? 'The answer is marked on the big screen and on every phone.'
        : open ? 'The room sees these results as they arrive.'
        : 'Closed. The big screen shows the final result.';
      $('[data-poll="close"]', sec).hidden = !open;
      $('[data-poll="answer"]', sec).hidden = open || shown;
      $('[data-poll="round"]', sec).hidden = open;
      // the guest's phone: no results before its owner has answered
      const results = mine !== null || !open;
      gOpts.classList.toggle('closed', !open);
      gOpts.classList.toggle('answer', shown);
      $$('button', gOpts).forEach((b, i) => {
        b.classList.toggle('mine', i === mine);
        b.classList.toggle('right', shown && i === RIGHT);
        b.setAttribute('aria-pressed', i === mine);
        b.style.setProperty('--w', results ? pct[i] + '%' : '0%');
        $('.pc', b).textContent = results ? pct[i] + '%' : '';
      });
      gMsg.innerHTML = shown
          ? (mine === RIGHT ? '<b>You got it</b>' : mine === null ? '<b class="plain">Poll closed</b>' : '<b class="miss">Not this time</b>') + `<span>The answer is ${OPTS[RIGHT]}.</span>`
        : !open ? `<b class="plain">Poll closed</b><span>${n} answers.${mine === null ? '' : ' Yours is marked.'}</span>`
        : mine === null ? '<span>Tap an option to answer. Nobody sees who picked what.</span>'
        : `<b>✓ Answer sent</b><span>${n} answers so far. Tap another option to change it.</span>`;
    }
    // The rest of the room answers while the poll is open and on screen.
    function schedule() {
      clearTimeout(timer);
      const others = total() - (mine === null ? 0 : 1);
      if (!open || !visible || reduced || others >= JOINED - 3) return;
      timer = setTimeout(() => {
        let r = Math.random(), k = 0;
        while (k < WEIGHTS.length - 1 && r > WEIGHTS[k]) r -= WEIGHTS[k++];
        counts[k]++;
        draw();
        schedule();
      }, 500 + Math.random() * 900);
    }
    function start(seeded) {
      counts = seeded ? (reduced ? [19, 8, 5, 3] : [6, 2, 2, 1]) : (reduced ? [18, 9, 6, 3] : [0, 0, 0, 0]);
      mine = null; open = true; shown = false;
      draw();
      schedule();
    }
    gOpts.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b || !open) return;
      const i = +b.dataset.i;
      if (i === mine) return;
      if (mine !== null) counts[mine]--;
      counts[i]++;
      mine = i;
      draw();
    });
    $$('[data-poll]', sec).forEach(b => b.addEventListener('click', () => {
      const a = b.dataset.poll;
      if (a === 'close') { open = false; clearTimeout(timer); draw(); $('[data-poll="answer"]', sec).focus(); }
      else if (a === 'answer') { shown = true; draw(); $('[data-poll="round"]', sec).focus(); }
      else { round++; start(false); $('[data-poll="close"]', sec).focus(); }
    }));
    start(true);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; schedule(); }, { threshold: .2 }).observe(slide.parentElement);
  }

  /* ---------------------------------------------------------------- Q&A and reactions (SW-9) */
  {
    const sec = $('#qa');
    const RX = ['👍', '❤️', '😂', '😮', '👏'];
    let qs = [
      { id: 1, text: 'How do you split a database migration into small changes?', votes: 14, who: 'Anonymous', ago: '6 min' },
      { id: 2, text: 'What do you do when a small change still needs a big review?', votes: 9, who: 'Priya', ago: '5 min' },
      { id: 3, text: 'Does trunk-based development work with a release train?', votes: 7, who: 'Anonymous', ago: '4 min' },
      { id: 4, text: 'How small is too small?', votes: 5, who: 'Anonymous', ago: '2 min' },
    ];
    let nextId = 5, onScreen = null, answered = 0, reactions = 0, visible = false, timer = 0;
    const mineUp = new Set();
    const slide = mount($('#qaScreen'), byLayout('rules'));
    const qpList = $('#qpList'), gqList = $('#gqList');
    $('#rxRow').innerHTML = RX.map((e, i) => `<button type="button" data-qa="rx" data-id="${i}" aria-label="React with ${e}">${e}</button>`).join('');

    function draw() {
      const act = document.activeElement;
      const key = act && sec.contains(act) && act.dataset.qa ? [act.dataset.qa, act.dataset.id] : null;
      const list = qs.slice().sort((a, b) => b.votes - a.votes || a.id - b.id);
      const shown = qs.find(q => q.id === onScreen);
      // the big screen: one question as a card over the slide
      const old = $('.qcard', slide);
      if (old) old.remove();
      slide.classList.toggle('asked', !!shown);
      if (shown) slide.insertAdjacentHTML('beforeend', `<div class="qcard"><div class="qk"><span>Question from the room</span><span class="v">▲ ${shown.votes}</span><span class="who">${esc(shown.who)}</span></div><p>${esc(shown.text)}</p></div>`);
      // the presenter's panel: the top three
      qpList.innerHTML = list.slice(0, 3).map(q => {
        const on = q.id === onScreen;
        return `<li class="${on ? 'on' : ''}"><span class="qv">${q.votes}</span><div><p>${esc(q.text)}</p><small>${esc(q.who)} · ${q.ago}${on ? ' · <b>On screen now</b>' : ''}</small>
          <div class="pp-btns"><button type="button" class="pbtn sm${on ? '' : ' primary'}" data-qa="show" data-id="${q.id}">${on ? 'Take off screen' : 'Show on screen'}</button><button type="button" class="pbtn sm" data-qa="done" data-id="${q.id}">Answered</button></div></div></li>`;
      }).join('') || '<li><span class="none">No open questions. New ones appear here as the room asks.</span></li>';
      $('#qpOpen').textContent = 'Open ' + qs.length;
      $('#qpDone').textContent = 'Answered ' + answered;
      $('#qpRx').textContent = reactions ? `${reactions} reaction${reactions === 1 ? '' : 's'}` : 'No reactions yet';
      // the guest's phone
      gqList.innerHTML = list.map(q => `<li><button type="button" class="gq-up" data-qa="up" data-id="${q.id}" aria-pressed="${mineUp.has(q.id)}" aria-label="Upvote, ${q.votes} so far">${q.votes}</button><div>${esc(q.text)}<small>${esc(q.who)} · ${q.ago}</small>${q.id === onScreen ? '<span class="gq-tag">On screen now</span>' : ''}</div></li>`).join('')
        || '<li><div>No questions yet. Ask the first one.</div></li>';
      $('#gqCount').textContent = qs.length + ' open';
      $('#gTabN').textContent = qs.length;
      if (key) { const again = $(`[data-qa="${key[0]}"][data-id="${key[1]}"]`, sec); if (again) again.focus(); }
    }
    function react(e) {
      const s = document.createElement('span');
      s.className = 'rx';
      s.textContent = e;
      s.style.right = (60 + Math.random() * 170) + 'px';
      slide.append(s);
      setTimeout(() => s.remove(), 2600);
      reactions++;
      $('#qpRx').textContent = `${reactions} reaction${reactions === 1 ? '' : 's'}`;
    }
    sec.addEventListener('click', e => {
      const b = e.target.closest('[data-qa]');
      if (!b) return;
      const a = b.dataset.qa, id = +b.dataset.id;
      if (a === 'rx') return react(RX[id]);
      if (a === 'tab') {
        const qsTab = b.dataset.id === 'qs';
        $('#gPaneQs').hidden = !qsTab;
        $('#gPaneSlide').hidden = qsTab;
        $$('.g-tabs button', sec).forEach(t => t.setAttribute('aria-selected', t === b));
        return;
      }
      const q = qs.find(x => x.id === id);
      if (!q) return;
      if (a === 'show') onScreen = onScreen === id ? null : id;
      else if (a === 'done') { qs = qs.filter(x => x !== q); answered++; if (onScreen === id) onScreen = null; }
      else if (a === 'up') { if (mineUp.delete(id)) q.votes--; else { mineUp.add(id); q.votes++; } }
      draw();
    });
    $('#gqAsk').addEventListener('submit', e => {
      e.preventDefault();
      const input = $('input', e.currentTarget);
      const text = input.value.trim();
      if (!text) return;
      qs.push({ id: nextId++, text, votes: 0, who: 'Anonymous', ago: 'just now' });
      input.value = '';
      draw();
    });
    draw();
    // The rest of the room upvotes and reacts while the section is on screen.
    function schedule() {
      clearTimeout(timer);
      if (!visible || reduced) return;
      timer = setTimeout(() => {
        if (Math.random() < .6 || !qs.length) react(RX[Math.floor(Math.random() * RX.length)]);
        else { qs[Math.floor(Math.random() * Math.min(3, qs.length))].votes++; draw(); }
        schedule();
      }, 1400 + Math.random() * 1600);
    }
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; schedule(); }, { threshold: .2 }).observe(slide.parentElement);
  }

  /* ---------------------------------------------------------------- template editor (SW-50) */
  {
    const ed = $('#editor');
    const prev = $('#edPreview');
    const pairs = $('#edPairs'), check = $('#edCheck'), pub = $('#edPublish');
    // The made-up Northwind logo goes in the corner of each preview slide. The draft stamp would sit under it.
    $$('.sw', prev).forEach(sl => {
      $$('.stamp', sl).forEach(x => x.remove());
      sl.insertAdjacentHTML('afterbegin', '<div class="nw-mark"><i></i>Northwind</div>');
    });
    const ACC = { teal: '#0f766e', forest: '#3f6212', crimson: '#b4233c', sky: '#7dd3fc' };
    const PAPER = '#f6f8f7', INK = '#0f1f1c', WHITE = '#ffffff', BAR = 4.5;
    const lum = hex => {
      const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
      return .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
    };
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + .05) / (y + .05); };
    const tabs = $$('.ed-tabs [role="tab"]', ed);
    tabs.forEach(t => t.addEventListener('click', () => {
      tabs.forEach(x => x.setAttribute('aria-selected', x === t));
      $$('.ed-pane', ed).forEach(pn => pn.hidden = pn.dataset.pane !== t.dataset.ed);
    }));
    function radios(sel, key, apply) {
      const bs = $$(sel, ed);
      bs.forEach(b => b.addEventListener('click', () => {
        bs.forEach(x => x.setAttribute('aria-checked', x === b));
        apply(b.dataset[key]);
      }));
    }
    radios('[data-font]', 'font', v => { prev.dataset.font = v; draw(); });
    radios('[data-acc]', 'acc', v => { prev.dataset.brand = v; draw(); });
    const TICK = '<svg><use href="#i-check"/></svg>', CROSS = '<svg><use href="#i-x"/></svg>';
    function draw() {
      const acc = ACC[prev.dataset.brand];
      const serif = prev.dataset.font === 'serif';
      const list = [
        { name: 'Accent text on paper', fg: acc, bg: PAPER },
        { name: 'White text on the accent', fg: WHITE, bg: acc },
        { name: 'Body text on paper', fg: INK, bg: PAPER },
      ].map(x => ({ ...x, r: ratio(x.fg, x.bg) }));
      pairs.innerHTML = list.map(x => `<li class="${x.r >= BAR ? 'good' : 'bad'}"><span class="chip2" style="color:${x.fg};background:${x.bg}">Aa</span><span>${x.name}</span><em>${x.r.toFixed(1)}:1 ${x.r >= BAR ? '✓' : '✗'}</em></li>`).join('');
      const worst = list.reduce((a, b) => (b.r < a.r ? b : a));
      const contrastOk = worst.r >= BAR;
      const items = [
        [true, 'Fonts are yours to serve', serif ? 'You confirmed the licence for Fraunces.' : 'Plus Jakarta Sans is built in.'],
        [true, 'Fonts fit the layouts', serif ? 'Fraunces measures 0.55 em, inside 0.45 to 0.70.' : 'Built-in fonts always fit.'],
        [contrastOk, 'Every colour pair passes contrast', contrastOk ? `The lowest is ${worst.r.toFixed(1)}:1.` : `${worst.name} is ${worst.r.toFixed(1)}:1. It needs ${BAR}:1.`],
        [true, 'Logos for light and dark slides', 'logo.svg and logo-dark.svg'],
      ];
      check.innerHTML = items.map(([ok, h, sm]) => `<li class="${ok ? '' : 'bad'}">${ok ? TICK : CROSS}<span>${h}<small>${sm}</small></span></li>`).join('')
        + (contrastOk ? '<li class="ed-verdict">Ready to publish</li>' : '<li class="ed-verdict bad">Fix 1 item to publish</li>');
      pub.classList.toggle('off', !contrastOk);
    }
    draw();
  }

  /* ---------------------------------------------------------------- word cloud (SW-8) */
  {
    const sec = $('#words');
    const box = $('#cloudScreen [data-wc-box]');
    const rows = $('#wcRows'), mineEl = $('#wcMine'), msg = $('#wcMsg'), form = $('#wcAsk'), input = $('input', form);
    const SEED = { relieved: 9, stressful: 7, slow: 6, scary: 5, fine: 4, late: 4, smooth: 3, chaotic: 3, proud: 2, endless: 2, tired: 2, quick: 1, messy: 1, calm: 1 };
    const POOL = Object.entries(SEED);
    const BLOCKED = new Set(['damn', 'crap', 'hell']);
    const INKS = ['var(--t-acc)', 'var(--t-acc-ink)', 'var(--t-ink)', 'var(--t-dd)', 'var(--t-muted)'];
    const JOINED = 41;
    let words, mine, guests, open, round = 1, timer = 0, visible = false;
    const spans = new Map();
    const key = w => w.trim().replace(/\s+/g, ' ').toLowerCase();

    function layout() {
      const W = box.offsetWidth || 1680, H = box.offsetHeight || 560;
      const shown = [...words.values()].filter(w => !w.hidden && w.count > 0).sort((a, b) => b.count - a.count || a.k.localeCompare(b.k));
      const max = shown.length ? shown[0].count : 1;
      const placed = [];
      const out = new Map();
      shown.forEach((w, i) => {
        const size = Math.round(44 + (w.count / max) * 116);
        const bw = w.text.length * size * .6 + 24, bh = size * 1.05 + 10;
        for (let t = 0; t < 400; t += .3) {
          const x = W / 2 + Math.cos(t) * t * 9, y = H / 2 + Math.sin(t) * t * 5;
          const r = { l: x - bw / 2, r: x + bw / 2, t: y - bh / 2, b: y + bh / 2 };
          if (r.l < 0 || r.r > W || r.t < 0 || r.b > H) continue;
          if (placed.some(q => r.l < q.r && r.r > q.l && r.t < q.b && r.b > q.t)) continue;
          placed.push(r);
          out.set(w.k, { x, y, size, ink: INKS[i % INKS.length] });
          break;
        }
      });
      return out;
    }
    function draw() {
      const pos = layout();
      for (const [k, sp] of spans) if (!pos.has(k)) { sp.remove(); spans.delete(k); }
      for (const [k, p] of pos) {
        let sp = spans.get(k);
        if (!sp) {
          sp = document.createElement('span');
          sp.className = 'new';
          sp.textContent = words.get(k).text;
          box.append(sp);
          spans.set(k, sp);
          setTimeout(() => sp.classList.remove('new'), 600);
        }
        Object.assign(sp.style, { left: p.x + 'px', top: p.y + 'px', fontSize: p.size + 'px', color: p.ink });
      }
      // the presenter's panel
      const list = [...words.values()].sort((a, b) => b.count - a.count || a.k.localeCompare(b.k)).slice(0, 5);
      rows.innerHTML = list.map(w => `<li class="${w.hidden ? 'hid' : ''}"><span>${esc(w.text)}</span><em>${w.count}</em><button type="button" class="pbtn sm" data-wc="${w.hidden ? 'restore' : 'hide'}" data-k="${esc(w.k)}">${w.hidden ? 'Restore' : 'Hide'}</button></li>`).join('')
        || '<li><span>No words yet.</span></li>';
      $('#wcN').textContent = guests;
      const st = $('#wcState');
      st.textContent = open ? 'Open' : 'Closed';
      st.classList.toggle('closed', !open);
      $('#wcRound').textContent = 'round ' + round;
      $('[data-wc="close"]', sec).hidden = !open;
      $('[data-wc="round"]', sec).hidden = open;
      // the guest's phone
      mineEl.innerHTML = mine.map(m => `<span>${esc(words.get(m) ? words.get(m).text : m)}</span>`).join('');
      input.disabled = !open || mine.length >= 3;
      input.placeholder = !open ? 'Closed' : mine.length >= 3 ? 'Three words sent' : 'A word';
    }
    function add(text) {
      const k = key(text);
      const w = words.get(k);
      if (w) w.count++; else words.set(k, { k, text: text.trim().replace(/\s+/g, ' '), count: 1, hidden: false });
      return k;
    }
    function start(seeded) {
      words = new Map();
      mine = [];
      guests = 0;
      open = true;
      spans.forEach(sp => sp.remove());
      spans.clear();
      if (seeded) {
        for (const [w, n] of POOL) for (let i = 0; i < (reduced ? n : Math.ceil(n / 2)); i++) add(w);
        guests = reduced ? 31 : 16;
      }
      msg.innerHTML = '<span>Send up to three words. Nobody sees who sent which.</span>';
      draw();
      schedule();
    }
    form.addEventListener('submit', e => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text || !open || mine.length >= 3) return;
      if (BLOCKED.has(key(text))) { msg.innerHTML = '<b class="miss">That word isn\'t allowed</b><span>Try another one.</span>'; return; }
      if (mine.includes(key(text))) { msg.innerHTML = '<span>You already sent that one.</span>'; return; }
      if (!mine.length) guests++;
      mine.push(add(text));
      input.value = '';
      msg.innerHTML = `<b>✓ Sent</b><span>${mine.length === 3 ? 'That\'s your three.' : 'Send another, or watch the big screen.'}</span>`;
      draw();
      if (!input.disabled) input.focus();
    });
    sec.addEventListener('click', e => {
      const b = e.target.closest('[data-wc]');
      if (!b) return;
      const a = b.dataset.wc;
      if (a === 'close') { open = false; clearTimeout(timer); msg.innerHTML = '<b class="plain">Closed</b><span>Thanks for your words.</span>'; draw(); $('[data-wc="round"]', sec).focus(); }
      else if (a === 'round') { round++; start(false); $('[data-wc="close"]', sec).focus(); }
      else { const w = words.get(b.dataset.k); if (w) { w.hidden = a === 'hide'; draw(); } }
    });
    // The rest of the room sends words while the cloud is open and on screen.
    function schedule() {
      clearTimeout(timer);
      if (!open || !visible || reduced || guests >= JOINED) return;
      timer = setTimeout(() => {
        const total = POOL.reduce((a, [, n]) => a + n, 0);
        let r = Math.random() * total, i = 0;
        while (r > POOL[i][1]) r -= POOL[i++][1];
        add(POOL[i][0]);
        if (Math.random() < .45) guests++;
        draw();
        schedule();
      }, 700 + Math.random() * 900);
    }
    start(true);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) draw(); schedule(); }, { threshold: .2 }).observe(box.closest('.frame'));
  }

  /* ---------------------------------------------------------------- languages: slides, subtitles and listening (SW-942) */
  {
    const sec = $('#languages');
    const NAME = { en: 'English', th: 'ไทย', ja: '日本語', es: 'Español' };
    const CHIP = { en: 'EN', th: 'ไทย', ja: '日本語', es: 'ES' };
    const VOICE = { th: 'th-TH', ja: 'ja-JP', es: 'es-ES', en: 'en-GB' };
    // The "cards" slide (slide 15) as an agent's translate_slides would leave it. Japanese is missing one line,
    // which falls back to English, as a partly translated deck does.
    const DECKS = { en: 'Ship smaller', th: 'ส่งงานให้เล็กลง', ja: '小さく出荷する', es: 'Entregar en pequeño' };
    const PARTS_IN = {
      th: ['ต้นทุน', 'หั่นงาน', 'ส่งงาน', 'ทำให้ยั่งยืน'],
      ja: ['コスト', '小さく切る', '出荷する', '定着させる'],
      es: ['El coste', 'Divídelo', 'Entrégalo', 'Que se quede'],
    };
    const CARDS = {
      th: { kicker: 'ใครทำอะไร', h: 'ทุกคนเปลี่ยนนิสัยหนึ่งอย่าง', cards: [
        ['โปรดักต์', 'เขียนประโยคเดโมก่อน', 'ทุกสตอรีเริ่มด้วย "ตอนนี้ลูกค้าสามารถ …"'],
        ['วิศวกรรม', 'เมิร์จทุกวัน หลังแฟล็ก', 'พูลรีเควสต์เล็ก ๆ ที่รีวิวจบได้ในครั้งเดียว'],
        ['ดีไซน์', 'ออกแบบเวอร์ชันบางด้วย', 'รีลีส 1 ต้องมีดีไซน์ ไม่ใช่แค่ภาพสุดท้าย']] },
      ja: { kicker: '誰が何をするか', h: '全員が習慣をひとつ変える', cards: [
        ['プロダクト', 'デモの一文を先に書く', 'どのストーリーも「これでお客様は…できる」から始める。'],
        ['エンジニアリング', '毎日マージ、フラグの裏で', '一度で読み切れる小さなプルリクエスト。'],
        ['デザイン', '薄い版もデザインする', null]] },
      es: { kicker: 'Quién hace qué', h: 'Cada persona cambia un hábito', cards: [
        ['Producto', 'Escribe primero la frase de la demo', 'Cada historia empieza con «Ahora un cliente puede…».'],
        ['Ingeniería', 'Integra cada día, tras un flag', 'Pull requests pequeñas que se revisan de una sentada.'],
        ['Diseño', 'Diseña también la versión mínima', 'La versión 1 necesita un diseño, no solo la visión final.']] },
    };
    const cardsAt = byLayout('cards');
    function slideIn(lang) {
      const s = slides[cardsAt].cloneNode(true);
      const t = CARDS[lang];
      if (!t) return s;
      $('.kicker', s).textContent = t.kicker;
      $('h2.h', s).textContent = t.h;
      $$('.rcard', s).forEach((c, k) => {
        const [badge, h, p] = t.cards[k];
        $('.badge', c).textContent = badge;
        $('h4', c).textContent = h;
        if (p) $('p', c).textContent = p;
      });
      $$('.snav span', s).forEach((sp, k) => sp.textContent = PARTS_IN[lang][k]);
      const foot = $('.sfoot span', s);
      if (foot) foot.innerHTML = `<b>${cardsAt + 1}</b> / ${N} · ${DECKS[lang]} · Sam Rivera`;
      return s;
    }
    function setGuest(scope, lang) {
      $$('[data-lg-slide]', scope).forEach(f => mountEl(f, slideIn(lang)));
      $$('[data-lg-chip]', scope).forEach(c => c.textContent = CHIP[lang]);
      $$('[data-lg-title]', scope).forEach(c => c.textContent = DECKS[lang]);
      const fall = $('[data-lg-fall]', scope);
      if (fall) fall.hidden = lang !== 'ja';
    }

    // What Sam says over slide 15. Line 3 is spoken in Thai: a mixed talk, translated from the language heard.
    const LINES = [
      { from: 'en', en: 'Everyone in this room changes one habit.', th: 'ทุกคนในห้องนี้เปลี่ยนนิสัยหนึ่งอย่าง', ja: 'この部屋の全員が、習慣をひとつ変えます。', es: 'Cada persona en esta sala cambia un hábito.' },
      { from: 'en', en: 'Product writes the demo sentence before the story.', th: 'โปรดักต์เขียนประโยคเดโมก่อนเขียนสตอรี', ja: 'プロダクトは、ストーリーの前にデモの一文を書きます。', es: 'Producto escribe la frase de la demo antes que la historia.' },
      { from: 'th', th: 'วิศวกรเมิร์จทุกวัน โดยซ่อนไว้หลังแฟล็ก', en: 'Engineers merge every day, hidden behind a flag.', ja: 'エンジニアは毎日マージし、フラグの裏に隠します。', es: 'Los ingenieros integran cada día, ocultos tras un flag.' },
      { from: 'en', en: 'And design draws the thin version, not only the final one.', th: 'และดีไซน์ก็วาดเวอร์ชันบาง ไม่ใช่แค่เวอร์ชันสุดท้าย', ja: 'そしてデザインは、最終版だけでなく薄い版も描きます。', es: 'Y diseño dibuja la versión mínima, no solo la final.' },
      { from: 'en', en: 'Pick yours before you leave today.', th: 'เลือกของคุณก่อนกลับวันนี้', ja: '今日帰る前に、自分のものを選んでください。', es: 'Elige el tuyo antes de irte hoy.' },
    ];
    const words = (text, lang) => lang === 'th' || lang === 'ja' ? [...text.matchAll(/.{1,4}/gu)].map(m => m[0]) : text.split(' ').map((w, k) => (k ? ' ' : '') + w);

    const [lvSlides, lvSubs, lvListen] = $$('.lv', sec);
    const state = { slides: 'en', subs: 'th', listen: 'th' };
    let heard = [];      // finals so far: indexes into LINES
    let partial = null;  // { i, text } while Sam is mid-sentence

    function drawSubs() {
      const lang = state.subs;
      const live = partial && partial.from === lang;
      const finals = heard.slice(live ? -1 : -2).map(i => LINES[i][lang]);
      const html = finals.map(t => `<p class="old">${esc(t)}</p>`);
      if (live) html.push(`<p>${esc(partial.text)}<span class="part"> …</span></p>`);
      else if (html.length) html[html.length - 1] = html[html.length - 1].replace(' class="old"', '');
      $('[data-sub-lines]', lvSubs).innerHTML = html.join('');
      const from = live ? lang : heard.length ? LINES[heard[heard.length - 1]].from : 'en';
      $('[data-sub-head]', lvSubs).textContent = from === lang ? 'Subtitles · live' : `Subtitles · translated from ${NAME[from]}`;
    }
    function drawListen() {
      const lang = state.listen;
      const read = heard.filter(i => LINES[i].from !== lang).slice(-2);
      const [a, b] = read.length === 2 ? read : [read[0], undefined];
      const lines = [a !== undefined && ['reading', LINES[a][lang]], b !== undefined && ['next', LINES[b][lang]]].filter(Boolean);
      $('[data-listen-lines]', lvListen).innerHTML = lines.map(([c, t]) => `<p class="${c}">${esc(t)}</p>`).join('');
      $('[data-land-cap]', lvListen).innerHTML = lines.map(([c, t]) => `<span class="${c}">${esc(t)}</span>`).join('');
      $('[data-listen-head]', lvListen).textContent = `Listening · ${CHIP[lang]}`;
    }
    function drawTicker() {
      const src = partial || (heard.length ? { from: LINES[heard[heard.length - 1]].from, text: LINES[heard[heard.length - 1]][LINES[heard[heard.length - 1]].from] } : null);
      $('[data-sp-words]', lvSubs).textContent = src ? src.text : '…';
      $('[data-sp-tag]', lvSubs).textContent = src ? CHIP[src.from] : 'EN';
    }
    const drawAll = () => { drawSubs(); drawListen(); drawTicker(); };

    function pick(scope, key) {
      const group = $(`[data-lg-pick="${key}"]`, scope);
      group.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b) return;
        $$('button', group).forEach(x => x.setAttribute('aria-checked', String(x === b)));
        state[key] = b.dataset.lang;
        setGuest(scope, state[key]);
        drawAll();
      });
      setGuest(scope, state[key]);
    }
    pick(lvSlides, 'slides');
    pick(lvSubs, 'subs');
    pick(lvListen, 'listen');

    // Sam talks: each line's words arrive one by one, then the line is final and every language gets it.
    let next = 0, timer = 0, visible = false, running = false;
    if (reduced) { heard = [0, 1, 2]; drawAll(); }
    else {
      heard = [0];
      drawAll();
      next = 1;
    }
    async function speakLine() {
      const line = LINES[next];
      const ws = words(line[line.from], line.from);
      let text = '';
      for (const w of ws) {
        if (!visible) return;
        text += w;
        partial = { from: line.from, text };
        drawSubs(); drawTicker();
        await sleep(line.from === 'en' ? 170 : 120);
      }
      partial = null;
      heard.push(next);
      if (heard.length > 6) heard = heard.slice(-6);
      next = (next + 1) % LINES.length;
      drawAll();
    }
    async function loop() {
      clearTimeout(timer);
      if (running || !visible || reduced || document.hidden) return;
      running = true;
      await speakLine();
      running = false;
      if (visible) timer = setTimeout(loop, 2200);
    }
    const seen = new Set();
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => e.isIntersecting ? seen.add(e.target) : seen.delete(e.target));
      const was = visible;
      visible = seen.size > 0;
      if (visible && !was) loop();
    }, { threshold: .1 });
    io.observe(lvSubs); io.observe(lvListen);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && visible) loop(); });

    // Hear it: the browser's own voice reads the line being read, as the guest's phone would.
    const hearBtn = $('[data-hear]', lvListen), hearMsg = $('[data-hear-msg]', lvListen);
    const voices = () => new Promise(res => {
      const v = speechSynthesis.getVoices();
      if (v.length) return res(v);
      const t = setTimeout(() => res(speechSynthesis.getVoices()), 1200);
      speechSynthesis.addEventListener('voiceschanged', () => { clearTimeout(t); res(speechSynthesis.getVoices()); }, { once: true });
    });
    hearBtn.addEventListener('click', async () => {
      const lang = state.listen;
      const line = $('[data-listen-lines] p.reading', lvListen);
      if (!('speechSynthesis' in window)) { hearMsg.textContent = 'This browser can\'t read text aloud.'; return; }
      const want = VOICE[lang];
      const voice = (await voices()).find(v => v.lang.replace('_', '-').toLowerCase().startsWith(want.slice(0, 2)));
      if (!voice) { hearMsg.textContent = `This browser has no ${NAME[lang]} voice. A phone with none shows how to add one, and the subtitles carry on.`; return; }
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(line ? line.textContent : LINES[0][lang]);
      u.lang = want;
      u.voice = voice;
      speechSynthesis.speak(u);
      hearMsg.textContent = `Reading in ${NAME[lang]} with "${voice.name}".`;
    });
  }

  /* ---------------------------------------------------------------- copy buttons */
  $$('[data-copy], [data-copy-from]').forEach(b => b.addEventListener('click', async () => {
    const text = b.dataset.copy || $('#' + b.dataset.copyFrom).textContent.replace(/^#.*\n/m, '');
    try {
      await navigator.clipboard.writeText(text.trim());
      b.classList.add('done');
      const was = b.firstChild && b.firstChild.nodeType === 3 ? b.textContent : null;
      if (was) b.textContent = 'Copied';
      setTimeout(() => { b.classList.remove('done'); if (was) b.textContent = was; }, 1400);
    } catch {}
  }));

  /* ---------------------------------------------------------------- reveal on scroll */
  {
    const els = $$('.sec-head, .lv, .vs, .steps3, .session, .pal-picker, .pal-stage, .templates, .app, .feature-row, .tools-more, .attn, .pains-turn, .present-wrap, .journey4, .screens2, .roadmap, .start-grid, .pillars .cards');
    els.forEach(el => el.classList.add('rv'));
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    $$('.rv').forEach(el => io.observe(el));
  }
})();
